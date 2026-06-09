"use client";

import { useState } from "react";
import {
  GameState,
  DiceRoll,
  ClientMessage,
  ItemEffect,
  RollModifier,
  CHAOS_MAX,
} from "@/lib/types";
import { SUSPICION_DESCRIPTIONS, WIZARD_HAZARDS } from "@/lib/tables";
import DiceRoller from "./DiceRoller";
import VideoChat from "./VideoChat";
import StreamSetup from "./StreamSetup";

type PlayerT = GameState["players"][0];

interface GameDashboardProps {
  state: GameState;
  playerId: string;
  isGM: boolean;
  currentRoll: DiceRoll | null;
  send: (msg: ClientMessage) => void;
}

function chaosSegmentColor(i: number): string {
  // 0 (Full Human / blue) .. 8 (Full Goblin / red)
  if (i >= 7) return "#ff0000";
  if (i >= 5) return "#ff6600";
  if (i >= 3) return "#cccc00";
  if (i >= 1) return "#0088ff";
  return "#0000cc";
}

export default function GameDashboard({
  state,
  playerId,
  isGM,
  currentRoll,
  send,
}: GameDashboardProps) {
  const me = state.players.find((p) => p.id === playerId);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);

  return (
    <div className="min-h-screen bg-starfield p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Verb Event Modal */}
        {state.suspicionEvent.active && (
          <SuspicionEventModal state={state} me={me} isGM={isGM} send={send} />
        )}

        {/* Video chat (everyone on camera) */}
        {me && <VideoChat seat={me.seat} isGM={isGM} />}

        {/* Mission Banner */}
        <div className="panel-yellow p-4 text-center">
          <p className="text-[#cc0000] text-lg font-bold uppercase tracking-wider">&#9733; MISSION &#9733;</p>
          <p className="title-90s text-4xl text-[#000080] mt-1" style={{ textShadow: "2px 2px 0 #c0c0c0" }}>
            {state.missionGoal} {state.missionTarget}
          </p>
          {state.nemesis && (
            <p className="text-lg text-[#cc0000] mt-2 font-bold">
              NEMESIS: {state.nemesis.name}
              {state.nemesis.defeated ? (
                <span className="text-[#008000] ml-2">&#9733; DEFEATED! &#9733;</span>
              ) : (
                <span className="text-[#000080]"> — {state.nemesis.description}</span>
              )}
            </p>
          )}
        </div>

        {/* Scene & Status Bar */}
        <div className="flex items-center justify-between text-lg">
          <span className="text-[#ff00ff] font-bold title-shadow">&#9670; Scene {state.scene}</span>
          {state.hotlineUsed ? (
            <span className="text-[#808080] line-through">Wizard&apos;s Hotline</span>
          ) : (
            <span className="text-[#00ffff] font-bold title-shadow">&#9742; Wizard&apos;s Hotline available</span>
          )}
        </div>

        <hr className="hr-rainbow" />

        {/* Meters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Suspicion */}
          <div className="panel-raised text-center">
            <p className="text-[#cc0000] text-lg font-bold uppercase">&#9888; SUSPICION</p>
            <p className={`font-impact text-7xl mt-1 ${
              state.suspicion >= 5 ? "text-[#ff0000] blink" :
              state.suspicion >= 3 ? "text-[#ff6600]" : "text-[#008000]"
            }`} style={{ textShadow: "3px 3px 0 #808080" }}>
              {state.suspicion}<span className="text-3xl text-[#808080]">/6</span>
            </p>
            <p className="text-[#000080] text-base mt-1 font-bold">
              {SUSPICION_DESCRIPTIONS[state.suspicion]}
            </p>
          </div>

          {/* Acts */}
          <div className="panel-raised text-center">
            <p className="text-[#008000] text-lg font-bold uppercase">&#9745; ACTS</p>
            <div className="flex flex-col gap-2 mt-3">
              {state.milestones.map((m) => (
                <div key={m.id} className={`flex items-center gap-3 text-lg font-bold ${
                  m.completed ? "text-[#008000]" : "text-[#808080]"
                }`}>
                  <span className="text-2xl">{m.completed ? "☑" : "☐"}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nemesis */}
          <div className="panel-raised text-center">
            <p className="text-[#cc0000] text-lg font-bold uppercase">&#9760; NEMESIS</p>
            {state.nemesis ? (
              <div className="mt-2">
                <p className={`text-2xl font-bold ${state.nemesis.defeated ? "text-[#808080] line-through" : "text-[#ff0000]"}`}>
                  {state.nemesis.name}
                </p>
                {state.nemesis.defeated && (
                  <p className="text-lg text-[#008000] font-bold mt-1">&#9733; Defeated! &#9733;</p>
                )}
              </div>
            ) : (
              <p className="text-[#808080] mt-2">None</p>
            )}
          </div>
        </div>

        {/* Dice Roller */}
        <DiceRoller roll={currentRoll} />

        {/* Player Action Area — anyone can roll anytime */}
        {!isGM && me && (
          <div className="panel-yellow p-5 text-center space-y-4">
            <p className="title-90s text-2xl text-[#000080]">&#9758; Your Move, {me.name} &#9756;</p>
            {me.nextRollModifier && (
              <p className={`text-xl font-bold ${me.nextRollModifier === "advantage" ? "text-[#008000]" : "text-[#cc0000]"}`}>
                Next roll has {me.nextRollModifier.toUpperCase()}!
              </p>
            )}
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => send({ type: "player-roll", rollType: "civilized" })}
                disabled={state.suspicionEvent.active}
                className="btn-98 btn-98-blue btn-98-big"
              >
                Roll Civilized
              </button>
              <button
                onClick={() => send({ type: "player-roll", rollType: "goblin" })}
                disabled={state.suspicionEvent.active}
                className="btn-98 btn-98-green btn-98-big"
              >
                Roll Goblin
              </button>
            </div>
            <p className="text-base text-[#000080] font-bold">
              Civilized: succeed by rolling OVER {me.chaos} &nbsp;|&nbsp; Goblin: succeed by rolling UNDER {me.chaos} &nbsp;|&nbsp; exactly {me.chaos} = CRIT!
            </p>

            {/* My Items */}
            {me.pocketItems.length > 0 && (
              <div className="border-t-4 border-[#808080] pt-4 mt-4" style={{ borderStyle: "inset" }}>
                <p className="text-lg text-[#800080] font-bold mb-2">Your Pockets — use (consumes item) or give:</p>
                <div className="space-y-2">
                  {me.pocketItems.map((item, i) => (
                    <MyItemRow
                      key={i}
                      item={item}
                      index={i}
                      others={nonGMPlayers.filter((p) => p.id !== me.id)}
                      send={send}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <hr className="hr-rainbow" />

        {/* Player Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {nonGMPlayers.map((p) => (
            <PlayerCard key={p.id} player={p} isMe={p.id === playerId} />
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

function MyItemRow({
  item, index, others, send,
}: {
  item: string;
  index: number;
  others: PlayerT[];
  send: (msg: ClientMessage) => void;
}) {
  const [giveTo, setGiveTo] = useState("");
  const useEffect = (effect: ItemEffect) => send({ type: "player-use-item", itemIndex: index, effect });
  return (
    <div className="panel-white p-2 flex flex-wrap items-center gap-2">
      <span className="text-base text-[#000080] font-bold flex-1 min-w-[140px] text-left">&#9670; {item}</span>
      <button onClick={() => useEffect("chaos-up")} className="btn-98 btn-98-red !text-sm !px-2 !py-1">Chaos ▲</button>
      <button onClick={() => useEffect("chaos-down")} className="btn-98 btn-98-blue !text-sm !px-2 !py-1">Chaos ▼</button>
      <button onClick={() => useEffect("suspicion-down")} className="btn-98 btn-98-green !text-sm !px-2 !py-1">Susp ▼</button>
      {others.length > 0 && (
        <span className="flex items-center gap-1">
          <select value={giveTo} onChange={(e) => setGiveTo(e.target.value)}
            className="input-98 !text-sm !py-1 !px-1">
            <option value="">give to…</option>
            {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button
            disabled={!giveTo}
            onClick={() => { if (giveTo) send({ type: "player-give-item", itemIndex: index, toPlayerId: giveTo }); }}
            className="btn-98 !text-sm !px-2 !py-1"
          >Give</button>
        </span>
      )}
    </div>
  );
}

function PlayerCard({ player, isMe }: { player: PlayerT; isMe: boolean }) {
  const panelClass = player.isFullGoblin ? "panel-red" : player.isFullHuman ? "panel-blue" : "panel-raised";
  const lightText = player.isFullGoblin || player.isFullHuman;

  return (
    <div className={`${panelClass} p-3`}>
      <div className="flex items-center justify-between">
        <p className={`text-xl font-bold truncate ${lightText ? "text-[#ffffff]" : "text-[#000000]"}`}>
          {player.name} {isMe && <span className="text-[#808080]">(you)</span>}
        </p>
        {player.nextRollModifier && (
          <span className={`text-sm font-bold px-1 ${player.nextRollModifier === "advantage" ? "text-[#00ff00]" : "text-[#ffff00]"}`}>
            {player.nextRollModifier === "advantage" ? "ADV" : "DIS"}
          </span>
        )}
      </div>
      <p className={`text-base font-bold truncate ${lightText ? "text-[#00ff00]" : "text-[#008000]"}`}>{player.form}</p>
      {player.catchphrase && (
        <p className={`text-sm italic truncate ${lightText ? "text-[#ffff99]" : "text-[#0000cc]"}`} title={player.catchphrase}>
          &quot;{player.catchphrase}&quot;
        </p>
      )}

      {/* Chaos meter 0-8 */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${lightText ? "text-[#ffffff]" : "text-[#800080]"}`}>
            HUMAN
          </span>
          <span className={`text-2xl font-impact ${lightText ? "text-[#ffffff]" : "text-[#000080]"}`}>{player.chaos}</span>
          <span className={`text-sm font-bold ${lightText ? "text-[#ffffff]" : "text-[#cc0000]"}`}>GOBLIN</span>
        </div>
        <div className="flex gap-0.5 mt-1">
          {Array.from({ length: CHAOS_MAX + 1 }).map((_, i) => (
            <div key={i} className="flex-1 h-5"
              style={{
                background: i <= player.chaos ? chaosSegmentColor(i) : "#c0c0c0",
                border: "2px solid #000",
                borderStyle: i <= player.chaos ? "outset" : "inset",
              }} />
          ))}
        </div>
      </div>

      {player.isFullGoblin && (
        <p className="text-lg text-[#ffff00] font-bold mt-1 blink">&#9760; FULL GOBLIN!</p>
      )}
      {player.isFullHuman && (
        <p className="text-lg text-[#00ffff] font-bold mt-1">FULL HUMAN</p>
      )}

      {player.pocketItems.length > 0 && (
        <div className="mt-1">
          {player.pocketItems.map((item, i) => (
            <p key={i} className={`text-sm truncate ${lightText ? "text-[#cc99ff]" : "text-[#000080]"}`} title={item}>
              &#9670; {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SuspicionEventModal({
  state, me, isGM, send,
}: {
  state: GameState;
  me: PlayerT | undefined;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
}) {
  const [verb, setVerb] = useState("");
  const submitted = me ? state.suspicionEvent.verbs.some((v) => v.playerId === me.id) : false;
  const nonGM = state.players.filter((p) => !p.isGM);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="panel-raised max-w-lg w-full p-5 space-y-4">
        <div className="construction-stripe" />
        <h2 className="title-90s text-4xl text-[#cc0000] text-center blink" style={{ textShadow: "2px 2px 0 #808080" }}>
          &#9888; SUSPICION MAXED! &#9888;
        </h2>
        <p className="text-lg text-[#000080] font-bold text-center">
          Everyone shout a VERB! The GM will decide what chaos unfolds.
        </p>

        {/* Player verb input */}
        {!isGM && me && (
          submitted ? (
            <p className="text-center text-[#008000] text-xl font-bold">Verb submitted! Waiting on the GM…</p>
          ) : (
            <div className="space-y-2">
              <input type="text" placeholder="A verb! (e.g. EXPLODE, juggle, flee...)"
                value={verb} onChange={(e) => setVerb(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && verb.trim()) send({ type: "submit-verb", verb: verb.trim() }); }}
                className="input-98 w-full text-center" />
              <button
                onClick={() => { if (verb.trim()) send({ type: "submit-verb", verb: verb.trim() }); }}
                disabled={!verb.trim()}
                className="btn-98 btn-98-purple btn-98-big w-full"
              >Submit Verb!</button>
            </div>
          )
        )}

        {/* Submitted verbs */}
        <div className="panel-white p-3">
          <p className="text-base text-[#cc0000] font-bold uppercase mb-1">
            Verbs ({state.suspicionEvent.verbs.length}/{nonGM.length})
          </p>
          {state.suspicionEvent.verbs.length === 0 ? (
            <p className="text-[#808080] italic">Waiting for verbs…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {state.suspicionEvent.verbs.map((v, i) => (
                <span key={i} className="text-lg font-bold text-[#000080] panel-yellow px-2 py-0.5">
                  {v.verb} <span className="text-sm text-[#800080]">({v.playerName})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {isGM && (
          <button
            onClick={() => send({ type: "gm-resolve-suspicion-event" })}
            className="btn-98 btn-98-red btn-98-big w-full"
          >
            Resolve Event (suspicion → 1)
          </button>
        )}
        <div className="construction-stripe" />
      </div>
    </div>
  );
}

function GMPanel({
  state, send,
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

      {/* Stream / OBS setup */}
      <StreamSetup roomCode={state.roomCode} />

      {/* Per-player controls */}
      <div className="space-y-3">
        {nonGMPlayers.map((p) => (
          <GMPlayerControls key={p.id} player={p} send={send} />
        ))}
      </div>

      {/* Suspicion */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-lg text-[#000080] font-bold">&#9658; Suspicion:</span>
        <button onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion - 1 })}
          className="btn-98 !px-3 !py-1">-</button>
        <span className="text-2xl font-impact text-[#cc0000]">{state.suspicion}</span>
        <button onClick={() => send({ type: "gm-set-suspicion", value: state.suspicion + 1 })}
          className="btn-98 !px-3 !py-1">+</button>
      </div>

      {/* Acts */}
      <div>
        <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Acts (completing one resets broken players):</p>
        <div className="flex flex-wrap gap-2">
          {state.milestones.map((m) => (
            <button
              key={m.id}
              onClick={() => m.completed
                ? send({ type: "gm-toggle-milestone", milestoneId: m.id })
                : send({ type: "gm-complete-act", milestoneId: m.id })}
              className={`btn-98 ${m.completed ? "btn-98-green" : ""}`}
            >
              {m.completed ? "☑" : "☐"} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nemesis */}
      {state.nemesis && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg text-[#000080] font-bold">&#9658; Nemesis:</span>
          <button
            onClick={() => send({ type: "gm-toggle-nemesis-defeated" })}
            className={`btn-98 ${state.nemesis.defeated ? "btn-98-green" : "btn-98-red"}`}
          >
            {state.nemesis.defeated ? "☑ Defeated" : "Mark Defeated"}
          </button>
        </div>
      )}

      {/* Scene / Hotline */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => send({ type: "gm-next-scene" })} className="btn-98 btn-98-purple">
          Next Scene &#9654;
        </button>
        {!state.hotlineUsed ? (
          <button onClick={() => send({ type: "gm-use-hotline" })} className="btn-98 btn-98-cyan">
            &#9742; Use Wizard&apos;s Hotline
          </button>
        ) : (
          <div className="text-base text-[#800080] font-bold px-2">
            Hazard idea: <span className="text-[#0000cc] italic">{randomHazard}</span>
          </div>
        )}
      </div>

      <div className="construction-stripe" />
    </div>
  );
}

function GMPlayerControls({ player, send }: { player: PlayerT; send: (msg: ClientMessage) => void }) {
  const [newItem, setNewItem] = useState("");
  const setMod = (modifier: RollModifier) => send({ type: "gm-set-advantage", playerId: player.id, modifier });

  return (
    <div className="panel-sunken p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg font-bold text-[#000000] min-w-[90px]">{player.name}</span>
        {/* Chaos */}
        <span className="flex items-center gap-1">
          <span className="text-sm font-bold text-[#800080]">Chaos</span>
          <button onClick={() => send({ type: "gm-set-chaos", playerId: player.id, value: player.chaos - 1 })}
            className="btn-98 !px-2 !py-0.5 !text-sm">-</button>
          <span className="text-xl font-impact text-[#000080] w-6 text-center">{player.chaos}</span>
          <button onClick={() => send({ type: "gm-set-chaos", playerId: player.id, value: player.chaos + 1 })}
            className="btn-98 !px-2 !py-0.5 !text-sm">+</button>
        </span>
        {/* Adv/Disadv */}
        <span className="flex items-center gap-1">
          <button onClick={() => setMod("advantage")}
            className={`btn-98 !px-2 !py-0.5 !text-sm ${player.nextRollModifier === "advantage" ? "btn-98-green" : ""}`}>Adv</button>
          <button onClick={() => setMod("disadvantage")}
            className={`btn-98 !px-2 !py-0.5 !text-sm ${player.nextRollModifier === "disadvantage" ? "btn-98-red" : ""}`}>Dis</button>
          {player.nextRollModifier && (
            <button onClick={() => setMod(null)} className="btn-98 !px-2 !py-0.5 !text-sm">Clear</button>
          )}
        </span>
      </div>

      {/* Items + add (for steals) */}
      <div className="flex flex-wrap items-center gap-2">
        {player.pocketItems.map((item, i) => (
          <span key={i} className="text-sm font-bold text-[#000080] bg-white border-2 border-[#808080] px-1"
            style={{ borderStyle: "inset" }}>
            {item}
            <button onClick={() => send({ type: "gm-remove-item", playerId: player.id, itemIndex: i })}
              className="text-[#cc0000] font-bold ml-1">✕</button>
          </span>
        ))}
        <span className="flex items-center gap-1">
          <input type="text" placeholder="add item (steal)…" value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="input-98 !text-sm !py-0.5 !px-1 w-36" />
          <button
            disabled={!newItem.trim()}
            onClick={() => { if (newItem.trim()) { send({ type: "gm-add-item", playerId: player.id, item: newItem.trim() }); setNewItem(""); } }}
            className="btn-98 !px-2 !py-0.5 !text-sm">Add</button>
        </span>
      </div>
    </div>
  );
}
