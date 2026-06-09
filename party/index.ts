// ============================================================
// Chaos Goblins - PartyKit Server
// Handles room state and real-time sync
// ============================================================

import type * as Party from "partykit/server";
import {
  GameState,
  ClientMessage,
  ServerMessage,
} from "../src/lib/types";
import {
  createInitialState,
  createPlayer,
  nextSeat,
  rollForm,
  dealAdjectives,
  rollPocketItem,
  rollMission,
  rollNemesis,
  toggleNemesisDefeated,
  performRoll,
  useItem,
  giveItem,
  gmAddItem,
  gmRemoveItem,
  submitVerb,
  resolveSuspicionEvent,
  setChaos,
  setAdvantage,
  setSuspicion,
  toggleMilestone,
  completeAct,
  nextScene,
  useHotline,
  resetGame,
} from "../src/lib/gameLogic";

export default class ChaosGoblinsServer implements Party.Server {
  state: GameState;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState(room.id);
  }

  onConnect(conn: Party.Connection) {
    // Any connection (including the read-only overlay) receives state.
    this.send(conn, { type: "player-id", id: conn.id });
    this.send(conn, { type: "state", state: this.state });
  }

  onClose(conn: Party.Connection) {
    // Remove player only if still in the lobby.
    if (this.state.phase === "lobby") {
      this.state.players = this.state.players.filter((p) => p.id !== conn.id);
      this.broadcast({ type: "state", state: this.state });
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    const senderPlayer = this.state.players.find((p) => p.id === sender.id);

    switch (msg.type) {
      // ---- Lobby ----
      case "join": {
        if (this.state.phase !== "lobby") {
          this.send(sender, { type: "error", message: "Game already in progress" });
          return;
        }
        if (this.state.players.find((p) => p.id === sender.id)) return;

        const isGM = this.state.players.length === 0;
        const nonGMCount = this.state.players.filter((p) => !p.isGM).length;
        if (!isGM && nonGMCount >= 7) {
          this.send(sender, { type: "error", message: "Game is full (7 players max)" });
          return;
        }
        const seat = nextSeat(this.state, isGM);
        const player = createPlayer(sender.id, msg.name, isGM, seat);
        this.state.players.push(player);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "start-game": {
        if (!senderPlayer?.isGM) return;
        if (this.state.players.filter((p) => !p.isGM).length < 1) {
          this.send(sender, { type: "error", message: "Need at least 1 player besides GM" });
          return;
        }
        this.state.phase = "character-creation-form";
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-advance-phase": {
        if (!senderPlayer?.isGM) return;
        this.advancePhase();
        break;
      }

      // ---- Character creation: players roll their own ----
      case "player-roll-form": {
        if (!senderPlayer || senderPlayer.isGM) return;
        if (this.state.phase !== "character-creation-form") return;
        if (senderPlayer.form) return; // already rolled
        const { roll } = rollForm(this.state, sender.id);
        this.broadcast({ type: "roll-animation", roll });
        setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        break;
      }

      case "player-roll-item": {
        if (!senderPlayer || senderPlayer.isGM) return;
        if (this.state.phase !== "character-creation-pockets") return;
        if (senderPlayer.pocketItems.length >= 3) return;
        if (this.state.itemPool.length === 0) {
          this.send(sender, { type: "error", message: "No items left!" });
          return;
        }
        const { roll } = rollPocketItem(this.state, sender.id);
        this.broadcast({ type: "roll-animation", roll });
        setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        break;
      }

      case "submit-adjectives": {
        if (!senderPlayer || senderPlayer.isGM) return;
        if (this.state.adjectivesSubmitted.includes(sender.id)) return;

        this.state.adjectivePool.push(...msg.adjectives);
        this.state.adjectivesSubmitted.push(sender.id);

        const nonGMPlayers = this.state.players.filter((p) => !p.isGM);
        if (this.state.adjectivesSubmitted.length >= nonGMPlayers.length) {
          dealAdjectives(this.state);
        }
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "submit-catchphrase": {
        if (!senderPlayer || senderPlayer.isGM) return;
        senderPlayer.catchphrase = msg.catchphrase;
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      // ---- Mission / Nemesis (GM rolls) ----
      case "gm-roll-mission":
      case "gm-reroll-mission": {
        if (!senderPlayer?.isGM) return;
        if (this.state.phase !== "mission-setup") return;
        const { goalRoll, targetRoll } = rollMission(this.state);
        this.broadcast({ type: "roll-animation", roll: goalRoll });
        setTimeout(() => {
          this.broadcast({ type: "roll-animation", roll: targetRoll });
          setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        }, 1200);
        break;
      }

      case "gm-roll-nemesis":
      case "gm-reroll-nemesis": {
        if (!senderPlayer?.isGM) return;
        if (this.state.phase !== "mission-setup") return;
        const { roll } = rollNemesis(this.state);
        this.broadcast({ type: "roll-animation", roll });
        setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        break;
      }

      case "gm-toggle-nemesis-defeated": {
        if (!senderPlayer?.isGM) return;
        toggleNemesisDefeated(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      // ---- Gameplay: anyone rolls anytime ----
      case "player-roll": {
        if (!senderPlayer || senderPlayer.isGM) return;
        if (this.state.suspicionEvent.active) return; // paused during event
        const { roll } = performRoll(this.state, sender.id, msg.rollType);
        this.broadcast({ type: "roll-animation", roll });
        setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        break;
      }

      case "player-use-item": {
        if (!senderPlayer || senderPlayer.isGM) return;
        useItem(this.state, sender.id, msg.itemIndex, msg.effect);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "player-give-item": {
        if (!senderPlayer || senderPlayer.isGM) return;
        giveItem(this.state, sender.id, msg.itemIndex, msg.toPlayerId);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "submit-verb": {
        if (!senderPlayer || senderPlayer.isGM) return;
        submitVerb(this.state, sender.id, msg.verb);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-resolve-suspicion-event": {
        if (!senderPlayer?.isGM) return;
        resolveSuspicionEvent(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      // ---- GM controls ----
      case "gm-set-chaos": {
        if (!senderPlayer?.isGM) return;
        setChaos(this.state, msg.playerId, msg.value);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-set-advantage": {
        if (!senderPlayer?.isGM) return;
        setAdvantage(this.state, msg.playerId, msg.modifier);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-add-item": {
        if (!senderPlayer?.isGM) return;
        gmAddItem(this.state, msg.playerId, msg.item);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-remove-item": {
        if (!senderPlayer?.isGM) return;
        gmRemoveItem(this.state, msg.playerId, msg.itemIndex);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-set-suspicion": {
        if (!senderPlayer?.isGM) return;
        setSuspicion(this.state, msg.value);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-toggle-milestone": {
        if (!senderPlayer?.isGM) return;
        toggleMilestone(this.state, msg.milestoneId);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-complete-act": {
        if (!senderPlayer?.isGM) return;
        completeAct(this.state, msg.milestoneId);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-use-hotline": {
        if (!senderPlayer?.isGM) return;
        useHotline(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-next-scene": {
        if (!senderPlayer?.isGM) return;
        nextScene(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "play-again": {
        if (!senderPlayer?.isGM) return;
        resetGame(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }
    }
  }

  advancePhase() {
    const phases: GameState["phase"][] = [
      "lobby",
      "character-creation-form",
      "character-creation-description",
      "character-creation-pockets",
      "mission-setup",
      "gameplay",
      "game-over",
    ];

    const currentIndex = phases.indexOf(this.state.phase);
    if (currentIndex < phases.length - 1) {
      this.state.phase = phases[currentIndex + 1];
    }
    this.broadcast({ type: "state", state: this.state });
  }

  send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  broadcast(msg: ServerMessage) {
    this.room.broadcast(JSON.stringify(msg));
  }
}
