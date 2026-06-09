// ============================================================
// Chaos Goblins - Core Game Logic
// ============================================================

import {
  GameState,
  Player,
  DiceRoll,
  MilestoneId,
  RollModifier,
  ItemEffect,
  CHAOS_MIN,
  CHAOS_MAX,
  CHAOS_START,
} from "./types";
import {
  FORMS,
  POCKET_ITEMS,
  NEMESES,
  MISSION_GOALS,
  MISSION_TARGETS,
} from "./tables";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampChaos(value: number): number {
  return Math.max(CHAOS_MIN, Math.min(CHAOS_MAX, value));
}

// Recompute the Full Goblin / Full Human flags from a player's chaos value.
function refreshExtremes(player: Player): void {
  player.isFullGoblin = player.chaos >= CHAOS_MAX; // 8 = Full Goblin
  player.isFullHuman = player.chaos <= CHAOS_MIN; // 0 = Full Human
}

// ------------------------------------------------------------
// State Creation
// ------------------------------------------------------------

export function createInitialState(roomCode?: string): GameState {
  return {
    roomCode: roomCode || generateRoomCode(),
    phase: "lobby",
    players: [],
    suspicion: 1,
    suspicionEvent: { active: false, verbs: [] },
    milestones: [
      { id: "act1", label: "Act 1", completed: false },
      { id: "act2", label: "Act 2", completed: false },
      { id: "act3", label: "Act 3", completed: false },
    ],
    nemesis: null,
    nemesisIndex: null,
    missionGoal: null,
    missionGoalIndex: null,
    missionTarget: null,
    missionTargetIndex: null,
    hotlineUsed: false,
    adjectivePool: [],
    adjectivesSubmitted: [],
    itemPool: shuffle(POCKET_ITEMS),
    scene: 1,
    currentRoll: null,
  };
}

export function createPlayer(
  id: string,
  name: string,
  isGM: boolean,
  seat: number
): Player {
  return {
    id,
    name,
    isGM,
    seat,
    form: null,
    formIndex: null,
    adjectives: [],
    catchphrase: "",
    pocketItems: [],
    chaos: CHAOS_START,
    isFullGoblin: false,
    isFullHuman: false,
    nextRollModifier: null,
  };
}

// Assign the next available seat. GM is seat 0; players get 1..7 in join order.
export function nextSeat(state: GameState, isGM: boolean): number {
  if (isGM) return 0;
  const usedPlayerSeats = state.players
    .filter((p) => !p.isGM)
    .map((p) => p.seat);
  for (let s = 1; s <= 7; s++) {
    if (!usedPlayerSeats.includes(s)) return s;
  }
  return usedPlayerSeats.length + 1;
}

// ------------------------------------------------------------
// Character Creation (players roll their own)
// ------------------------------------------------------------

export function rollForm(
  state: GameState,
  playerId: string
): { state: GameState; roll: DiceRoll } {
  const result = rollDie(6);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");

  player.formIndex = result - 1;
  player.form = FORMS[result - 1];

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: "table",
    dieSize: 6,
    result,
    target: null,
    outcome: null,
    modifier: null,
    rolls: [result],
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

export function dealAdjectives(state: GameState): GameState {
  const pool = shuffle(state.adjectivePool);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);
  let idx = 0;
  for (const player of nonGMPlayers) {
    player.adjectives = pool.slice(idx, idx + 3);
    idx += 3;
  }
  return state;
}

// Draw one unique item from the shared pool (no repeats across players).
export function rollPocketItem(
  state: GameState,
  playerId: string
): { state: GameState; roll: DiceRoll } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  if (player.pocketItems.length >= 3) throw new Error("Already has 3 items");
  if (state.itemPool.length === 0) throw new Error("No items left in pool");

  const item = state.itemPool.shift()!;
  player.pocketItems.push(item);

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: "table",
    dieSize: 20,
    result: POCKET_ITEMS.indexOf(item) + 1,
    target: null,
    outcome: null,
    modifier: null,
    rolls: [],
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

// ------------------------------------------------------------
// Mission Setup (GM rolls, rerollable)
// ------------------------------------------------------------

export function rollMission(state: GameState): {
  state: GameState;
  goalRoll: DiceRoll;
  targetRoll: DiceRoll;
} {
  const goalResult = rollDie(6);
  const targetResult = rollDie(6);

  state.missionGoalIndex = goalResult - 1;
  state.missionGoal = MISSION_GOALS[goalResult - 1];
  state.missionTargetIndex = targetResult - 1;
  state.missionTarget = MISSION_TARGETS[targetResult - 1];

  const base = Date.now();
  const goalRoll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result: goalResult,
    target: null,
    outcome: null,
    modifier: null,
    rolls: [goalResult],
    timestamp: base,
  };
  const targetRoll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result: targetResult,
    target: null,
    outcome: null,
    modifier: null,
    rolls: [targetResult],
    timestamp: base + 1,
  };

  state.currentRoll = targetRoll;
  return { state, goalRoll, targetRoll };
}

export function rollNemesis(state: GameState): {
  state: GameState;
  roll: DiceRoll;
} {
  const result = rollDie(6);
  const nemesisData = NEMESES[result - 1];

  state.nemesisIndex = result - 1;
  state.nemesis = {
    name: nemesisData.name,
    description: nemesisData.description,
    defeated: false,
  };

  const roll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result,
    target: null,
    outcome: null,
    modifier: null,
    rolls: [result],
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

export function toggleNemesisDefeated(state: GameState): GameState {
  if (state.nemesis) {
    state.nemesis.defeated = !state.nemesis.defeated;
  }
  return state;
}

// ------------------------------------------------------------
// Gameplay Rolls (lean-in, d8)
// ------------------------------------------------------------
//
// Resolution on a d8 vs the player's chaos number N:
//   success/failure:  Civilized succeeds on OVER N, Goblin succeeds on UNDER N.
//   exact (= N):       CRITICAL (either type) -> suspicion -1, no chaos move.
//   chaos drift (lean-in):
//     Goblin  success -> +1 (toward 8 / Full Goblin)
//     Goblin  failure -> -1
//     Civil.  success -> -1 (toward 0 / Full Human)
//     Civil.  failure -> +1
//   suspicion: failure -> +1, critical -> -1, plain success -> no change.

function outcomeRank(
  result: number,
  chaos: number,
  rollType: "civilized" | "goblin"
): "success" | "failure" | "critical" {
  if (result === chaos) return "critical";
  if (rollType === "civilized") return result > chaos ? "success" : "failure";
  return result < chaos ? "success" : "failure"; // goblin
}

// How "good" an outcome is for the roller, for picking adv/disadv dice.
function outcomeScore(o: "success" | "failure" | "critical"): number {
  return o === "critical" ? 2 : o === "success" ? 1 : 0;
}

export function performRoll(
  state: GameState,
  playerId: string,
  rollType: "civilized" | "goblin"
): { state: GameState; roll: DiceRoll } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const modifier: RollModifier = player.nextRollModifier;
  // Consume the one-shot modifier.
  player.nextRollModifier = null;

  // Roll one die, or two for advantage/disadvantage.
  const rolls: number[] = [rollDie(8)];
  if (modifier) rolls.push(rollDie(8));

  let result: number;
  if (modifier === "advantage") {
    // keep the die with the best outcome for the roller
    result = rolls.reduce((best, r) =>
      outcomeScore(outcomeRank(r, player.chaos, rollType)) >
      outcomeScore(outcomeRank(best, player.chaos, rollType))
        ? r
        : best
    );
  } else if (modifier === "disadvantage") {
    result = rolls.reduce((worst, r) =>
      outcomeScore(outcomeRank(r, player.chaos, rollType)) <
      outcomeScore(outcomeRank(worst, player.chaos, rollType))
        ? r
        : worst
    );
  } else {
    result = rolls[0];
  }

  const outcome = outcomeRank(result, player.chaos, rollType);

  // Apply chaos drift (lean-in) + suspicion.
  if (outcome === "critical") {
    state.suspicion = Math.max(1, state.suspicion - 1);
  } else {
    const goblin = rollType === "goblin";
    const success = outcome === "success";
    // Goblin success +1 / fail -1 ; Civilized success -1 / fail +1
    const delta = goblin ? (success ? 1 : -1) : success ? -1 : 1;
    player.chaos = clampChaos(player.chaos + delta);
    if (outcome === "failure") {
      state.suspicion = Math.min(6, state.suspicion + 1);
      if (state.suspicion >= 6) triggerSuspicionEvent(state);
    }
  }

  refreshExtremes(player);

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: rollType,
    dieSize: 8,
    result,
    target: player.chaos,
    outcome,
    modifier,
    rolls,
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

// ------------------------------------------------------------
// Suspicion Verb Event
// ------------------------------------------------------------

function triggerSuspicionEvent(state: GameState): void {
  state.suspicionEvent = { active: true, verbs: [] };
}

export function submitVerb(
  state: GameState,
  playerId: string,
  verb: string
): GameState {
  if (!state.suspicionEvent.active) return state;
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.isGM) return state;
  if (state.suspicionEvent.verbs.some((v) => v.playerId === playerId)) return state;

  state.suspicionEvent.verbs.push({
    playerId,
    playerName: player.name,
    verb: verb.trim(),
  });
  return state;
}

export function resolveSuspicionEvent(state: GameState): GameState {
  state.suspicionEvent = { active: false, verbs: [] };
  state.suspicion = 1; // reset after the event
  return state;
}

// ------------------------------------------------------------
// Item Usage / Transfer
// ------------------------------------------------------------

export function useItem(
  state: GameState,
  playerId: string,
  itemIndex: number,
  effect: ItemEffect
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  if (itemIndex < 0 || itemIndex >= player.pocketItems.length)
    throw new Error("Invalid item");

  // Consume the item.
  player.pocketItems.splice(itemIndex, 1);

  if (effect === "chaos-up") {
    player.chaos = clampChaos(player.chaos + 1);
  } else if (effect === "chaos-down") {
    player.chaos = clampChaos(player.chaos - 1);
  } else if (effect === "suspicion-down") {
    state.suspicion = Math.max(1, state.suspicion - 1);
  }

  refreshExtremes(player);
  return state;
}

export function giveItem(
  state: GameState,
  fromPlayerId: string,
  itemIndex: number,
  toPlayerId: string
): GameState {
  const from = state.players.find((p) => p.id === fromPlayerId);
  const to = state.players.find((p) => p.id === toPlayerId);
  if (!from || !to) throw new Error("Player not found");
  if (itemIndex < 0 || itemIndex >= from.pocketItems.length)
    throw new Error("Invalid item");

  const [item] = from.pocketItems.splice(itemIndex, 1);
  to.pocketItems.push(item);
  return state;
}

export function gmAddItem(
  state: GameState,
  playerId: string,
  item: string
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  const trimmed = item.trim();
  if (trimmed) player.pocketItems.push(trimmed);
  return state;
}

export function gmRemoveItem(
  state: GameState,
  playerId: string,
  itemIndex: number
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  if (itemIndex < 0 || itemIndex >= player.pocketItems.length) return state;
  player.pocketItems.splice(itemIndex, 1);
  return state;
}

// ------------------------------------------------------------
// GM Actions
// ------------------------------------------------------------

export function setChaos(
  state: GameState,
  playerId: string,
  value: number
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  player.chaos = clampChaos(value);
  refreshExtremes(player);
  return state;
}

export function setAdvantage(
  state: GameState,
  playerId: string,
  modifier: RollModifier
): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  player.nextRollModifier = modifier;
  return state;
}

export function setSuspicion(state: GameState, value: number): GameState {
  state.suspicion = Math.max(1, Math.min(6, value));
  if (state.suspicion >= 6) triggerSuspicionEvent(state);
  return state;
}

export function toggleMilestone(
  state: GameState,
  milestoneId: MilestoneId
): GameState {
  const milestone = state.milestones.find((m) => m.id === milestoneId);
  if (milestone) milestone.completed = !milestone.completed;
  return state;
}

// Completing an Act clears any broken (Full Goblin / Full Human) players,
// snapping them back to the middle of the dial.
export function completeAct(
  state: GameState,
  milestoneId: MilestoneId
): GameState {
  const milestone = state.milestones.find((m) => m.id === milestoneId);
  if (milestone) milestone.completed = true;

  for (const player of state.players) {
    if (player.isFullGoblin || player.isFullHuman) {
      player.chaos = CHAOS_START;
      player.isFullGoblin = false;
      player.isFullHuman = false;
    }
  }

  // Win condition: all acts complete.
  if (state.milestones.every((m) => m.completed)) {
    state.phase = "game-over";
  }

  return state;
}

export function nextScene(state: GameState): GameState {
  state.scene += 1;
  return state;
}

export function useHotline(state: GameState): GameState {
  state.hotlineUsed = true;
  return state;
}
