// ============================================================
// Chaos Goblins - Game State Types
// ============================================================

export type GamePhase =
  | "lobby"
  | "character-creation-form"
  | "character-creation-description"
  | "character-creation-obsession"
  | "character-creation-pockets"
  | "mission-setup"
  | "gameplay"
  | "game-over";

export type MilestoneId = "infiltration" | "heist" | "escape";

export interface Milestone {
  id: MilestoneId;
  label: string;
  completed: boolean;
}

export interface Player {
  id: string;
  name: string;
  isGM: boolean;

  // Character
  form: string | null;
  formIndex: number | null;
  adjectives: string[];
  description: string;
  obsession: string | null;
  obsessionIndex: number | null;
  pocketItems: string[];

  // Stats
  chaos: number; // 0-6, starts at 4
  isFullGoblin: boolean; // chaos hit 6
  isAssimilated: boolean; // chaos hit 0
}

export interface Nemesis {
  name: string;
  description: string;
  resolve: number; // starts at 3
  active: boolean; // present in current scene
}

export interface Specialist {
  id: number;
  active: boolean;
}

export interface DiceRoll {
  playerId: string;
  playerName: string;
  type: "civilized" | "goblin" | "table";
  dieSize: number; // d6, d20
  result: number;
  target: number | null; // chaos number for comparison
  outcome: "success" | "failure" | "critical" | null; // null for table rolls
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  spotlightPlayerId: string | null;

  // Suspicion
  suspicion: number; // 1-6

  // Milestones
  milestones: Milestone[];

  // Nemesis
  nemesis: Nemesis | null;
  nemesisIndex: number | null;

  // Specialists
  specialists: Specialist[];

  // Mission
  missionGoal: string | null;
  missionGoalIndex: number | null;
  missionTarget: string | null;
  missionTargetIndex: number | null;

  // Wizard's Hotline
  hotlineUsed: boolean;

  // Description phase: collected adjectives before dealing
  adjectivePool: string[];
  adjectivesSubmitted: string[]; // player IDs who submitted

  // Current scene number (for nemesis tracking)
  scene: number;

  // Latest roll for animation
  currentRoll: DiceRoll | null;
}

// ============================================================
// Messages (client <-> server)
// ============================================================

export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "start-game" }
  | { type: "gm-roll"; playerId: string; dieSize: number; tableRoll?: boolean }
  | { type: "gm-set-spotlight"; playerId: string | null }
  | { type: "gm-advance-phase" }
  | { type: "gm-set-chaos"; playerId: string; value: number }
  | { type: "gm-set-suspicion"; value: number }
  | { type: "gm-toggle-milestone"; milestoneId: MilestoneId }
  | { type: "gm-damage-nemesis" }
  | { type: "gm-toggle-nemesis-active" }
  | { type: "gm-use-hotline" }
  | { type: "gm-next-scene" }
  | { type: "player-roll"; rollType: "civilized" | "goblin" }
  | { type: "player-use-item"; itemIndex: number }
  | { type: "submit-adjectives"; adjectives: string[] }
  | { type: "submit-description"; description: string }
  | { type: "gm-force-roll-result"; playerId: string; result: number; dieSize: number; rollType?: "civilized" | "goblin" | "table" };

export type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "roll-animation"; roll: DiceRoll }
  | { type: "error"; message: string }
  | { type: "player-id"; id: string };
