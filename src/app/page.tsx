"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const createRoom = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    router.push(`/room/${code}`);
  };

  const joinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/room/${code}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-6">
      <div className="max-w-sm w-full space-y-10 text-center">
        <div>
          <h1 className="text-6xl font-black text-green-400 tracking-tight leading-none">
            CHAOS
          </h1>
          <h1 className="text-6xl font-black text-green-300 tracking-tight leading-none">
            GOBLINS
          </h1>
          <p className="text-gray-500 mt-3 text-sm italic">
            A Rules-Light RPG for 3-8 Creatures of Chaos
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-left">
          <p className="text-sm text-gray-300 leading-relaxed">
            You are a pack of nasty, chaotic goblins. A bored Wizard has lazily
            True Polymorphed you into upstanding citizens and tasked you with
            saving the kingdom.
          </p>
          <p className="text-sm text-gray-500 mt-2 italic">
            The problem? You still have the brain, urges, and soul of a goblin.
          </p>
        </div>

        <button
          onClick={createRoom}
          className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xl transition-colors"
        >
          Create New Game
        </button>

        <div className="space-y-3">
          <p className="text-gray-500 text-sm">— or join an existing game —</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              maxLength={4}
              className="flex-1 min-w-0 px-3 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 text-center text-xl font-mono tracking-[0.2em] focus:outline-none focus:border-green-400"
            />
            <button
              onClick={joinRoom}
              disabled={joinCode.trim().length < 4}
              className="shrink-0 px-5 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg font-bold transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
