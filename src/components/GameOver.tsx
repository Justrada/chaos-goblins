"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { GameState } from "@/lib/types";

export default function GameOver({ state }: { state: GameState }) {
  const allMilestonesComplete = state.milestones.every((m) => m.completed);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);

  useEffect(() => {
    if (allMilestonesComplete) {
      // Victory confetti burst
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#7CFC00", "#FFD700", "#FF6347"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#7CFC00", "#FFD700", "#FF6347"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [allMilestonesComplete]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        {allMilestonesComplete ? (
          <>
            <h1 className="text-5xl font-black text-green-400">MISSION COMPLETE!</h1>
            <p className="text-xl text-gray-300">
              The goblins did it! Against all odds, the kingdom is saved.
            </p>
            <p className="text-gray-500 text-sm">
              The Wizard barely looks up from his book. &quot;Good. Now get out.&quot;
            </p>
          </>
        ) : (
          <>
            <h1 className="text-5xl font-black text-red-400">MISSION FAILED</h1>
            <p className="text-xl text-gray-300">
              The goblins have been exposed, assimilated, or worse.
            </p>
          </>
        )}

        {/* Final Stats */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-gray-500">Final Report</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <span>{p.name} ({p.form?.split("(")[0]})</span>
              <span className={
                p.isFullGoblin ? "text-red-400" :
                p.isAssimilated ? "text-blue-400" :
                "text-green-400"
              }>
                Chaos {p.chaos}
                {p.isFullGoblin && " — FULL GOBLIN"}
                {p.isAssimilated && " — ASSIMILATED"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-gray-600 text-xs">Refresh to play again!</p>
      </div>
    </div>
  );
}
