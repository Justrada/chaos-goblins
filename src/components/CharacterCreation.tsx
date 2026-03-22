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
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-black text-green-400">{phaseTitle}</h1>
          <p className="text-gray-400 mt-1 text-sm">{phaseDescription}</p>
        </div>

        {/* Dice Roller */}
        <DiceRoller roll={currentRoll} />

        {/* Phase-specific content */}
        {state.phase === "character-creation-form" && (
          <FormPhase
            state={state}
            isGM={isGM}
            send={send}
            nonGMPlayers={nonGMPlayers}
          />
        )}

        {state.phase === "character-creation-description" && (
          <DescriptionPhase
            state={state}
            playerId={playerId}
            isGM={isGM}
            hasSubmittedAdjectives={hasSubmittedAdjectives}
            adjective1={adjective1}
            adjective2={adjective2}
            adjective3={adjective3}
            setAdjective1={setAdjective1}
            setAdjective2={setAdjective2}
            setAdjective3={setAdjective3}
            description={description}
            setDescription={setDescription}
            me={me}
            nonGMPlayers={nonGMPlayers}
            send={send}
          />
        )}

        {state.phase === "character-creation-obsession" && (
          <ObsessionPhase
            state={state}
            isGM={isGM}
            send={send}
            nonGMPlayers={nonGMPlayers}
          />
        )}

        {state.phase === "character-creation-pockets" && (
          <PocketsPhase
            state={state}
            isGM={isGM}
            send={send}
            nonGMPlayers={nonGMPlayers}
          />
        )}

        {/* Player Cards Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
          {nonGMPlayers.map((p) => (
            <div
              key={p.id}
              className={`bg-gray-900 rounded-lg border p-3 ${
                state.spotlightPlayerId === p.id
                  ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                  : "border-gray-800"
              }`}
            >
              <p className="font-bold text-sm">{p.name}</p>
              {p.form && (
                <p className="text-xs text-green-400 mt-1">{p.form}</p>
              )}
              {p.adjectives.length > 0 && (
                <p className="text-xs text-purple-400 mt-1">
                  {p.adjectives.join(", ")}
                </p>
              )}
              {p.obsession && (
                <p className="text-xs text-orange-400 mt-1">{p.obsession}</p>
              )}
              {p.pocketItems.length > 0 && (
                <div className="mt-1">
                  {p.pocketItems.map((item, i) => (
                    <p key={i} className="text-xs text-gray-400">
                      - {item}
                    </p>
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
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
            >
              Next Phase →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Sub-components for each phase ----

function FormPhase({
  state,
  isGM,
  send,
  nonGMPlayers,
}: {
  state: GameState;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
  nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-3">
      {isGM && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <p className="text-sm text-gray-400 mb-2">Roll for each player:</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-sm">
                {p.name}: {p.form ? <span className="text-green-400">{p.form}</span> : <span className="text-gray-600">Not rolled</span>}
              </span>
              {!p.form && (
                <button
                  onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 6 })}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm font-bold transition-colors"
                >
                  Roll d6
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reference table */}
      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">The Forms</p>
        {FORMS.map((form, i) => (
          <p key={i} className="text-xs text-gray-400">
            <span className="text-yellow-300 font-mono">{i + 1}.</span> {form}
          </p>
        ))}
      </div>
    </div>
  );
}

function DescriptionPhase({
  state,
  playerId,
  isGM,
  hasSubmittedAdjectives,
  adjective1,
  adjective2,
  adjective3,
  setAdjective1,
  setAdjective2,
  setAdjective3,
  description,
  setDescription,
  me,
  nonGMPlayers,
  send,
}: {
  state: GameState;
  playerId: string;
  isGM: boolean;
  hasSubmittedAdjectives: boolean;
  adjective1: string;
  adjective2: string;
  adjective3: string;
  setAdjective1: (v: string) => void;
  setAdjective2: (v: string) => void;
  setAdjective3: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  me: GameState["players"][0] | undefined;
  nonGMPlayers: GameState["players"];
  send: (msg: ClientMessage) => void;
}) {
  const allSubmitted =
    state.adjectivesSubmitted.length >= nonGMPlayers.length;

  // Player adjective submission
  if (!isGM && !hasSubmittedAdjectives) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-3">
        <p className="text-sm text-gray-300">
          Write 3 physical adjectives (e.g., Slimy, Vibrating, Crusty, Magnetic, Damp...)
        </p>
        <input
          type="text"
          placeholder="Adjective 1"
          value={adjective1}
          onChange={(e) => setAdjective1(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-purple-400"
        />
        <input
          type="text"
          placeholder="Adjective 2"
          value={adjective2}
          onChange={(e) => setAdjective2(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-purple-400"
        />
        <input
          type="text"
          placeholder="Adjective 3"
          value={adjective3}
          onChange={(e) => setAdjective3(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-purple-400"
        />
        <button
          onClick={() => {
            if (adjective1.trim() && adjective2.trim() && adjective3.trim()) {
              send({
                type: "submit-adjectives",
                adjectives: [adjective1.trim(), adjective2.trim(), adjective3.trim()],
              });
            }
          }}
          disabled={!adjective1.trim() || !adjective2.trim() || !adjective3.trim()}
          className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded font-bold text-sm transition-colors"
        >
          Submit Adjectives
        </button>
      </div>
    );
  }

  // Waiting for others or showing dealt adjectives
  if (!allSubmitted) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
        <p className="text-gray-400">
          Waiting for adjectives... ({state.adjectivesSubmitted.length}/{nonGMPlayers.length} submitted)
        </p>
      </div>
    );
  }

  // Adjectives have been dealt — show results and description input
  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-lg border border-purple-800 p-4 text-center">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Adjectives Dealt!</p>
        {me && !me.isGM && (
          <div>
            <p className="text-lg font-bold text-purple-300">
              {me.adjectives.join(", ")}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              You are a <span className="text-purple-300">{me.adjectives.join(", ")}</span>{" "}
              <span className="text-green-400">{me.form}</span>.
            </p>
            {!me.description && (
              <div className="mt-3 space-y-2">
                <textarea
                  placeholder="Explain WHY you look like this..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={() => {
                    if (description.trim()) {
                      send({ type: "submit-description", description: description.trim() });
                    }
                  }}
                  disabled={!description.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-bold transition-colors"
                >
                  Save Description
                </button>
              </div>
            )}
            {me.description && (
              <p className="text-sm text-gray-300 mt-2 italic">&quot;{me.description}&quot;</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ObsessionPhase({
  state,
  isGM,
  send,
  nonGMPlayers,
}: {
  state: GameState;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
  nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-3">
      {isGM && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <p className="text-sm text-gray-400 mb-2">Roll obsessions:</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-sm">
                {p.name}:{" "}
                {p.obsession ? (
                  <span className="text-orange-400">{p.obsession}</span>
                ) : (
                  <span className="text-gray-600">Not rolled</span>
                )}
              </span>
              {!p.obsession && (
                <button
                  onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 6 })}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-500 rounded text-sm font-bold transition-colors"
                >
                  Roll d6
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">The Obsessions</p>
        {OBSESSIONS.map((obs, i) => (
          <p key={i} className="text-xs text-gray-400">
            <span className="text-yellow-300 font-mono">{i + 1}.</span> {obs}
          </p>
        ))}
      </div>
    </div>
  );
}

function PocketsPhase({
  state,
  isGM,
  send,
  nonGMPlayers,
}: {
  state: GameState;
  isGM: boolean;
  send: (msg: ClientMessage) => void;
  nonGMPlayers: GameState["players"];
}) {
  return (
    <div className="space-y-3">
      {isGM && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 space-y-2">
          <p className="text-sm text-gray-400 mb-2">Roll pocket items (2 each):</p>
          {nonGMPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-sm">
                {p.name}: {p.pocketItems.length}/2 items
                {p.pocketItems.length > 0 && (
                  <span className="text-gray-500 text-xs ml-2">
                    ({p.pocketItems.join(", ")})
                  </span>
                )}
              </span>
              {p.pocketItems.length < 2 && (
                <button
                  onClick={() => send({ type: "gm-roll", playerId: p.id, dieSize: 20 })}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors"
                >
                  Roll d20
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Goblin Pockets</p>
        <div className="grid grid-cols-2 gap-x-4">
          {POCKET_ITEMS.map((item, i) => (
            <p key={i} className="text-xs text-gray-400">
              <span className="text-yellow-300 font-mono">{i + 1}.</span> {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
