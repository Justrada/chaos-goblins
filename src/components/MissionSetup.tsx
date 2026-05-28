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
    <div className="min-h-screen bg-starfield p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center">
          <h1 className="title-90s title-shadow text-5xl text-[#00ff00]">Mission Setup</h1>
          <p className="text-[#ffff00] mt-2 text-xl title-shadow">
            The Wizard has a job for you miserable creatures...
          </p>
        </div>

        <hr className="hr-rainbow" />

        <DiceRoller roll={currentRoll} />

        {/* Mission */}
        <div className="panel-raised text-center p-5 space-y-3">
          {state.missionGoal ? (
            <div>
              <p className="text-lg text-[#cc0000] font-bold uppercase">&#9733; Your Mission &#9733;</p>
              <p className="title-90s text-4xl text-[#000080] mt-2" style={{ textShadow: "2px 2px 0 #c0c0c0" }}>
                {state.missionGoal} {state.missionTarget}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xl text-[#808080] font-bold">Mission not yet revealed...</p>
              {isGM && (
                <button
                  onClick={() => send({ type: "gm-force-roll-result", playerId: "gm", result: 0, dieSize: 6 })}
                  className="btn-98 btn-98-yellow btn-98-big mt-3"
                >Roll Mission (2d6)</button>
              )}
            </div>
          )}
        </div>

        {/* Nemesis */}
        <div className="panel-raised text-center p-5 space-y-3">
          {state.nemesis ? (
            <div>
              <p className="text-lg text-[#cc0000] font-bold uppercase">&#9760; Your Nemesis &#9760;</p>
              <p className="title-90s text-4xl text-[#ff0000] mt-2" style={{ textShadow: "2px 2px 0 #808080" }}>
                {state.nemesis.name}
              </p>
              <p className="text-xl text-[#000080] mt-2 font-bold">{state.nemesis.description}</p>
              <p className="text-2xl text-[#ff0000] mt-2">Resolve: ♥♥♥</p>
            </div>
          ) : (
            <div>
              <p className="text-xl text-[#808080] font-bold">Nemesis not yet revealed...</p>
              {isGM && state.missionGoal && (
                <button
                  onClick={() => send({ type: "gm-force-roll-result", playerId: "gm", result: 0, dieSize: 6 })}
                  className="btn-98 btn-98-red btn-98-big mt-3"
                >Roll Nemesis (d6)</button>
              )}
            </div>
          )}
        </div>

        <hr className="hr-rainbow" />

        {/* Reference Tables */}
        <div className="grid grid-cols-2 gap-4">
          <div className="panel-white p-3">
            <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">Goals</p>
            <table className="table-90s w-full">
              <tbody>
                {MISSION_GOALS.map((g, i) => (
                  <tr key={i} className={state.missionGoalIndex === i ? "!bg-[#ffff00]" : ""}>
                    <td className="font-bold w-8">{i + 1}</td>
                    <td className={state.missionGoalIndex === i ? "font-bold" : ""}>{g}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-white p-3">
            <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">Targets</p>
            <table className="table-90s w-full">
              <tbody>
                {MISSION_TARGETS.map((t, i) => (
                  <tr key={i} className={state.missionTargetIndex === i ? "!bg-[#ffff00]" : ""}>
                    <td className="font-bold w-8">{i + 1}</td>
                    <td className={state.missionTargetIndex === i ? "font-bold" : ""}>{t}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-white p-3">
          <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">Nemeses</p>
          <table className="table-90s w-full">
            <thead><tr><th>#</th><th>Name</th><th>Description</th></tr></thead>
            <tbody>
              {NEMESES.map((n, i) => (
                <tr key={i} className={state.nemesisIndex === i ? "!bg-[#ffcccc]" : ""}>
                  <td className="font-bold">{i + 1}</td>
                  <td className={`font-bold ${state.nemesisIndex === i ? "text-[#ff0000]" : ""}`}>{n.name}</td>
                  <td>{n.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Advance to Gameplay */}
        {isGM && state.missionGoal && state.nemesis && (
          <div className="text-center pt-4">
            <button
              onClick={() => send({ type: "gm-advance-phase" })}
              className="btn-98 btn-98-green btn-98-xl"
            >
              &#9758; Begin the Mission! &#9756;
            </button>
          </div>
        )}

        <hr className="hr-rainbow" />
      </div>
    </div>
  );
}
