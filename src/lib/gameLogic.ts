// ============================================================
// Chaos Goblins - Core Game Logic
// ============================================================

import {
  GameState,
  Player,
  DiceRoll,
  MilestoneId,
} from "./types";
import {
  FORMS,
  OBSESSIONS,
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

// ------------------------------------------------------------
// State Creation
// ------------------------------------------------------------

export function createInitialState(roomCode?: string): GameState {
  return {
    roomCode: roomCode || generateRoomCode(),
    phase: "lobby",
    players: [],
    spotlightPlayerId: null,
    suspicion: 1,
    milestones: [
      { id: "infiltration", label: "Infiltration", completed: false },
      { id: "heist", label: "The Heist", completed: false },
      { id: "escape", label: "The Escape", completed: false },
    ],
    nemesis: null,
    nemesisIndex: null,
    specialists: [],
    missionGoal: null,
    missionGoalIndex: null,
    missionTarget: null,
    missionTargetIndex: null,
    hotlineUsed: false,
    adjectivePool: [],
    adjectivesSubmitted: [],
    scene: 1,
    currentRoll: null,
  };
}

export function createPlayer(id: string, name: string, isGM: boolean): Player {
  return {
    id,
    name,
    isGM,
    form: null,
    formIndex: null,
    adjectives: [],
    description: "",
    obsession: null,
    obsessionIndex: null,
    pocketItems: [],
    chaos: 4, // starts at 4 per finalized rules
    isFullGoblin: false,
    isAssimilated: false,
  };
}

// ------------------------------------------------------------
// Character Creation
// ------------------------------------------------------------

export function rollForm(state: GameState, playerId: string): { state: GameState; roll: DiceRoll } {
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
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

export function dealAdjectives(state: GameState): GameState {
  // Shuffle the pool
  const pool = [...state.adjectivePool];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Deal 3 to each non-GM player
  const nonGMPlayers = state.players.filter((p) => !p.isGM);
  let idx = 0;
  for (const player of nonGMPlayers) {
    player.adjectives = pool.slice(idx, idx + 3);
    idx += 3;
  }

  return state;
}

export function rollObsession(state: GameState, playerId: string): { state: GameState; roll: DiceRoll } {
  const result = rollDie(6);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");

  player.obsessionIndex = result - 1;
  player.obsession = OBSESSIONS[result - 1];

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: "table",
    dieSize: 6,
    result,
    target: null,
    outcome: null,
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

export function rollPocketItem(state: GameState, playerId: string): { state: GameState; roll: DiceRoll } {
  const result = rollDie(20);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");

  player.pocketItems.push(POCKET_ITEMS[result - 1]);

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: "table",
    dieSize: 20,
    result,
    target: null,
    outcome: null,
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

// ------------------------------------------------------------
// Mission Setup
// ------------------------------------------------------------

export function rollMission(state: GameState): { state: GameState; goalRoll: DiceRoll; targetRoll: DiceRoll } {
  const goalResult = rollDie(6);
  const targetResult = rollDie(6);

  state.missionGoalIndex = goalResult - 1;
  state.missionGoal = MISSION_GOALS[goalResult - 1];
  state.missionTargetIndex = targetResult - 1;
  state.missionTarget = MISSION_TARGETS[targetResult - 1];

  const goalRoll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result: goalResult,
    target: null,
    outcome: null,
    timestamp: Date.now(),
  };

  const targetRoll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result: targetResult,
    target: null,
    outcome: null,
    timestamp: Date.now() + 1,
  };

  state.currentRoll = targetRoll;
  return { state, goalRoll, targetRoll };
}

export function rollNemesis(state: GameState): { state: GameState; roll: DiceRoll } {
  const result = rollDie(6);
  const nemesisData = NEMESES[result - 1];

  state.nemesisIndex = result - 1;
  state.nemesis = {
    name: nemesisData.name,
    description: nemesisData.description,
    resolve: 3,
    active: true,
  };

  const roll: DiceRoll = {
    playerId: "gm",
    playerName: "GM",
    type: "table",
    dieSize: 6,
    result,
    target: null,
    outcome: null,
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

// ------------------------------------------------------------
// Gameplay Rolls
// ------------------------------------------------------------

export function performRoll(
  state: GameState,
  playerId: string,
  rollType: "civilized" | "goblin"
): { state: GameState; roll: DiceRoll } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");

  // Check if nemesis gives disadvantage on civilized
  const hasDisadvantage =
    rollType === "civilized" &&
    state.nemesis &&
    state.nemesis.active &&
    state.nemesis.resolve > 0;

  let result: number;
  if (hasDisadvantage) {
    const r1 = rollDie(6);
    const r2 = rollDie(6);
    result = Math.min(r1, r2); // keep worst for civilized (want high)
  } else {
    result = rollDie(6);
  }

  // Determine outcome
  let outcome: "success" | "failure" | "critical";
  if (result === player.chaos) {
    outcome = "critical";
  } else if (rollType === "civilized") {
    outcome = result > player.chaos ? "success" : "failure";
  } else {
    // goblin
    outcome = result < player.chaos ? "success" : "failure";
  }

  // Apply effects
  if (outcome === "critical") {
    // Suspicion drops by 1, min 1
    state.suspicion = Math.max(1, state.suspicion - 1);
  } else if (outcome === "failure") {
    if (rollType === "civilized") {
      player.chaos = Math.min(6, player.chaos + 1);
    } else {
      player.chaos = Math.max(0, player.chaos - 1);
    }
    // Suspicion increases
    state.suspicion = Math.min(6, state.suspicion + 1);

    // Check for suspicion 6
    if (state.suspicion >= 6) {
      handleSuspicionSix(state);
    }
  }

  // Check for chaos extremes
  if (player.chaos >= 6) {
    player.isFullGoblin = true;
    player.chaos = 6;
  } else if (player.chaos <= 0) {
    player.isAssimilated = true;
    player.chaos = 0;
  }

  const roll: DiceRoll = {
    playerId,
    playerName: player.name,
    type: rollType,
    dieSize: 6,
    result,
    target: player.chaos,
    outcome,
    timestamp: Date.now(),
  };

  state.currentRoll = roll;
  return { state, roll };
}

function handleSuspicionSix(state: GameState): void {
  // Spawn specialist
  const nextId = state.specialists.length + 1;
  state.specialists.push({ id: nextId, active: true });
  // Reset suspicion to 3
  state.suspicion = 3;
}

// ------------------------------------------------------------
// Item Usage
// ------------------------------------------------------------

export function useItemForComfort(state: GameState, playerId: string, itemIndex: number): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  if (itemIndex < 0 || itemIndex >= player.pocketItems.length) throw new Error("Invalid item");

  // Remove item
  player.pocketItems.splice(itemIndex, 1);
  // Lower chaos by 1
  player.chaos = Math.max(0, player.chaos - 1);
  // Suspicion +1 if anyone sees (always, in the app)
  state.suspicion = Math.min(6, state.suspicion + 1);

  if (state.suspicion >= 6) {
    handleSuspicionSix(state);
  }

  // Check assimilation
  if (player.chaos <= 0) {
    player.isAssimilated = true;
    player.chaos = 0;
  }

  return state;
}

// ------------------------------------------------------------
// GM Actions
// ------------------------------------------------------------

export function setChaos(state: GameState, playerId: string, value: number): GameState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("Player not found");
  player.chaos = Math.max(0, Math.min(6, value));
  player.isFullGoblin = player.chaos >= 6;
  player.isAssimilated = player.chaos <= 0;
  return state;
}

export function setSuspicion(state: GameState, value: number): GameState {
  state.suspicion = Math.max(1, Math.min(6, value));
  if (state.suspicion >= 6) {
    handleSuspicionSix(state);
  }
  return state;
}

export function toggleMilestone(state: GameState, milestoneId: MilestoneId): GameState {
  const milestone = state.milestones.find((m) => m.id === milestoneId);
  if (milestone) {
    milestone.completed = !milestone.completed;
  }

  // Check win condition
  if (state.milestones.every((m) => m.completed)) {
    state.phase = "game-over";
  }

  return state;
}

export function damageNemesis(state: GameState): GameState {
  if (!state.nemesis) return state;
  state.nemesis.resolve = Math.max(0, state.nemesis.resolve - 1);
  if (state.nemesis.resolve <= 0) {
    state.nemesis.active = false;
  }
  return state;
}

export function nextScene(state: GameState): GameState {
  state.scene += 1;
  // Nemesis returns at start of new scene if resolve > 0
  if (state.nemesis && state.nemesis.resolve > 0) {
    state.nemesis.active = true;
  }
  return state;
}

export function useHotline(state: GameState): GameState {
  state.hotlineUsed = true;
  return state;
}
