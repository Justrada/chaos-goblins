"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePartySocket } from "@/lib/usePartySocket";
import Lobby from "@/components/Lobby";
import CharacterCreation from "@/components/CharacterCreation";
import MissionSetup from "@/components/MissionSetup";
import GameDashboard from "@/components/GameDashboard";
import GameOver from "@/components/GameOver";
import VideoChat from "@/components/VideoChat";

export default function RoomPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { state, playerId, connected, currentRoll, error, send } =
    usePartySocket(code);

  const [hasJoined, setHasJoined] = useState(false);

  if (!connected || !state) {
    return (
      <div className="min-h-screen bg-starfield flex items-center justify-center">
        <div className="panel-raised p-8 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0000cc] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-[#000080] font-bold">Connecting to room {code}...</p>
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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 panel-red px-6 py-3 text-xl font-bold">
          {error}
        </div>
      )}

      {/* Floating video chat — mounted once at page level so the camera
          connection survives phase changes. */}
      {me && (
        <div className="fixed bottom-2 right-2 z-40 w-80">
          <VideoChat seat={me.seat} isGM={isGM} name={me.name} />
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

      {state.phase === "game-over" && (
        <GameOver state={state} isGM={isGM} send={send} />
      )}
    </>
  );
}
