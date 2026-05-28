"use client";

import { useState } from "react";
import { GameState, DiceRoll, ClientMessage } from "@/lib/types";
import { FORMS, OBSESSIONS, POCKET_ITEMS } from "@/lib/tables";
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
  const [description, setDescription] = useState("");

  const me = state.players.find((p) => p.id === playerId);
  const nonGMPlayers = state.players.filter((p) => !p.isGM);
  const hasSubmittedAdjectives = state.adjectivesSubmitted.includes(playerId);

  const phaseTitles: Record<string, string> = {
    "character-creation-form": "Step 1: The Form",
    "character-creation-description": "Step 2: The Description",
    "character-creation-obsession": "Step 3: The Obsession",
    "character-creation-pockets": "Step 4: Goblin Pockets",
  };
  const phaseTitle = phaseTitles[state.phase] || "";

  const phaseDescriptions: Record<string, string> = {
    "character-creation-form":
      "The Wizard polymorphs each goblin. Roll to see what form you take!",
    "character-creation-description":
      "Each player writes 3 physical adjectives. They'll be shuffled and dealt out!",
    "character-creation-obsession":
      "What is your goblin brain fixated on? Roll to find out!",
    "character-creation-pockets":
      "Check your deep pockets (or fur) full of trash. Roll twice!",
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
          <FormPhase state={state} isGM={isGM} send={send} nonGMPlayers={nonGMPlayers} />
        )}

        {state.phase === "character-creation-description" && (
          <DescriptionPhase
            state={state} playerId={playerId} isGM={isGM}
            hasSubmittedAdjectives={hasSubmittedAdjectives}
            adjective1={adjective1} adjective2={adjective2} adjective3={adjective3}
            setAdjective1={setAdjective1} setAdjective2={setAdjective2} setAdjective3={setAdjective3}
            description={description} setDescription={setDescription}
            me={me} nonGMPlayers={nonGMPlayers} send={send}
          />
        )}

        {state.phase === "character-creation-obsession" && (
          <ObsessionPhase state={state} isGM={isGM} send={send} nonGMPlayers={nonGMPlayers} />
        )}

        {state.phase === "character-creation-pockets" && (
          <PocketsPhase state={state} isGM={isGM} send={send} nonGMPlayers={nonGMPlayers} />
        )}

        <hr className="hr-rainbow" />

        {/* Player Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nonGMPlayers.map((p) => (
            <div
              key={p.id}
              className={`p-3 ${
                state.spotlightPlayerId === p.id ? "panel-yellow" : "panel-raised"
              }`}
            >
              <p className="text-xl font-bold text-[#000000]">{p.name}</p>
              {p.form && <p className="text-lg text-[#008000] font-bold mt-1">{p.form}</p>}
              {p.adjectives.length > 0 && (
                <p className="text-lg text-[#800080] font-bold mt-1">{p.adjectives.join(", ")}</p>
              )}
              {p.obsession && <p className="text-lg text-[#ff6600] font-bold mt-1">{p.obsession}</p>}
              {p.pocketItems.length > 0 && (
                <div className="mt-1">
                  {p.pocketItems.map((item, i) => (
                    <p key={i} className="text-lg text-[#0000cc]">&#9670; {item}</p>
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
  state, isGM, send, nonGMPlayers,
}: {
  state: GameState; isGM: boolean;
  send: (msg: ClientMessage) => void; nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-4">
      {isGM && (
        <div className="panel-raised space-y-3">
          <p className="text-lg text-[#000080] font-bold">&#9658; Roll for each player:</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {p.name}: {p.form ? <span className="text-[#008000]">{p.form}</span> : <span className="text-[#808080]">Not rolled</span>}
              </span>
              {!p.form && (
                <button onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 6 })}
                  className="btn-98 btn-98-green">Roll d6</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel-white p-4">
        <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">&#9733; The Forms &#9733;</p>
        <table className="table-90s w-full">
          <thead>
            <tr><th>#</th><th>Form</th></tr>
          </thead>
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
  state, playerId, isGM, hasSubmittedAdjectives,
  adjective1, adjective2, adjective3,
  setAdjective1, setAdjective2, setAdjective3,
  description, setDescription, me, nonGMPlayers, send,
}: {
  state: GameState; playerId: string; isGM: boolean; hasSubmittedAdjectives: boolean;
  adjective1: string; adjective2: string; adjective3: string;
  setAdjective1: (v: string) => void; setAdjective2: (v: string) => void; setAdjective3: (v: string) => void;
  description: string; setDescription: (v: string) => void;
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
    <div className="space-y-4">
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
            {!me.description && (
              <div className="mt-4 space-y-3">
                <textarea placeholder="Explain WHY you look like this..."
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={2} className="input-98 w-full" />
                <button
                  onClick={() => { if (description.trim()) send({ type: "submit-description", description: description.trim() }); }}
                  disabled={!description.trim()}
                  className="btn-98 btn-98-purple"
                >Save Description</button>
              </div>
            )}
            {me.description && (
              <p className="text-xl text-[#000080] mt-3 italic font-bold">&quot;{me.description}&quot;</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ObsessionPhase({
  state, isGM, send, nonGMPlayers,
}: {
  state: GameState; isGM: boolean;
  send: (msg: ClientMessage) => void; nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-4">
      {isGM && (
        <div className="panel-raised space-y-3">
          <p className="text-lg text-[#000080] font-bold">&#9658; Roll obsessions:</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {p.name}: {p.obsession ? <span className="text-[#ff6600]">{p.obsession}</span> : <span className="text-[#808080]">Not rolled</span>}
              </span>
              {!p.obsession && (
                <button onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 6 })}
                  className="btn-98 btn-98-orange">Roll d6</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel-white p-4">
        <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">&#9733; The Obsessions &#9733;</p>
        <table className="table-90s w-full">
          <thead><tr><th>#</th><th>Obsession</th></tr></thead>
          <tbody>
            {OBSESSIONS.map((obs, i) => (
              <tr key={i}><td className="font-bold">{i + 1}</td><td>{obs}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PocketsPhase({
  state, isGM, send, nonGMPlayers,
}: {
  state: GameState; isGM: boolean;
  send: (msg: ClientMessage) => void; nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-4">
      {isGM && (
        <div className="panel-raised space-y-3">
          <p className="text-lg text-[#000080] font-bold">&#9658; Roll pocket items (2 each):</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-lg font-bold">
                {p.name}: {p.pocketItems.length}/2 items
                {p.pocketItems.length > 0 && (
                  <span className="text-[#800080] ml-2">({p.pocketItems.join(", ")})</span>
                )}
              </span>
              {p.pocketItems.length < 2 && (
                <button onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 20 })}
                  className="btn-98 btn-98-blue">Roll d20</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="panel-white p-4">
        <p className="text-lg text-[#cc0000] font-bold uppercase mb-2">&#9733; Goblin Pockets &#9733;</p>
        <table className="table-90s w-full">
          <thead><tr><th>#</th><th>Item</th></tr></thead>
          <tbody>
            {POCKET_ITEMS.map((item, i) => (
              <tr key={i}><td className="font-bold">{i + 1}</td><td>{item}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
