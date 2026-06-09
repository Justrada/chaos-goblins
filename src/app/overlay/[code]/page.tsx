"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import { GameState, CHAOS_MAX } from "@/lib/types";

// Transparent, read-only stream overlay for OBS.
// Connects as a spectator (never sends "join", so it isn't a player) and
// renders live game graphics with a transparent background to layer over video.

function chaosSegmentColor(i: number): string {
  if (i >= 7) return "#ff0000";
  if (i >= 5) return "#ff6600";
  if (i >= 3) return "#ffff00";
  if (i >= 1) return "#00aaff";
  return "#0066ff";
}

const stroke = { textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000" };

export default function OverlayPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, currentRoll } = usePartySocket(code);

  // Make the page background transparent for OBS.
  useEffect(() => {
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, []);

  if (!state) return null;

  const players = [...state.players].filter((p) => !p.isGM).sort((a, b) => a.seat - b.seat);

  return (
    <div className="fixed inset-0 pointer-events-none font-comic" style={{ background: "transparent" }}>
      {/* Top banner */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-3">
        <div className="flex items-stretch gap-2">
          <Banner color="#000080" label="MISSION" value={`${state.missionGoal ?? ""} ${state.missionTarget ?? ""}`} />
          <Banner
            color={state.suspicion >= 5 ? "#cc0000" : state.suspicion >= 3 ? "#cc6600" : "#006600"}
            label="SUSPICION"
            value={`${state.suspicion} / 6`}
            blink={state.suspicion >= 5}
          />
          <Banner color="#660099" label="ACTS" value={state.milestones.map((m) => (m.completed ? "✓" : "•")).join(" ")} />
          <Banner color="#333333" label="SCENE" value={String(state.scene)} />
        </div>
      </div>

      {/* Nemesis (top-right) */}
      {state.nemesis && (
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1" style={{ background: "rgba(120,0,0,0.85)", border: "3px solid #ff3333", borderRadius: 6 }}>
            <span className="text-[#ffcc00] font-bold text-lg" style={stroke}>
              &#9760; {state.nemesis.name}{state.nemesis.defeated ? " (DEFEATED)" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Roll callout (center, transient) */}
      {currentRoll && currentRoll.outcome && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center">
          <div className="px-6 py-2" style={{
            background: "rgba(0,0,0,0.75)",
            border: `4px solid ${currentRoll.outcome === "critical" ? "#ffff00" : currentRoll.outcome === "success" ? "#00ff00" : "#ff0000"}`,
            borderRadius: 10,
          }}>
            <p className="text-2xl font-bold text-white" style={stroke}>
              {currentRoll.playerName} rolled {currentRoll.result}
            </p>
            <p className="font-impact text-4xl uppercase" style={{
              ...stroke,
              color: currentRoll.outcome === "critical" ? "#ffff00" : currentRoll.outcome === "success" ? "#00ff00" : "#ff3333",
            }}>
              {currentRoll.outcome === "critical" ? "CRITICAL!" : currentRoll.outcome}
            </p>
          </div>
        </div>
      )}

      {/* Verb event banner */}
      {state.suspicionEvent.active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="px-8 py-4" style={{ background: "rgba(120,0,0,0.9)", border: "5px solid #ffcc00", borderRadius: 12 }}>
            <p className="font-impact text-5xl text-[#ffcc00]" style={stroke}>&#9888; SUSPICION MAXED! &#9888;</p>
            <p className="text-2xl text-white font-bold mt-2" style={stroke}>
              {state.suspicionEvent.verbs.map((v) => v.verb).join("  •  ") || "Everyone shout a verb!"}
            </p>
          </div>
        </div>
      )}

      {/* Player nameplates (bottom row) */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 flex-wrap px-3">
        {players.map((p) => (
          <Nameplate key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}

function Banner({ color, label, value, blink }: { color: string; label: string; value: string; blink?: boolean }) {
  return (
    <div className={`px-3 py-1 ${blink ? "blink" : ""}`} style={{ background: color, border: "3px solid #fff", borderRadius: 6 }}>
      <span className="text-[#ffff66] font-bold text-sm uppercase mr-2" style={stroke}>{label}</span>
      <span className="text-white font-bold text-lg" style={stroke}>{value}</span>
    </div>
  );
}

function Nameplate({ player }: { player: GameState["players"][0] }) {
  const border = player.isFullGoblin ? "#ff0000" : player.isFullHuman ? "#00aaff" : "#39ff14";
  return (
    <div className="px-2 py-1" style={{ background: "rgba(0,0,30,0.82)", border: `3px solid ${border}`, borderRadius: 8, minWidth: 130 }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-white font-bold text-base truncate" style={stroke}>{player.name}</span>
        {player.nextRollModifier && (
          <span className="text-xs font-bold" style={{ ...stroke, color: player.nextRollModifier === "advantage" ? "#00ff00" : "#ffcc00" }}>
            {player.nextRollModifier === "advantage" ? "ADV" : "DIS"}
          </span>
        )}
      </div>
      {/* chaos meter */}
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: CHAOS_MAX + 1 }).map((_, i) => (
          <div key={i} style={{
            width: 9, height: 10,
            background: i <= player.chaos ? chaosSegmentColor(i) : "rgba(255,255,255,0.2)",
            border: "1px solid #000",
          }} />
        ))}
      </div>
      {player.isFullGoblin && <p className="text-[#ffcc00] font-bold text-xs blink" style={stroke}>FULL GOBLIN!</p>}
      {player.isFullHuman && <p className="text-[#66ddff] font-bold text-xs" style={stroke}>FULL HUMAN</p>}
    </div>
  );
}
