"use client";

import { GameState, DiceRoll, ClientMessage } from "@/lib/types";
import { SUSPICION_DESCRIPTIONS, WIZARD_HAZARDS } from "@/lib/tables";
import DiceRoller from "./DiceRoller";

interface GameDashboardProps {
  state: GameState;
  playerId: string;
  isGM: boolean;
  currentRoll: DiceRoll | null;
  send: (msg: ClientMessage) => void;
}

export default function GameDashboard({
  state,
  playerId,
  isGM,
  currentRoll,
  send,
}: GameDashboardProps) {
  const me = state.players.find((p) => p.id === playerId);
  const isSpotlighted = state.spotlightPlayerId === playerId;
  const nonGMPlayers = state.players.filter((p) => !p.isGM);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Mission Banner */}
        <div className="bg-gray-900 rounded-lg border border-yellow-800 p-4 text-center">
          <p className="text-xs uppercase tracking-widest text-yellow-500">Mission</p>
          <p className="text-xl font-bold text-yellow-300">
            {state.missionGoal} {state.missionTarget}
          </p>
          {state.nemesis && (
            <p className="text-sm text-red-400 mt-1">
              Nemesis: <span className="font-bold">{state.nemesis.name}</span>{" "}
              — {state.nemesis.description}
              {state.nemesis.active && state.nemesis.resolve > 0 && (
                <span className="text-red-300 ml-2">(ACTIVE — Disadvantage on Civilized!)</span>
              )}
            </p>
          )}
        </div>

        {/* Scene & Status Bar */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Scene {state.scene}</span>
          {state.hotlineUsed && (
            <span className="text-gray-600 line-through">Wizard&apos;s Hotline</span>
          )}
          {!state.hotlineUsed && (
            <span className="text-blue-400 text-xs">Wizard&apos;s Hotline available</span>
          )}
        </div>

        {/* Central Meters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Suspicion Meter */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Suspicion</p>
            <p className={`text-4xl font-black font-mono ${
              state.suspicion >= 5 ? "text-red-400 animate-pulse" :
              state.suspicion >= 3 ? "text-orange-400" :
              "text-green-400"
            }`}>
              {state.suspicion}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {SUSPICION_DESCRIPTIONS[state.suspicion]}
            </p>
          </div>

          {/* Milestones */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Milestones</p>
            <div className="flex flex-col gap-1 mt-2">
              {state.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-2 text-xs ${
                    m.completed ? "text-green-400" : "text-gray-600"
                  }`}
                >
                  <span>{m.completed ? "■" : "□"}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nemesis / Specialists */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 text-center">
            <p className="text-xs uppercase tracking-widest text-gray-500">Threats</p>
            {state.nemesis && (
              <div className="mt-1">
                <p className={`text-sm font-bold ${state.nemesis.active ? "text-red-400" : "text-gray-600"}`}>
                  {state.nemesis.name}
                </p>
                <div className="flex justify-center gap-1 mt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < state.nemesis!.resolve ? "text-red-400" : "text-gray-700"
                      }`}
                    >
                      ♥
                    </span>
                  ))}
                </div>
                {!state.nemesis.active && state.nemesis.resolve > 0 && (
                  <p className="text-xs text-gray-500">Fled (returns next scene)</p>
                )}
                {state.nemesis.resolve <= 0 && (
                  <p className="text-xs text-green-400">Defeated!</p>
                )}
              </div>
            )}
            {state.specialists.length > 0 && (
              <div className="mt-2">
                {state.specialists.map((s) => (
                  <p key={s.id} className="text-xs text-red-300">
                    Specialist #{s.id} {s.active ? "(ACTIVE)" : "(removed)"}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dice Roller */}
        <DiceRoller roll={currentRoll} />

        {/* Player Action Area (for spotlighted player) */}
        {!isGM && isSpotlighted && me && !me.isFullGoblin && !me.isAssimilated && (
          <div className="bg-gray-900 rounded-lg border border-yellow-400 p-4 text-center space-y-3">
            <p className="text-yellow-300 font-bold text-sm uppercase tracking-widest">
              Your Turn!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => send({ type: "player-roll", rollType: "civilized" })}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
              >
                Roll Civilized
              </button>
              <button
                onClick={() => send({ type: "player-roll", rollType: "goblin" })}
                className="px-5 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg font-bold transition-colors"
              >
                Roll Goblin
              </button>
            </div>
            {me.pocketItems.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">Use an item (Comfort: Chaos -1, Suspicion +1):</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {me.pocketItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => send({ type: "player-use-item", itemIndex: i })}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-xs transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full Goblin / Assimilated message */}
        {!isGM && me?.isFullGoblin && (
          <div className="bg-red-900/30 rounded-lg border border-red-800 p-4 text-center">
            <p className="text-red-400 font-black text-xl">FULL GOBLIN MODE!</p>
            <p className="text-red-300 text-sm mt-1">
              You&apos;re exposed! You can only do Goblin actions. Suspicion auto-increases each turn.
            </p>
            {isSpotlighted && (
              <button
                onClick={() => send({ type: "player-roll", rollType: "goblin" })}
                className="mt-3 px-5 py-2.5 bg-green-700 hover:bg-green-600 rounded-lg font-bold transition-colors"
              >
                Roll Goblin
              </button>
            )}
          </div>
        )}

        {!isGM && me?.isAssimilated && (
          <div className="bg-blue-900/30 rounded-lg border border-blue-800 p-4 text-center">
            <p className="text-blue-400 font-black text-xl">TOTAL ASSIMILATION</p>
            <p className="text-blue-300 text-sm mt-1">
              You&apos;ve forgotten you were a goblin. You can only do Civilized actions. Suspicion auto-increases each turn.
            </p>
            {isSpotlighted && (
              <button
                onClick={() => send({ type: "player-roll", rollType: "civilized" })}
                className="mt-3 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
              >
                Roll Civilized
              </button>
            )}
          </div>
        )}

        {/* Not spotlighted message */}
        {!isGM && !isSpotlighted && (
          <div className="text-center text-gray-600 text-sm py-4">
            Waiting for {state.players.find((p) => p.id === state.spotlightPlayerId)?.name || "..."}&apos;s turn...
          </div>
        )}

        {/* Player Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {nonGMPlayers.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              isSpotlighted={state.spotlightPlayerId === p.id}
              isMe={p.id === playerId}
            />
          ))}
        </div>

        {/* GM Panel */}
        {isGM && (
          <GMPanel state={state} send={send} />
        )}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  isSpotlighted,
  isMe,
}: {
  player: GameState["players"][0];
  isSpotlighted: boolean;
  isMe: boolean;
}) {
  const chaosColor =
    player.chaos >= 5 ? "text-red-400" :
    player.chaos >= 4 ? "text-orange-400" :
    player.chaos >= 2 ? "text-yellow-300" :
    "text-blue-400";

  return (
    <div
      className={`bg-gray-900 rounded-lg border p-3 ${
        isSpotlighted
          ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
          : "border-gray-800"
      } ${player.isFullGoblin ? "bg-red-950/30" : ""} ${player.isAssimilated ? "bg-blue-950/30" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="font-bold text-sm truncate">
          {player.name} {isMe && <span className="text-gray-600">(you)</span>}
        </p>
        {isSpotlighted && <span className="text-yellow-400 text-xs">★</span>}
      </div>
      <p className="text-xs text-green-400 truncate">{player.form}</p>

      {/* Chaos */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-gray-500">CHAOS</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${
                i <= player.chaos
                  ? i >= 5 ? "bg-red-500" : i >= 3 ? "bg-orange-500" : "bg-blue-500"
                  : "bg-gray-800"
              } ${i === player.chaos ? "ring-1 ring-white" : ""}`}
            />
          ))}
        </div>
        <span className={`text-sm font-bold font-mono ${chaosColor}`}>
          {player.chaos}
        </span>
      </div>

      {/* Status */}
      {player.isFullGoblin && (
        <p className="text-xs text-red-400 font-bold mt-1">FULL GOBLIN!</p>
      )}
      {player.isAssimilated && (
        <p className="text-xs text-blue-400 font-bold mt-1">ASSIMILATED</p>
      )}

      {/* Obsession */}
      {player.obsession && (
        <p className="text-xs text-orange-400 mt-1 truncate" title={player.obsession}>
          {player.obsession.split("—")[0]}
        </p>
      )}

      {/* Pocket Items */}
      {player.pocketItems.length > 0 && (
        <div className="mt-1">
          {player.pocketItems.map((item, i) => (
            <p key={i} className="text-xs text-gray-500 truncate" title={item}>
              ◆ {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function GMPanel({
  state,
  send,
}: {
  state: GameState;
  send: (msg: ClientMessage) => void;
}) {
  const nonGMPlayers = state.players.filter((p) => !p.isGM);
  const randomHazard = WIZARD_HAZARDS[Math.floor(Math.random() * WIZARD_HAZARDS.length)];

  return (
    <div className="bg-yellow-950/30 rounded-lg border border-yellow-800 p-4 space-y-4">
      <p className="text-yellow-400 font-bold text-sm uppercase tracking-widest text-center">
        GM Controls
      </p>

      {/* Spotlight */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Spotlight (whose turn):</p>
        <div className="flex flex-wrap gap-2">
          {nonGMPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => send({ type: "gm-set-spotlight", playerId: p.id })}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                state.spotlightPlayerId === p.id
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-300"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chaos Overrides */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Chaos Override:</p>
        <div className="space-y-1">
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-20 truncate">{p.name}</span>
              <button
                onClick={() => send({ type: "gm-set-chaos", playerId: p.id, value: p.chaos - 1 })}
                className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                -
              </button>
              <span className="text-sm font-mono font-bold w-4 text-center">{p.chaos}</span>
              <button
                onClick={() => send({ type: "gm-set-chaos", playerId: p.id, value: p.chaos + 1 })}
                className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded text-xs"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suspicion */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Suspicion:</span>
        <button
          onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion - 1 })}
          className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded text-xs"
        >
          -
        </button>
        <span className="text-sm font-mono font-bold">{state.suspicion}</span>
        <button
          onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion + 1 })}
          className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded text-xs"
        >
          +
        </button>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-xs text-gray-500 mb-1">Milestones:</p>
        <div className="flex gap-2">
          {state.milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => send({ type: "gm-toggle-milestone", milestoneId: m.id })}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                m.completed
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 hover:bg-gray-700 text-gray-400"
              }`}
            >
              {m.completed ? "■" : "□"} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nemesis Controls */}
      {state.nemesis && state.nemesis.resolve > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">Nemesis:</span>
          <button
            onClick={() => send({ type: "gm-damage-nemesis" })}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-xs font-bold transition-colors"
          >
            -1 Resolve ({state.nemesis.resolve})
          </button>
          <button
            onClick={() => send({ type: "gm-toggle-nemesis-active" })}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              state.nemesis.active
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {state.nemesis.active ? "Active" : "Fled"}
          </button>
        </div>
      )}

      {/* Scene / Hotline / Advance */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => send({ type: "gm-next-scene" })}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold transition-colors"
        >
          Next Scene →
        </button>

        {!state.hotlineUsed && (
          <button
            onClick={() => send({ type: "gm-use-hotline" })}
            className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 rounded text-xs font-bold transition-colors"
          >
            Use Wizard&apos;s Hotline
          </button>
        )}

        {state.hotlineUsed && (
          <div className="text-xs text-gray-500 px-3 py-1.5">
            Hazard suggestion: <span className="text-blue-300 italic">{randomHazard}</span>
          </div>
        )}
      </div>
    </div>
  );
}
