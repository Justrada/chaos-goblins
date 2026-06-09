"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import { GameState, CHAOS_MAX } from "@/lib/types";
import { sceneTileUrl, streamIdFor } from "@/lib/video";

// ============================================================
// Combined Scene — styled as a Windows 98 desktop.
// Each seat's VDO.Ninja webcam is an "open window"; the game
// HUD lives in the taskbar. Chaos lives on each window's title
// bar + status meter, with change animations and a live mic glow.
// ============================================================

const stroke = {
  textShadow: "2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
};

function chaosZoneColor(chaos: number): string {
  if (chaos >= 7) return "#ff0000";
  if (chaos >= 5) return "#ff6600";
  if (chaos >= 3) return "#cccc00";
  if (chaos >= 1) return "#0088ff";
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

  const [anims, setAnims] = useState<Record<string, Anim>>({});
  const [loudness, setLoudness] = useState<Record<number, number>>({});
  const prevChaos = useRef<Record<string, number>>({});
  const lastRollTs = useRef<number>(0);
  const nonce = useRef(0);

  // Opaque teal Win98 desktop background.
  useEffect(() => {
    const ph = document.documentElement.style.background;
    const pb = document.body.style.background;
    document.documentElement.style.background = "#008080";
    document.body.style.background = "#008080";
    return () => {
      document.documentElement.style.background = ph;
      document.body.style.background = pb;
    };
  }, []);

  // Chaos diffs → up/down animations.
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
    if (Object.keys(next).length) setAnims((a) => ({ ...a, ...next }));
  }, [state]);

  // Critical roll → gold burst.
  useEffect(() => {
    if (!currentRoll || currentRoll.outcome !== "critical") return;
    if (currentRoll.timestamp === lastRollTs.current) return;
    lastRollTs.current = currentRoll.timestamp;
    nonce.current += 1;
    setAnims((a) => ({ ...a, [currentRoll.playerId]: { kind: "crit", nonce: nonce.current } }));
  }, [currentRoll]);

  if (!state) return null;

  const windows = [...state.players].sort((a, b) => a.seat - b.seat);

  return (
    <div className="win98-desktop win98-font fixed inset-0 flex flex-col">
      {/* Window area */}
      <div className="flex-1 p-3 grid gap-3 z-10" style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gridAutoRows: "1fr",
      }}>
        {windows.map((p) => (
          <SeatWindow
            key={p.id}
            player={p}
            anim={anims[p.id]}
            loud={loudness[p.seat] ?? 0}
            onLoud={(v) => setLoudness((l) => (l[p.seat] === v ? l : { ...l, [p.seat]: v }))}
          />
        ))}
      </div>

      {/* Verb event — Win98 warning dialog */}
      {state.suspicionEvent.active && <VerbDialog state={state} />}

      {/* Taskbar HUD */}
      <Taskbar state={state} />
    </div>
  );
}

function SeatWindow({
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

  // VDO loudness → mic glow.
  useEffect(() => {
    const start = () => iframeRef.current?.contentWindow?.postMessage({ getLoudness: true }, "*");
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
      const norm = raw > 1 ? raw / 100 : raw;
      onLoud(Math.max(0, Math.min(1, norm)));
    };
    window.addEventListener("message", onMsg);
    return () => { clearInterval(t); window.removeEventListener("message", onMsg); };
  }, [onLoud]);

  const isGM = player.isGM;
  const talking = loud > 0.06;
  const glow = talking ? Math.min(1, (loud - 0.06) / 0.5) : 0;

  const titlebarClass = isGM
    ? ""
    : player.isFullGoblin
      ? "win98-titlebar-red"
      : player.isFullHuman
        ? "win98-titlebar-cyan"
        : "";

  const flashClass = anim?.kind === "up" ? "tile-flash-up" : anim?.kind === "down" ? "tile-flash-down" : anim?.kind === "crit" ? "tile-flash-crit" : "";

  return (
    <div
      key={anim?.nonce}
      className={`win98-window ${flashClass}`}
      style={{
        boxShadow: talking
          ? `0 0 ${10 + glow * 34}px ${2 + glow * 10}px rgba(57,255,20,${0.5 + glow * 0.5}), 2px 2px 0 rgba(0,0,0,0.5)`
          : "2px 2px 0 rgba(0,0,0,0.5)",
        transition: "box-shadow 0.12s ease-out",
        minHeight: 160,
      }}
    >
      {/* Title bar */}
      <div className={`win98-titlebar ${titlebarClass}`}>
        <span className="truncate">
          {isGM ? "👑 " : "👹 "}{player.name}{isGM ? "" : `  —  Chaos ${player.chaos}`}.exe
        </span>
        <span className="flex gap-0.5">
          <span className="win98-tbtn">_</span>
          <span className="win98-tbtn">□</span>
          <span className="win98-tbtn">✕</span>
        </span>
      </div>

      {/* Video (window content) */}
      <div className="relative flex-1" style={{ minHeight: 90, background: "#000" }}>
        <iframe
          ref={iframeRef}
          title={`seat-${id}`}
          src={src}
          className="absolute inset-0 w-full h-full"
          style={{ border: "none" }}
          allow="autoplay; fullscreen"
        />
        {/* Adv/Dis flag */}
        {!isGM && player.nextRollModifier && (
          <span className="absolute top-1 right-1 text-xs font-bold px-1"
            style={{ ...stroke, color: player.nextRollModifier === "advantage" ? "#00ff00" : "#ffcc00", background: "rgba(0,0,0,0.5)" }}>
            {player.nextRollModifier === "advantage" ? "ADV" : "DIS"}
          </span>
        )}
        {/* Animations */}
        {anim?.kind === "up" && (
          <span key={anim.nonce} className="float-up absolute left-1/2 top-1/2 font-impact text-4xl text-[#ff3030] pointer-events-none" style={stroke}>▲ +1</span>
        )}
        {anim?.kind === "down" && (
          <span key={anim.nonce} className="float-down absolute left-1/2 top-1/2 font-impact text-4xl text-[#30aaff] pointer-events-none" style={stroke}>▼ −1</span>
        )}
        {anim?.kind === "crit" && (
          <span key={anim.nonce} className="crit-burst absolute left-1/2 top-1/2 font-impact text-4xl text-[#ffff00] pointer-events-none whitespace-nowrap" style={stroke}>★ CRIT! ★</span>
        )}
      </div>

      {/* Status bar — chaos meter (players only) */}
      {!isGM ? (
        <div className="win98-statusbar">
          <span className="win98-sunken px-1" style={{ fontWeight: "bold", color: chaosZoneColor(player.chaos) }}>
            {player.isFullGoblin ? "FULL GOBLIN!" : player.isFullHuman ? "FULL HUMAN" : `Chaos ${player.chaos}`}
          </span>
          <span className="flex gap-px flex-1">
            {Array.from({ length: CHAOS_MAX + 1 }).map((_, i) => (
              <span key={i} style={{
                flex: 1, height: 10,
                background: i <= player.chaos ? chaosZoneColor(i) : "#808080",
                border: "1px solid #000",
              }} />
            ))}
          </span>
        </div>
      ) : (
        <div className="win98-statusbar">
          <span className="win98-sunken px-1" style={{ fontWeight: "bold" }}>Game Master</span>
        </div>
      )}
    </div>
  );
}

function VerbDialog({ state }: { state: GameState }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30">
      <div className="win98-window" style={{ width: 420, maxWidth: "90%" }}>
        <div className="win98-titlebar win98-titlebar-red">
          <span>⚠ Suspicion.exe</span>
          <span className="win98-tbtn">✕</span>
        </div>
        <div className="p-4 flex gap-3" style={{ color: "#000" }}>
          <span style={{ fontSize: 40, lineHeight: "40px" }}>⚠️</span>
          <div className="flex-1">
            <p className="font-bold text-sm mb-2">
              Suspicion has reached MAXIMUM! Everyone shout a verb — the GM decides what happens.
            </p>
            <div className="win98-sunken bg-white p-2 min-h-[44px] flex flex-wrap gap-2"
              style={{ borderColor: "#808080" }}>
              {state.suspicionEvent.verbs.length === 0 ? (
                <span className="text-[#808080] italic text-sm">Waiting for verbs…</span>
              ) : (
                state.suspicionEvent.verbs.map((v, i) => (
                  <span key={i} className="text-sm font-bold" style={{ background: "#000080", color: "#fff", padding: "1px 6px" }}>
                    {v.verb}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center pb-3">
          <span className="win98-taskbtn" style={{ padding: "3px 24px" }}>OK</span>
        </div>
      </div>
    </div>
  );
}

function Taskbar({ state }: { state: GameState }) {
  const acts = state.milestones.map((m) => (m.completed ? "✓" : "•")).join(" ");
  return (
    <div className="win98-taskbar win98-font flex items-center gap-1 p-1 z-20">
      <span className="win98-start">
        <span style={{ fontSize: 14 }}>👹</span> Chaos Goblins
      </span>
      <span className="win98-taskbtn" style={{ maxWidth: 280 }}>
        📁 {state.missionGoal || "Mission"} {state.missionTarget || ""}
      </span>
      {state.nemesis && (
        <span className="win98-taskbtn" style={{ maxWidth: 200 }}>
          💀 {state.nemesis.name}{state.nemesis.defeated ? " ✓" : ""}
        </span>
      )}
      <span className="flex-1" />
      <span className="win98-tray">
        <span style={{ fontWeight: "bold", color: state.suspicion >= 5 ? "#cc0000" : "#000" }} className={state.suspicion >= 5 ? "blink" : ""}>
          ⚠ {state.suspicion}/6
        </span>
        <span>Acts {acts}</span>
        <span>Scene {state.scene}</span>
      </span>
    </div>
  );
}
