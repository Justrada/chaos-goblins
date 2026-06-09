"use client";

import { useState } from "react";
import { GameState, DiceRoll, ClientMessage } from "@/lib/types";
import { FORMS, POCKET_ITEMS } from "@/lib/tables";
import DiceRoller from "./DiceRoller";

interface CharacterCreationProps {
  state: GameState;
  playerId: string;
  isGM: boolean;
  currentRoll: DiceRoll | null;
  send: (msg: ClientMessage) => void;
}

export default function CharacterCreation({
  state,
  playerId,
  isGM,
  currentRoll,
  send,
}: CharacterCreationProps) {
  const [adjective1, setAdjective1] = useState("");
  const [adjective2, setAdjective2] = useState("");
  const [adjective3, setAdjective3] = useState("");
  const [catchphrase, setCatchphrase] = useState("");

  const me = state.players.find((p) => p.id === playerId);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);
  const hasSubmittedAdjectives = state.adjectivesSubmitted.includes(playerId);

  const phaseTitles: Record<string, string> = {
    "character-creation-form": "Step 1: The Form",
    "character-creation-description": "Step 2: Description & Catchphrase",
    "character-creation-pockets": "Step 3: Goblin Pockets",
  };
  const phaseTitle = phaseTitles[state.phase] || "";

  const phaseDescriptions: Record<string, string> = {
    "character-creation-form":
      "The Wizard polymorphs each goblin. Roll to see what form you take!",
    "character-creation-description":
      "Everyone writes 3 physical adjectives. They get shuffled and dealt out — then make up a catchphrase!",
    "character-creation-pockets":
      "Dig through your deep pockets (or fur) full of trash. Roll 3 times — no two goblins share an item!",
  };
  const phaseDescription = phaseDescriptions[state.phase] || "";

  return (
    <div className="min-h-screen bg-starfield p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <h1 className="title-90s title-shadow text-5xl text-[#00ff00]">{phaseTitle}</h1>
          <p className="text-[#00ffff] mt-2 text-xl title-shadow">{phaseDescription}</p>
        </div>

        <hr className="hr-rainbow" />

        {/* Dice Roller */}
        <DiceRoller roll={currentRoll} />

        {/* Phase-specific content */}
        {state.phase === "character-creation-form" && (
          <FormPhase state={state} me={me} isGM={isGM} send={send} nonGMPlayers={nonGMPlayers} />
        )}

        {state.phase === "character-creation-description" && (
          <DescriptionPhase
            state={state} isGM={isGM}
            hasSubmittedAdjectives={hasSubmittedAdjectives}
            adjective1={adjective1} adjective2={adjective2} adjective3={adjective3}
            setAdjective1={setAdjective1} setAdjective2={setAdjective2} setAdjective3={setAdjective3}
            catchphrase={catchphrase} setCatchphrase={setCatchphrase}
            me={me} nonGMPlayers={nonGMPlayers} send={send}
          />
        )}

        {state.phase === "character-creation-pockets" && (
          <PocketsPhase state={state} me={me} isGM={isGM} send={send} nonGMPlayers={nonGMPlayers} />
        )}

        <hr className="hr-rainbow" />

        {/* Player Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="panel-raised p-3">
              <p className="text-xl font-bold text-[#000000]">{p.name}</p>
              {p.form && <p className="text-lg text-[#008000] font-bold mt-1">{p.form}</p>}
              {p.adjectives.length > 0 && (
                <p className="text-lg text-[#800080] font-bold mt-1">{p.adjectives.join(", ")}</p>
              )}
              {p.catchphrase && (
                <p className="text-lg text-[#0000cc] italic mt-1">&quot;{p.catchphrase}&quot;</p>
              )}
              {p.pocketItems.length > 0 && (
                <div className="mt-1">
                  {p.pocketItems.map((item, i) => (
                    <p key={i} className="text-lg text-[#000080]">&#9670; {item}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* GM Advance Button */}
        {isGM && (
          <div className="text-center pt-4">
            <button
              onClick={() => send({ type: "gm-advance-phase" })}
              className="btn-98 btn-98-yellow btn-98-big"
            >
              Next Phase &#9654;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormPhase({
  state, me, isGM, send, nonGMPlayers,
}: {
  state: GameState;
  me: GameState["players"][0] | undefined;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
  nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-4">
      {/* Player rolls their own form */}
      {me && !isGM && (
        <div className="panel-yellow p-5 text-center space-y-3">
          {!me.form ? (
            <>
              <p className="text-lg text-[#000080] font-bold">Roll to discover your polymorphed form!</p>
              <button
                onClick={() => send({ type: "player-roll-form" })}
                className="btn-98 btn-98-green btn-98-big"
              >
                &#9860; Roll d6
              </button>
            </>
          ) : (
            <p className="text-xl text-[#000080] font-bold">
              You are: <span className="text-[#008000]">{me.form}</span>
            </p>
          )}
        </div>
      )}

      {isGM && (
        <div className="panel-raised">
          <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Waiting on players to roll:</p>
          {nonGMPlayers.map((p) => (
            <p key={p.id} className="text-lg font-bold">
              {p.name}: {p.form ? <span className="text-[#008000]">{p.form}</span> : <span className="text-[#808080]">rolling...</span>}
            </p>
          ))}
        </div>
      )}

      <div className="panel-white p-4">
        <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">&#9733; The Forms &#9733;</p>
        <table className="table-90s w-full">
          <thead><tr><th>#</th><th>Form</th></tr></thead>
          <tbody>
            {FORMS.map((form, i) => (
              <tr key={i}><td className="font-bold">{i + 1}</td><td>{form}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DescriptionPhase({
  state, isGM, hasSubmittedAdjectives,
  adjective1, adjective2, adjective3,
  setAdjective1, setAdjective2, setAdjective3,
  catchphrase, setCatchphrase, me, nonGMPlayers, send,
}: {
  state: GameState; isGM: boolean; hasSubmittedAdjectives: boolean;
  adjective1: string; adjective2: string; adjective3: string;
  setAdjective1: (v: string) => void; setAdjective2: (v: string) => void; setAdjective3: (v: string) => void;
  catchphrase: string; setCatchphrase: (v: string) => void;
  me: GameState["players"][0] | undefined; nonGMPlayers: GameState["players"];
  send: (msg: ClientMessage) => void;
}) {
  const allSubmitted = state.adjectivesSubmitted.length >= nonGMPlayers.length;

  if (!isGM && !hasSubmittedAdjectives) {
    return (
      <div className="panel-raised space-y-3">
        <p className="text-lg text-[#000080] font-bold">
          &#9998; Write 3 physical adjectives (e.g., Slimy, Vibrating, Crusty, Magnetic, Damp...)
        </p>
        <input type="text" placeholder="Adjective 1" value={adjective1}
          onChange={(e) => setAdjective1(e.target.value)} className="input-98 w-full" />
        <input type="text" placeholder="Adjective 2" value={adjective2}
          onChange={(e) => setAdjective2(e.target.value)} className="input-98 w-full" />
        <input type="text" placeholder="Adjective 3" value={adjective3}
          onChange={(e) => setAdjective3(e.target.value)} className="input-98 w-full" />
        <button
          onClick={() => {
            if (adjective1.trim() && adjective2.trim() && adjective3.trim()) {
              send({ type: "submit-adjectives", adjectives: [adjective1.trim(), adjective2.trim(), adjective3.trim()] });
            }
          }}
          disabled={!adjective1.trim() || !adjective2.trim() || !adjective3.trim()}
          className="btn-98 btn-98-purple btn-98-big w-full"
        >
          Submit Adjectives!
        </button>
      </div>
    );
  }

  if (!allSubmitted) {
    return (
      <div className="panel-raised text-center p-5">
        <p className="text-xl text-[#800080] font-bold blink">
          Waiting for adjectives... ({state.adjectivesSubmitted.length}/{nonGMPlayers.length} submitted)
        </p>
      </div>
    );
  }

  return (
    <div className="panel-lime p-5 text-center">
      <p className="text-lg text-[#000080] font-bold uppercase mb-2">&#9733; Adjectives Dealt! &#9733;</p>
      {me && !me.isGM && (
        <div>
          <p className="title-90s text-3xl text-[#800080]" style={{ textShadow: "2px 2px 0 #c0c0c0" }}>
            {me.adjectives.join(", ")}
          </p>
          <p className="text-lg text-[#000000] mt-3 font-bold">
            You are a <span className="text-[#800080]">{me.adjectives.join(", ")}</span>{" "}
            <span className="text-[#008000]">{me.form}</span>.
          </p>
          {!me.catchphrase ? (
            <div className="mt-4 space-y-3">
              <p className="text-lg text-[#000080] font-bold">Now come up with your CATCHPHRASE!</p>
              <input type="text" placeholder="e.g. 'That's just good business!'"
                value={catchphrase} onChange={(e) => setCatchphrase(e.target.value)}
                className="input-98 w-full" />
              <button
                onClick={() => { if (catchphrase.trim()) send({ type: "submit-catchphrase", catchphrase: catchphrase.trim() }); }}
                disabled={!catchphrase.trim()}
                className="btn-98 btn-98-purple"
              >Save Catchphrase</button>
            </div>
          ) : (
            <p className="text-xl text-[#0000cc] mt-3 italic font-bold">&quot;{me.catchphrase}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}

function PocketsPhase({
  state, me, isGM, send, nonGMPlayers,
}: {
  state: GameState;
  me: GameState["players"][0] | undefined;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
  nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-4">
      {me && !isGM && (
        <div className="panel-yellow p-5 text-center space-y-3">
          <p className="text-lg text-[#000080] font-bold">
            Your pockets ({me.pocketItems.length}/3):
          </p>
          {me.pocketItems.length > 0 && (
            <div className="panel-white p-3 text-left">
              {me.pocketItems.map((item, i) => (
                <p key={i} className="text-lg text-[#000080] font-bold">&#9670; {item}</p>
              ))}
            </div>
          )}
          {me.pocketItems.length < 3 && (
            <button
              onClick={() => send({ type: "player-roll-item" })}
              className="btn-98 btn-98-blue btn-98-big"
            >
              &#9860; Roll for an item ({3 - me.pocketItems.length} left)
            </button>
          )}
        </div>
      )}

      {isGM && (
        <div className="panel-raised">
          <p className="text-lg text-[#000080] font-bold mb-2">&#9658; Items pulled ({state.itemPool.length} left in pool):</p>
          {nonGMPlayers.map((p) => (
            <p key={p.id} className="text-lg font-bold">
              {p.name}: {p.pocketItems.length}/3
              {p.pocketItems.length > 0 && (
                <span className="text-[#800080] ml-2">({p.pocketItems.join(", ")})</span>
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
