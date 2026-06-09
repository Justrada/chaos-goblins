"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import { GameState, CHAOS_MAX } from "@/lib/types";
import { sceneTileUrl, streamIdFor } from "@/lib/video";

// ============================================================
// Combined Scene — the all-in-one website overlay for OBS.
// Embeds each seat's VDO.Ninja video tile and draws the frame,
// chaos-number border, change animations, and live mic glow.
// (Separate per-guest raw feeds are still available via the GM
//  Stream Setup panel for a separate recording workflow.)
// ============================================================

const stroke = {
  textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
};

function chaosZoneColor(chaos: number): string {
  if (chaos >= 7) return "#ff0000";
  if (chaos >= 5) return "#ff6600";
  if (chaos >= 3) return "#ffdd00";
  if (chaos >= 1) return "#00aaff";
  return "#0066ff";
}

type AnimKind = "up" | "down" | "crit";
interface Anim {
  kind: AnimKind;
  nonce: number;
}

export default function CombinedScenePage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, currentRoll } = usePartySocket(code);

  // Per-player transient animations + per-seat mic loudness (0..1).
  const [anims, setAnims] = useState<Record<string, Anim>>({});
  const [loudness, setLoudness] = useState<Record<number, number>>({});
  const prevChaos = useRef<Record<string, number>>({});
  const lastRollTs = useRef<number>(0);
  const nonce = useRef(0);

  // Transparent page background for OBS.
  useEffect(() => {
    const ph = document.documentElement.style.background;
    const pb = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = ph;
      document.body.style.background = pb;
    };
  }, []);

  // Diff chaos values → up/down animations.
  useEffect(() => {
    if (!state) return;
    const next: Record<string, Anim> = {};
    for (const p of state.players) {
      const prev = prevChaos.current[p.id];
      if (prev !== undefined && p.chaos !== prev) {
        nonce.current += 1;
        next[p.id] = { kind: p.chaos > prev ? "up" : "down", nonce: nonce.current };
      }
      prevChaos.current[p.id] = p.chaos;
    }
    if (Object.keys(next).length) {
      setAnims((a) => ({ ...a, ...next }));
    }
  }, [state]);

  // Critical roll → gold burst on that player (chaos doesn't move on crit).
  useEffect(() => {
    if (!currentRoll || currentRoll.outcome !== "critical") return;
    if (currentRoll.timestamp === lastRollTs.current) return;
    lastRollTs.current = currentRoll.timestamp;
    nonce.current += 1;
    setAnims((a) => ({ ...a, [currentRoll.playerId]: { kind: "crit", nonce: nonce.current } }));
  }, [currentRoll]);

  if (!state) return null;

  const tiles = [...state.players].sort((a, b) => a.seat - b.seat);

  return (
    <div className="fixed inset-0 font-comic" style={{ background: "transparent" }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-3 px-3 z-10">
        <div className="flex items-stretch gap-2 flex-wrap justify-center">
          <Banner color="#000080" label="MISSION" value={`${state.missionGoal ?? ""} ${state.missionTarget ?? ""}`.trim() || "—"} />
          <Banner
            color={state.suspicion >= 5 ? "#cc0000" : state.suspicion >= 3 ? "#cc6600" : "#006600"}
            label="SUSPICION" value={`${state.suspicion} / 6`} blink={state.suspicion >= 5} />
          <Banner color="#660099" label="ACTS" value={state.milestones.map((m) => (m.completed ? "✓" : "•")).join(" ")} />
          <Banner color="#333333" label="SCENE" value={String(state.scene)} />
          {state.nemesis && (
            <Banner color={state.nemesis.defeated ? "#444" : "#990000"} label="NEMESIS"
              value={`${state.nemesis.name}${state.nemesis.defeated ? " ✓" : ""}`} />
          )}
        </div>
      </div>

      {/* Video tile grid */}
      <div className="absolute inset-0 flex items-center justify-center pt-20 pb-6 px-4">
        <div className="grid gap-4 w-full h-full" style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`,
          gridAutoRows: "1fr",
          maxHeight: "100%",
        }}>
          {tiles.map((p) => (
            <SeatTile
              key={p.id}
              player={p}
              anim={anims[p.id]}
              loud={loudness[p.seat] ?? 0}
              onLoud={(v) => setLoudness((l) => (l[p.seat] === v ? l : { ...l, [p.seat]: v }))}
            />
          ))}
        </div>
      </div>

      {/* Verb event banner */}
      {state.suspicionEvent.active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
          <div className="px-8 py-4" style={{ background: "rgba(120,0,0,0.92)", border: "5px solid #ffcc00", borderRadius: 12 }}>
            <p className="font-impact text-5xl text-[#ffcc00]" style={stroke}>&#9888; SUSPICION MAXED! &#9888;</p>
            <p className="text-2xl text-white font-bold mt-2" style={stroke}>
              {state.suspicionEvent.verbs.map((v) => v.verb).join("  •  ") || "Everyone shout a verb!"}
            </p>
          </div>
        </div>
      )}
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

function SeatTile({
  player, anim, loud, onLoud,
}: {
  player: GameState["players"][0];
  anim: Anim | undefined;
  loud: number;
  onLoud: (v: number) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const id = streamIdFor(player.seat, player.isGM);
  const src = sceneTileUrl(player.seat, player.isGM);

  // Ask VDO for loudness of this tile's stream, and listen for updates.
  useEffect(() => {
    const win = () => iframeRef.current?.contentWindow;
    const start = () => win()?.postMessage({ getLoudness: true }, "*");
    const t = setInterval(start, 3000);
    start();

    const onMsg = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || typeof d !== "object" || !("loudness" in d)) return;
      let raw = 0;
      const ld = (d as { loudness: unknown }).loudness;
      if (typeof ld === "number") raw = ld;
      else if (ld && typeof ld === "object") {
        for (const k in ld as Record<string, number>) {
          const v = (ld as Record<string, number>)[k];
          if (typeof v === "number") raw = Math.max(raw, v);
        }
      }
      // Normalize: VDO loudness is roughly 0-100 (sometimes 0-1).
      const norm = raw > 1 ? raw / 100 : raw;
      onLoud(Math.max(0, Math.min(1, norm)));
    };
    window.addEventListener("message", onMsg);
    return () => { clearInterval(t); window.removeEventListener("message", onMsg); };
  }, [onLoud]);

  const isGM = player.isGM;
  const borderColor = isGM ? "#ffffff" : player.isFullGoblin ? "#ff0000" : player.isFullHuman ? "#00aaff" : chaosZoneColor(player.chaos);
  const talking = loud > 0.06;
  const glow = talking ? Math.min(1, (loud - 0.06) / 0.5) : 0;

  const flashClass = anim?.kind === "up" ? "tile-flash-up" : anim?.kind === "down" ? "tile-flash-down" : anim?.kind === "crit" ? "tile-flash-crit" : "";

  return (
    <div
      key={anim?.nonce /* remount to replay border flash */}
      className={`relative ${flashClass}`}
      style={{
        border: `5px solid ${borderColor}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "#000",
        // Talking glow (smoothed via transition).
        boxShadow: talking
          ? `0 0 ${10 + glow * 34}px ${2 + glow * 10}px rgba(57,255,20,${0.45 + glow * 0.5})`
          : "0 0 0 0 rgba(57,255,20,0)",
        transition: "box-shadow 0.12s ease-out",
        minHeight: 150,
      }}
    >
      {/* Video */}
      <iframe
        ref={iframeRef}
        title={`seat-${id}`}
        src={src}
        className="absolute inset-0 w-full h-full"
        style={{ border: "none" }}
        allow="autoplay; fullscreen"
      />

      {/* Chaos badge on the top border (players only) */}
      {!isGM && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -top-1 flex items-center justify-center font-impact"
          style={{
            width: 46, height: 46, borderRadius: "50%",
            background: borderColor, color: "#000",
            border: "3px solid #000", fontSize: 26, lineHeight: "40px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.6)", zIndex: 5,
          }}
          title={`Chaos ${player.chaos}`}
        >
          {player.chaos}
        </div>
      )}

      {/* Nameplate (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center justify-between"
        style={{ background: "rgba(0,0,20,0.78)" }}>
        <span className="text-white font-bold text-base truncate" style={stroke}>
          {isGM ? "★ " : ""}{player.name}
        </span>
        {!isGM && player.nextRollModifier && (
          <span className="text-xs font-bold" style={{ ...stroke, color: player.nextRollModifier === "advantage" ? "#00ff00" : "#ffcc00" }}>
            {player.nextRollModifier === "advantage" ? "ADV" : "DIS"}
          </span>
        )}
      </div>

      {/* Status tags */}
      {player.isFullGoblin && (
        <span className="absolute top-1 right-1 text-[#ffcc00] font-bold text-xs blink px-1" style={{ ...stroke, background: "rgba(0,0,0,0.5)" }}>FULL GOBLIN</span>
      )}
      {player.isFullHuman && (
        <span className="absolute top-1 right-1 text-[#66ddff] font-bold text-xs px-1" style={{ ...stroke, background: "rgba(0,0,0,0.5)" }}>FULL HUMAN</span>
      )}

      {/* Chaos change animations */}
      {anim && anim.kind === "up" && (
        <span key={anim.nonce} className="float-up absolute left-1/2 top-1/2 font-impact text-4xl text-[#ff3030] pointer-events-none" style={stroke}>▲ +1</span>
      )}
      {anim && anim.kind === "down" && (
        <span key={anim.nonce} className="float-down absolute left-1/2 top-1/2 font-impact text-4xl text-[#30aaff] pointer-events-none" style={stroke}>▼ −1</span>
      )}
      {anim && anim.kind === "crit" && (
        <span key={anim.nonce} className="crit-burst absolute left-1/2 top-1/2 font-impact text-4xl text-[#ffff00] pointer-events-none whitespace-nowrap" style={stroke}>★ CRIT! ★</span>
      )}
    </div>
  );
}
