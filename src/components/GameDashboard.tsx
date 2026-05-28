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
    <div className="min-h-screen bg-starfield p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Mission Banner */}
        <div className="panel-yellow p-4 text-center">
          <p className="text-[#cc0000] text-lg font-bold uppercase tracking-wider">&#9733; MISSION &#9733;</p>
          <p className="title-90s text-4xl text-[#000080] mt-1" style={{ textShadow: "2px 2px 0 #c0c0c0" }}>
            {state.missionGoal} {state.missionTarget}
          </p>
          {state.nemesis && (
            <p className="text-lg text-[#cc0000] mt-2 font-bold">
              NEMESIS: {state.nemesis.name} — {state.nemesis.description}
              {state.nemesis.active && state.nemesis.resolve > 0 && (
                <span className="text-[#ff0000] ml-2 blink">(ACTIVE — Disadvantage on Civilized!)</span>
              )}
            </p>
          )}
        </div>

        {/* Scene & Status Bar */}
        <div className="flex items-center justify-between text-lg">
          <span className="text-[#ff00ff] font-bold title-shadow">&#9670; Scene {state.scene}</span>
          {state.hotlineUsed && (
            <span className="text-[#808080] line-through">Wizard&apos;s Hotline</span>
          )}
          {!state.hotlineUsed && (
            <span className="text-[#00ffff] font-bold title-shadow">&#9742; Wizard&apos;s Hotline available</span>
          )}
        </div>

        <hr className="hr-rainbow" />

        {/* Central Meters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Suspicion Meter */}
          <div className="panel-raised text-center">
            <p className="text-[#cc0000] text-lg font-bold uppercase">&#9888; SUSPICION</p>
            <p className={`font-impact text-7xl mt-1 ${
              state.suspicion >= 5 ? "text-[#ff0000] blink" :
              state.suspicion >= 3 ? "text-[#ff6600]" :
              "text-[#008000]"
            }`} style={{ textShadow: "3px 3px 0 #808080" }}>
              {state.suspicion}
            </p>
            <p className="text-[#000080] text-lg mt-1 font-bold">
              {SUSPICION_DESCRIPTIONS[state.suspicion]}
            </p>
          </div>

          {/* Milestones */}
          <div className="panel-raised text-center">
            <p className="text-[#008000] text-lg font-bold uppercase">&#9745; MILESTONES</p>
            <div className="flex flex-col gap-2 mt-3">
              {state.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 text-lg font-bold ${
                    m.completed ? "text-[#008000]" : "text-[#808080]"
                  }`}
                >
                  <span className="text-2xl">{m.completed ? "☑" : "☐"}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nemesis / Specialists */}
          <div className="panel-raised text-center">
            <p className="text-[#cc0000] text-lg font-bold uppercase">&#9760; THREATS</p>
            {state.nemesis && (
              <div className="mt-2">
                <p className={`text-2xl font-bold ${state.nemesis.active ? "text-[#ff0000]" : "text-[#808080]"}`}>
                  {state.nemesis.name}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-3xl ${
                        i < state.nemesis!.resolve ? "text-[#ff0000]" : "text-[#c0c0c0]"
                      }`}
                    >
                      ♥
                    </span>
                  ))}
                </div>
                {!state.nemesis.active && state.nemesis.resolve > 0 && (
                  <p className="text-lg text-[#800080] font-bold">Fled (returns next scene)</p>
                )}
                {state.nemesis.resolve <= 0 && (
                  <p className="text-lg text-[#008000] font-bold">&#9733; Defeated! &#9733;</p>
                )}
              </div>
            )}
            {state.specialists.length > 0 && (
              <div className="mt-3">
                {state.specialists.map((s) => (
                  <p key={s.id} className="text-lg text-[#cc0000] font-bold">
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
          <div className="panel-yellow p-5 text-center space-y-4">
            <p className="title-90s text-3xl text-[#cc0000] blink">
              &#9733; YOUR TURN! &#9733;
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => send({ type: "player-roll", rollType: "civilized" })}
                className="btn-98 btn-98-blue btn-98-big"
              >
                Roll Civilized
              </button>
              <button
                onClick={() => send({ type: "player-roll", rollType: "goblin" })}
                className="btn-98 btn-98-green btn-98-big"
              >
                Roll Goblin
              </button>
            </div>
            {me.pocketItems.length > 0 && (
              <div className="border-t-4 border-[#808080] pt-4 mt-4" style={{ borderStyle: "inset" }}>
                <p className="text-lg text-[#800080] font-bold">Use an item (Comfort: Chaos -1, Suspicion +1):</p>
                <div className="flex flex-wrap gap-3 justify-center mt-2">
                  {me.pocketItems.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => send({ type: "player-use-item", itemIndex: i })}
                      className="btn-98 btn-98-purple"
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
          <div className="panel-red p-5 text-center">
            <p className="title-90s text-4xl text-[#ffff00] blink">&#9760; FULL GOBLIN MODE! &#9760;</p>
            <p className="text-xl text-[#ffffff] mt-2 font-bold">
              You&apos;re exposed! You can only do Goblin actions. Suspicion auto-increases each turn.
            </p>
            {isSpotlighted && (
              <button
                onClick={() => send({ type: "player-roll", rollType: "goblin" })}
                className="btn-98 btn-98-green btn-98-big mt-4"
              >
                Roll Goblin
              </button>
            )}
          </div>
        )}

        {!isGM && me?.isAssimilated && (
          <div className="panel-blue p-5 text-center">
            <p className="title-90s text-4xl text-[#00ffff]">TOTAL ASSIMILATION</p>
            <p className="text-xl text-[#ffffff] mt-2 font-bold">
              You&apos;ve forgotten you were a goblin. You can only do Civilized actions. Suspicion auto-increases each turn.
            </p>
            {isSpotlighted && (
              <button
                onClick={() => send({ type: "player-roll", rollType: "civilized" })}
                className="btn-98 btn-98-cyan btn-98-big mt-4"
              >
                Roll Civilized
              </button>
            )}
          </div>
        )}

        {/* Not spotlighted message */}
        {!isGM && !isSpotlighted && (
          <div className="text-center text-[#00ffff] text-xl py-4 blink font-bold title-shadow">
            Waiting for {state.players.find((p) => p.id === state.spotlightPlayerId)?.name || "..."}&apos;s turn...
          </div>
        )}

        <hr className="hr-rainbow" />

        {/* Player Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <>
            <hr className="hr-rainbow" />
            <GMPanel state={state} send={send} />
          </>
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
    player.chaos >= 5 ? "text-[#ff0000]" :
    player.chaos >= 4 ? "text-[#ff6600]" :
    player.chaos >= 2 ? "text-[#cccc00]" :
    "text-[#0000ff]";

  const panelClass = player.isFullGoblin
    ? "panel-red"
    : player.isAssimilated
      ? "panel-blue"
      : isSpotlighted
        ? "panel-yellow"
        : "panel-raised";

  return (
    <div className={`${panelClass} p-3`}>
      <div className="flex items-center justify-between">
        <p className={`text-xl font-bold truncate ${player.isFullGoblin || player.isAssimilated ? "text-[#ffffff]" : "text-[#000000]"}`}>
          {isSpotlighted && "&#9733; "}{player.name} {isMe && <span className="text-[#808080]">(you)</span>}
        </p>
      </div>
      <p className={`text-lg font-bold truncate ${player.isFullGoblin || player.isAssimilated ? "text-[#00ff00]" : "text-[#008000]"}`}>
        {player.form}
      </p>

      {/* Chaos */}
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-lg font-bold ${player.isFullGoblin || player.isAssimilated ? "text-[#ffffff]" : "text-[#800080]"}`}>
          CHAOS
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="chaos-bar-segment"
              style={{
                background: i <= player.chaos
                  ? i >= 5 ? "#ff0000" : i >= 3 ? "#ff6600" : "#0000ff"
                  : "#c0c0c0",
                borderStyle: i <= player.chaos ? "outset" : "inset",
              }}
            />
          ))}
        </div>
        <span className={`text-2xl font-impact ${chaosColor}`}>
          {player.chaos}
        </span>
      </div>

      {/* Status */}
      {player.isFullGoblin && (
        <p className="text-lg text-[#ffff00] font-bold mt-1 blink">&#9760; FULL GOBLIN!</p>
      )}
      {player.isAssimilated && (
        <p className="text-lg text-[#00ffff] font-bold mt-1">ASSIMILATED</p>
      )}

      {/* Obsession */}
      {player.obsession && (
        <p className={`text-lg font-bold mt-1 truncate ${player.isFullGoblin || player.isAssimilated ? "text-[#ff8800]" : "text-[#ff6600]"}`}
          title={player.obsession}>
          {player.obsession.split("—")[0]}
        </p>
      )}

      {/* Pocket Items */}
      {player.pocketItems.length > 0 && (
        <div className="mt-1">
          {player.pocketItems.map((item, i) => (
            <p key={i} className={`text-lg truncate ${player.isFullGoblin || player.isAssimilated ? "text-[#cc99ff]" : "text-[#800080]"}`}
              title={item}>
              &#9670; {item}
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
    <div className="panel-raised p-5 space-y-4">
      <div className="construction-stripe" />
      <p className="title-90s text-3xl text-[#cc0000] text-center" style={{ textShadow: "2px 2px 0 #808080" }}>
        &#9733; GM CONTROLS &#9733;
      </p>
      <div className="construction-stripe" />

      {/* Spotlight */}
      <div>
        <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Spotlight (whose turn):</p>
        <div className="flex flex-wrap gap-2">
          {nonGMPlayers.map((p) => (
            <button
              key={p.id}
              onClick={() => send({ type: "gm-set-spotlight", playerId: p.id })}
              className={`btn-98 ${
                state.spotlightPlayerId === p.id
                  ? "btn-98-yellow"
                  : ""
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chaos Overrides */}
      <div>
        <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Chaos Override:</p>
        <div className="panel-sunken p-3 space-y-2">
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#000000] w-28 truncate">{p.name}</span>
              <button
                onClick={() => send({ type: "gm-set-chaos", playerId: p.id, value: p.chaos - 1 })}
                className="btn-98 !px-3 !py-1"
              >
                -
              </button>
              <span className="text-2xl font-impact text-[#000080] w-8 text-center">{p.chaos}</span>
              <button
                onClick={() => send({ type: "gm-set-chaos", playerId: p.id, value: p.chaos + 1 })}
                className="btn-98 !px-3 !py-1"
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suspicion */}
      <div className="flex items-center gap-4">
        <span className="text-lg text-[#000080] font-bold">&#9658; Suspicion:</span>
        <button
          onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion - 1 })}
          className="btn-98 !px-3 !py-1"
        >
          -
        </button>
        <span className="text-2xl font-impact text-[#cc0000]">{state.suspicion}</span>
        <button
          onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion + 1 })}
          className="btn-98 !px-3 !py-1"
        >
          +
        </button>
      </div>

      {/* Milestones */}
      <div>
        <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Milestones:</p>
        <div className="flex flex-wrap gap-2">
          {state.milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => send({ type: "gm-toggle-milestone", milestoneId: m.id })}
              className={`btn-98 ${m.completed ? "btn-98-green" : ""}`}
            >
              {m.completed ? "☑" : "☐"} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nemesis Controls */}
      {state.nemesis && state.nemesis.resolve > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg text-[#000080] font-bold">&#9658; Nemesis:</span>
          <button
            onClick={() => send({ type: "gm-damage-nemesis" })}
            className="btn-98 btn-98-red"
          >
            -1 Resolve ({state.nemesis.resolve})
          </button>
          <button
            onClick={() => send({ type: "gm-toggle-nemesis-active" })}
            className={`btn-98 ${state.nemesis.active ? "btn-98-red" : ""}`}
          >
            {state.nemesis.active ? "Active" : "Fled"}
          </button>
        </div>
      )}

      {/* Scene / Hotline / Advance */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => send({ type: "gm-next-scene" })}
          className="btn-98 btn-98-purple"
        >
          Next Scene &#9654;
        </button>

        {!state.hotlineUsed && (
          <button
            onClick={() => send({ type: "gm-use-hotline" })}
            className="btn-98 btn-98-cyan"
          >
            &#9742; Use Wizard&apos;s Hotline
          </button>
        )}

        {state.hotlineUsed && (
          <div className="text-lg text-[#800080] font-bold px-3 py-2">
            Hazard suggestion: <span className="text-[#0000cc] italic">{randomHazard}</span>
          </div>
        )}
      </div>

      <div className="construction-stripe" />
    </div>
  );
}
