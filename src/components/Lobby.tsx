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
    <div className="min-h-screen bg-starfield flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6">
        {/* Title */}
        <div className="text-center">
          <h1 className="title-90s title-shadow text-6xl text-[#00ff00]">CHAOS GOBLINS</h1>
          <p className="text-[#ffff00] mt-2 text-xl title-shadow">
            ~~* A Rules-Light RPG for Creatures of Chaos *~~
          </p>
        </div>

        <hr className="hr-rainbow" />

        {/* Room Code */}
        <div className="text-center">
          <p className="text-[#00ffff] text-lg">ROOM CODE:</p>
          <p className="title-90s title-shadow text-6xl text-[#ffff00] tracking-[0.4em]">
            {state.roomCode}
          </p>
        </div>

        <hr className="hr-rainbow" />

        {/* Join Form or Player List */}
        {!hasJoined ? (
          <div className="panel-raised space-y-4">
            <p className="text-[#000080] text-lg font-bold text-center">
              &#9733; Enter Your Name to Join! &#9733;
            </p>
            <input
              type="text"
              placeholder="Your name here..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) onJoin(name.trim());
              }}
              maxLength={20}
              className="input-98 w-full text-center text-xl"
            />
            <button
              onClick={() => name.trim() && onJoin(name.trim())}
              disabled={!name.trim()}
              className="btn-98 btn-98-green btn-98-big w-full"
            >
              {state.players.length === 0 ? "☞ Create Room (as GM)" : "☞ Join Game!"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Player List */}
            <div className="panel-raised">
              <p className="text-[#000080] text-xl font-bold text-center mb-3">
                &#9733; Players Connected ({state.players.length}) &#9733;
              </p>
              <div className="panel-sunken space-y-2 p-3">
                {state.players.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-3 py-2 ${
                      p.id === playerId ? "bg-[#ccffcc]" : "bg-[#ffffff]"
                    } border-2 ${p.id === playerId ? "border-[#00cc00]" : "border-[#c0c0c0]"}`}
                    style={{ borderStyle: "inset" }}
                  >
                    <span className={`text-2xl ${p.isGM ? "text-[#cc0000]" : "text-[#008000]"}`}>
                      {p.isGM ? "★" : "●"}
                    </span>
                    <span className="text-lg font-bold text-[#000000]">{p.name}</span>
                    {p.isGM && (
                      <span className="text-sm bg-[#ff0000] text-[#ffffff] px-2 py-0.5 font-bold ml-auto border-2 outset">
                        GM
                      </span>
                    )}
                    {p.id === playerId && !p.isGM && (
                      <span className="text-sm text-[#808080] ml-auto italic">(you)</span>
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
                className="btn-98 btn-98-yellow btn-98-xl w-full"
              >
                &#9758; Start Game! &#9756;
              </button>
            )}

            {!isGM && (
              <p className="text-center text-[#00ffff] text-xl blink">
                Waiting for the GM to start the game...
              </p>
            )}
          </div>
        )}

        <hr className="hr-rainbow" />
      </div>
    </div>
  );
}
