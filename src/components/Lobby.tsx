"use client";

import { useState } from "react";
import { GameState } from "@/lib/types";

interface LobbyProps {
  state: GameState;
  playerId: string;
  isGM: boolean;
  hasJoined: boolean;
  onJoin: (name: string) => void;
  onStart: () => void;
}

export default function Lobby({ state, playerId, isGM, hasJoined, onJoin, onStart }: LobbyProps) {
  const [name, setName] = useState("");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-green-400 tracking-tight">
            CHAOS GOBLINS
          </h1>
          <p className="text-gray-400 mt-2 text-sm italic">
            A Rules-Light RPG for Creatures of Chaos
          </p>
        </div>

        {/* Room Code */}
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-widest">Room Code</p>
          <p className="text-4xl font-mono font-bold text-yellow-300 tracking-[0.3em]">
            {state.roomCode}
          </p>
        </div>

        {/* Join Form or Player List */}
        {!hasJoined ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) onJoin(name.trim());
              }}
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400 text-center text-lg"
            />
            <button
              onClick={() => name.trim() && onJoin(name.trim())}
              disabled={!name.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg font-bold text-lg transition-colors"
            >
              {state.players.length === 0 ? "Create Room (as GM)" : "Join Game"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Player List */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">
                Players ({state.players.length})
              </p>
              <div className="space-y-2">
                {state.players.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                      p.id === playerId ? "bg-gray-800 border border-green-800" : "bg-gray-800/50"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        p.isGM ? "bg-yellow-400" : "bg-green-400"
                      }`}
                    />
                    <span className="font-medium">{p.name}</span>
                    {p.isGM && (
                      <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded-full ml-auto">
                        GM
                      </span>
                    )}
                    {p.id === playerId && !p.isGM && (
                      <span className="text-xs text-gray-500 ml-auto">you</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button (GM only) */}
            {isGM && (
              <button
                onClick={onStart}
                disabled={state.players.filter((p) => !p.isGM).length < 1}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-lg rounded-lg transition-colors"
              >
                Start Game
              </button>
            )}

            {!isGM && (
              <p className="text-center text-gray-500 text-sm">
                Waiting for the GM to start the game...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
