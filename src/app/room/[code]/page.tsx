"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import Lobby from "@/components/Lobby";
import CharacterCreation from "@/components/CharacterCreation";
import MissionSetup from "@/components/MissionSetup";
import GameDashboard from "@/components/GameDashboard";
import GameOver from "@/components/GameOver";

export default function RoomPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, playerId, connected, currentRoll, error, send } =
    usePartySocket(code);

  const [hasJoined, setHasJoined] = useState(false);

  if (!connected || !state) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400">Connecting to room {code}...</p>
        </div>
      </div>
    );
  }

  const me = state.players.find((p) => p.id === playerId);
  const isGM = me?.isGM ?? false;

  const handleJoin = (name: string) => {
    send({ type: "join", name });
    setHasJoined(true);
  };

  const handleStart = () => {
    send({ type: "start-game" });
  };

  return (
    <>
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {state.phase === "lobby" && (
        <Lobby
          state={state}
          playerId={playerId || ""}
          isGM={isGM}
          hasJoined={hasJoined}
          onJoin={handleJoin}
          onStart={handleStart}
        />
      )}

      {(state.phase === "character-creation-form" ||
        state.phase === "character-creation-description" ||
        state.phase === "character-creation-obsession" ||
        state.phase === "character-creation-pockets") && (
        <CharacterCreation
          state={state}
          playerId={playerId || ""}
          isGM={isGM}
          currentRoll={currentRoll}
          send={send}
        />
      )}

      {state.phase === "mission-setup" && (
        <MissionSetup
          state={state}
          isGM={isGM}
          currentRoll={currentRoll}
          send={send}
        />
      )}

      {state.phase === "gameplay" && (
        <GameDashboard
          state={state}
          playerId={playerId || ""}
          isGM={isGM}
          currentRoll={currentRoll}
          send={send}
        />
      )}

      {state.phase === "game-over" && <GameOver state={state} />}
    </>
  );
}
