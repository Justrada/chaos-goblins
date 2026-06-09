// ============================================================
// Chaos Goblins - Game State Types
// ============================================================

export type GamePhase =
  | "lobby"
  | "character-creation-form"
  | "character-creation-description"
  | "character-creation-pockets"
  | "mission-setup"
  | "gameplay"
  | "game-over";

export type MilestoneId = "act1" | "act2" | "act3";

export interface Milestone {
  id: MilestoneId;
  label: string;
  completed: boolean;
}

export type RollModifier = "advantage" | "disadvantage" | null;

export const CHAOS_MIN = 0;
export const CHAOS_MAX = 8;
export const CHAOS_START = 4;

export interface Player {
  id: string;
  name: string;
  isGM: boolean;
  seat: number; // 0 = GM, 1..7 = players (used for VDO.Ninja stream IDs + overlay slots)

  // Character
  form: string | null;
  formIndex: number | null;
  adjectives: string[];
  catchphrase: string;
  pocketItems: string[];

  // Stats
  chaos: number; // 0-8, starts at 4
  isFullGoblin: boolean; // chaos hit 8
  isFullHuman: boolean; // chaos hit 0

  // GM-granted one-shot modifier applied to the player's NEXT gameplay roll
  nextRollModifier: RollModifier;
}

export interface Nemesis {
  name: string;
  description: string;
  defeated: boolean; // GM decides when it's defeated; no mechanical effect
}

export interface DiceRoll {
  playerId: string;
  playerName: string;
  type: "civilized" | "goblin" | "table";
  dieSize: number; // d6 (creation/mission), d8 (gameplay)
  result: number;
  target: number | null; // chaos number for comparison
  outcome: "success" | "failure" | "critical" | null; // null for table rolls
  modifier: RollModifier; // advantage/disadvantage applied to this roll
  rolls: number[]; // the raw dice rolled (1 normally, 2 for adv/disadv)
  timestamp: number;
}

export interface SuspicionEvent {
  active: boolean;
  // verbs submitted by players during the event
  verbs: { playerId: string; playerName: string; verb: string }[];
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];

  // Suspicion (1-6); hitting 6 triggers a Verb Event
  suspicion: number;
  suspicionEvent: SuspicionEvent;

  // Milestones (Act 1/2/3)
  milestones: Milestone[];

  // Nemesis (flavor only)
  nemesis: Nemesis | null;
  nemesisIndex: number | null;

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

  // Pool of pocket items still available to be drawn (unique ownership)
  itemPool: string[];

  // Current scene number
  scene: number;
}

// ============================================================
// Messages (client <-> server)
// ============================================================

export type ItemEffect = "chaos-up" | "chaos-down" | "suspicion-down";

export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "start-game" }
  | { type: "gm-advance-phase" }
  // Character creation — players roll their own
  | { type: "player-roll-form" }
  | { type: "player-roll-item" }
  | { type: "submit-adjectives"; adjectives: string[] }
  | { type: "submit-catchphrase"; catchphrase: string }
  // Mission / Nemesis — GM rolls, with reroll
  | { type: "gm-roll-mission" }
  | { type: "gm-roll-nemesis" }
  | { type: "gm-reroll-mission" }
  | { type: "gm-reroll-nemesis" }
  | { type: "gm-toggle-nemesis-defeated" }
  // Gameplay — anyone can roll anytime
  | { type: "player-roll"; rollType: "civilized" | "goblin" }
  | { type: "player-use-item"; itemIndex: number; effect: ItemEffect }
  | { type: "player-give-item"; itemIndex: number; toPlayerId: string }
  | { type: "submit-verb"; verb: string }
  // GM controls
  | { type: "gm-set-chaos"; playerId: string; value: number }
  | { type: "gm-set-suspicion"; value: number }
  | { type: "gm-toggle-milestone"; milestoneId: MilestoneId }
  | { type: "gm-complete-act"; milestoneId: MilestoneId }
  | { type: "gm-set-advantage"; playerId: string; modifier: RollModifier }
  | { type: "gm-add-item"; playerId: string; item: string }
  | { type: "gm-remove-item"; playerId: string; itemIndex: number }
  | { type: "gm-resolve-suspicion-event" }
  | { type: "gm-use-hotline" }
  | { type: "gm-next-scene" }
  | { type: "play-again" };

export type ServerMessage =
  | { type: "state"; state: GameState }
  | { type: "roll-animation"; roll: DiceRoll }
  | { type: "error"; message: string }
  | { type: "player-id"; id: string };
