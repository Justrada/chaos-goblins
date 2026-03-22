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
  rollForm,
  dealAdjectives,
  rollObsession,
  rollPocketItem,
  rollMission,
  rollNemesis,
  performRoll,
  useItemForComfort,
  setChaos,
  setSuspicion,
  toggleMilestone,
  damageNemesis,
  nextScene,
  useHotline,
} from "../src/lib/gameLogic";

export default class ChaosGoblinsServer implements Party.Server {
  state: GameState;
  playerConnections: Map<string, Party.Connection> = new Map();

  constructor(readonly room: Party.Room) {
    this.state = createInitialState(room.id);
  }

  onConnect(conn: Party.Connection) {
    // Send current state to new connection
    this.send(conn, { type: "player-id", id: conn.id });
    this.send(conn, { type: "state", state: this.state });
  }

  onClose(conn: Party.Connection) {
    // Remove player if in lobby
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
      case "join": {
        if (this.state.phase !== "lobby") {
          this.send(sender, { type: "error", message: "Game already in progress" });
          return;
        }
        if (this.state.players.find((p) => p.id === sender.id)) return;

        const isGM = this.state.players.length === 0;
        const player = createPlayer(sender.id, msg.name, isGM);
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
        // Set spotlight to first non-GM player
        const firstPlayer = this.state.players.find((p) => !p.isGM);
        if (firstPlayer) this.state.spotlightPlayerId = firstPlayer.id;
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-roll": {
        if (!senderPlayer?.isGM) return;
        const targetPlayer = this.state.players.find((p) => p.id === msg.playerId);
        if (!targetPlayer) return;

        if (this.state.phase === "character-creation-form") {
          const { roll } = rollForm(this.state, msg.playerId);
          this.broadcast({ type: "roll-animation", roll });
          setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        } else if (this.state.phase === "character-creation-obsession") {
          const { roll } = rollObsession(this.state, msg.playerId);
          this.broadcast({ type: "roll-animation", roll });
          setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        } else if (this.state.phase === "character-creation-pockets") {
          const { roll } = rollPocketItem(this.state, msg.playerId);
          this.broadcast({ type: "roll-animation", roll });
          setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        }
        break;
      }

      case "gm-advance-phase": {
        if (!senderPlayer?.isGM) return;
        this.advancePhase();
        break;
      }

      case "gm-set-spotlight": {
        if (!senderPlayer?.isGM) return;
        this.state.spotlightPlayerId = msg.playerId;
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-set-chaos": {
        if (!senderPlayer?.isGM) return;
        setChaos(this.state, msg.playerId, msg.value);
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

      case "gm-damage-nemesis": {
        if (!senderPlayer?.isGM) return;
        damageNemesis(this.state);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-toggle-nemesis-active": {
        if (!senderPlayer?.isGM) return;
        if (this.state.nemesis) {
          this.state.nemesis.active = !this.state.nemesis.active;
        }
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

      case "player-roll": {
        if (!senderPlayer) return;
        if (senderPlayer.isGM) return;
        // Only spotlighted player can roll during gameplay
        if (this.state.phase === "gameplay" && this.state.spotlightPlayerId !== sender.id) return;

        const { roll } = performRoll(this.state, sender.id, msg.rollType);
        this.broadcast({ type: "roll-animation", roll });
        setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
        break;
      }

      case "player-use-item": {
        if (!senderPlayer || senderPlayer.isGM) return;
        useItemForComfort(this.state, sender.id, msg.itemIndex);
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "submit-adjectives": {
        if (!senderPlayer || senderPlayer.isGM) return;
        if (this.state.adjectivesSubmitted.includes(sender.id)) return;

        this.state.adjectivePool.push(...msg.adjectives);
        this.state.adjectivesSubmitted.push(sender.id);

        // Check if all non-GM players have submitted
        const nonGMPlayers = this.state.players.filter((p) => !p.isGM);
        if (this.state.adjectivesSubmitted.length >= nonGMPlayers.length) {
          dealAdjectives(this.state);
        }

        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "submit-description": {
        if (!senderPlayer || senderPlayer.isGM) return;
        senderPlayer.description = msg.description;
        this.broadcast({ type: "state", state: this.state });
        break;
      }

      case "gm-force-roll-result": {
        if (!senderPlayer?.isGM) return;
        // For mission/nemesis rolls during setup
        if (this.state.phase === "mission-setup") {
          if (!this.state.missionGoal) {
            const { goalRoll, targetRoll } = rollMission(this.state);
            this.broadcast({ type: "roll-animation", roll: goalRoll });
            setTimeout(() => {
              this.broadcast({ type: "roll-animation", roll: targetRoll });
              setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
            }, 1500);
          } else if (!this.state.nemesis) {
            const { roll } = rollNemesis(this.state);
            this.broadcast({ type: "roll-animation", roll });
            setTimeout(() => this.broadcast({ type: "state", state: this.state }), 50);
          }
        }
        break;
      }
    }
  }

  advancePhase() {
    const phases: GameState["phase"][] = [
      "lobby",
      "character-creation-form",
      "character-creation-description",
      "character-creation-obsession",
      "character-creation-pockets",
      "mission-setup",
      "gameplay",
      "game-over",
    ];

    const currentIndex = phases.indexOf(this.state.phase);
    if (currentIndex < phases.length - 1) {
      this.state.phase = phases[currentIndex + 1];

      // Reset spotlight for new phase
      const firstPlayer = this.state.players.find((p) => !p.isGM);
      if (firstPlayer) this.state.spotlightPlayerId = firstPlayer.id;
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
