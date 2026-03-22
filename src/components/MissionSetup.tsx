"use client";

import { GameState, DiceRoll, ClientMessage } from "@/lib/types";
import { MISSION_GOALS, MISSION_TARGETS, NEMESES } from "@/lib/tables";
import DiceRoller from "./DiceRoller";

interface MissionSetupProps {
  state: GameState;
  isGM: boolean;
  currentRoll: DiceRoll | null;
  send: (msg: ClientMessage) => void;
}

export default function MissionSetup({ state, isGM, currentRoll, send }: MissionSetupProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-green-400">Mission Setup</h1>
          <p className="text-gray-400 mt-1 text-sm">
            The Wizard has a job for you miserable creatures...
          </p>
        </div>

        <DiceRoller roll={currentRoll} />

        {/* Mission */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center space-y-3">
          {state.missionGoal ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-yellow-500">Your Mission</p>
              <p className="text-2xl font-bold text-yellow-300 mt-2">
                {state.missionGoal} {state.missionTarget}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Mission not yet revealed...</p>
              {isGM && (
                <button
                  onClick={() =>
                    send({ type: "gm-force-roll-result", playerId: "gm", result: 0, dieSize: 6 })
                  }
                  className="mt-3 px-5 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-bold transition-colors"
                >
                  Roll Mission (2d6)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Nemesis */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center space-y-3">
          {state.nemesis ? (
            <div>
              <p className="text-xs uppercase tracking-widest text-red-500">Your Nemesis</p>
              <p className="text-2xl font-bold text-red-400 mt-2">{state.nemesis.name}</p>
              <p className="text-sm text-gray-400 mt-1">{state.nemesis.description}</p>
              <p className="text-xs text-red-300 mt-2">Resolve: ♥♥♥</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Nemesis not yet revealed...</p>
              {isGM && state.missionGoal && (
                <button
                  onClick={() =>
                    send({ type: "gm-force-roll-result", playerId: "gm", result: 0, dieSize: 6 })
                  }
                  className="mt-3 px-5 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors"
                >
                  Roll Nemesis (d6)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reference Tables */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Goals</p>
            {MISSION_GOALS.map((g, i) => (
              <p key={i} className={`text-xs ${state.missionGoalIndex === i ? "text-yellow-300 font-bold" : "text-gray-400"}`}>
                <span className="font-mono">{i + 1}.</span> {g}
              </p>
            ))}
          </div>
          <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Targets</p>
            {MISSION_TARGETS.map((t, i) => (
              <p key={i} className={`text-xs ${state.missionTargetIndex === i ? "text-yellow-300 font-bold" : "text-gray-400"}`}>
                <span className="font-mono">{i + 1}.</span> {t}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Nemeses</p>
          {NEMESES.map((n, i) => (
            <p key={i} className={`text-xs ${state.nemesisIndex === i ? "text-red-400 font-bold" : "text-gray-400"}`}>
              <span className="font-mono">{i + 1}.</span> {n.name} — {n.description}
            </p>
          ))}
        </div>

        {/* Advance to Gameplay */}
        {isGM && state.missionGoal && state.nemesis && (
          <div className="text-center pt-4">
            <button
              onClick={() => send({ type: "gm-advance-phase" })}
              className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition-colors"
            >
              Begin the Mission!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
