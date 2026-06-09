"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { GameState, ClientMessage } from "@/lib/types";

export default function GameOver({
  state,
  isGM,
  send,
}: {
  state: GameState;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
}) {
  const allMilestonesComplete = state.milestones.every((m) => m.completed);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);

  useEffect(() => {
    if (allMilestonesComplete) {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#00ff00", "#ffff00", "#ff0000"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#0000ff", "#ff00ff", "#00ffff"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [allMilestonesComplete]);

  return (
    <div className="min-h-screen bg-starfield flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        {allMilestonesComplete ? (
          <>
            <h1 className="title-90s title-shadow text-7xl text-[#00ff00]">MISSION COMPLETE!</h1>
            <p className="text-2xl text-[#ffff00] font-bold title-shadow">
              &#9733; The goblins did it! Against all odds, the kingdom is saved. &#9733;
            </p>
            <p className="text-xl text-[#00ffff] italic font-bold">
              The Wizard barely looks up from his book. &quot;Good. Now get out.&quot;
            </p>
          </>
        ) : (
          <>
            <h1 className="title-90s title-shadow text-7xl text-[#ff0000] blink">MISSION FAILED</h1>
            <p className="text-2xl text-[#ff6600] font-bold title-shadow">
              The goblins have been exposed, assimilated, or worse.
            </p>
          </>
        )}

        <hr className="hr-rainbow" />

        {/* Final Stats */}
        <div className="panel-raised p-5">
          <p className="text-xl text-[#cc0000] font-bold uppercase text-center mb-3">
            &#9733; Final Report &#9733;
          </p>
          <table className="table-90s w-full">
            <thead>
              <tr><th>Player</th><th>Status</th></tr>
            </thead>
            <tbody>
              {nonGMPlayers.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.name} ({p.form?.split("(")[0]})</td>
                  <td className={`font-bold ${
                    p.isFullGoblin ? "!text-[#ff0000] !bg-[#ffcccc]" :
                    p.isFullHuman ? "!text-[#0000cc] !bg-[#ccccff]" :
                    "!text-[#008000] !bg-[#ccffcc]"
                  }`}>
                    Chaos {p.chaos}
                    {p.isFullGoblin && " — FULL GOBLIN"}
                    {p.isFullHuman && " — FULL HUMAN"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="hr-rainbow" />

        {isGM ? (
          <button
            onClick={() => send({ type: "play-again" })}
            className="btn-98 btn-98-green btn-98-xl"
          >
            &#8635; Play Again (same room)
          </button>
        ) : (
          <p className="text-xl text-[#00ffff] font-bold blink">
            Waiting for the GM to start a new game...
          </p>
        )}
      </div>
    </div>
  );
}
