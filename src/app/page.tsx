"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [visitorCount, setVisitorCount] = useState<string | null>(null);

  // Generate visitor count only on the client to avoid SSR hydration mismatch
  useEffect(() => {
    setVisitorCount(
      String(Math.floor(Math.random() * 9000) + 1000).padStart(6, "0")
    );
  }, []);

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
    <div className="min-h-screen bg-starfield flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full space-y-6 text-center">
        {/* Title */}
        <div>
          <h1 className="title-90s title-shadow text-8xl text-[#00ff00] leading-none">
            CHAOS
          </h1>
          <h1 className="title-90s title-shadow text-8xl text-[#ff0000] leading-none">
            GOBLINS
          </h1>
          <p className="text-[#ffff00] mt-3 text-2xl title-shadow">
            ~~* A Rules-Light RPG for 3-8 Creatures of Chaos *~~
          </p>
        </div>

        <hr className="hr-rainbow" />

        {/* Description panel */}
        <div className="panel-raised text-left text-lg">
          <p className="text-[#000080] font-bold">
            You are a pack of nasty, chaotic goblins. A bored Wizard has lazily
            True Polymorphed you into upstanding citizens and tasked you with
            saving the kingdom.
          </p>
          <br />
          <p className="text-[#cc0000] font-bold italic">
            The problem? You still have the brain, urges, and soul of a goblin.
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={createRoom}
          className="btn-98 btn-98-green btn-98-xl w-full"
        >
          &#9758; Create New Game &#9756;
        </button>

        <hr className="hr-rainbow" />

        {/* Join section */}
        <div className="space-y-3">
          <p className="text-[#00ffff] text-xl title-shadow">
            --- or join an existing game ---
          </p>
          <div className="flex gap-3 justify-center">
            <input
              type="text"
              placeholder="CODE"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
              maxLength={4}
              className="input-98 w-48 text-center text-2xl tracking-[0.3em] font-courier font-bold"
            />
            <button
              onClick={joinRoom}
              disabled={joinCode.trim().length < 4}
              className="btn-98 btn-98-blue btn-98-big"
            >
              Join!
            </button>
          </div>
        </div>

        <hr className="hr-rainbow" />

        {/* Footer vibes */}
        <div className="text-[#808080] text-sm space-y-2">
          <p>Best viewed in Netscape Navigator 4.0 at 800x600</p>
          <div className="visitor-counter">
            Visitors: {visitorCount ?? "------"}
          </div>
        </div>
      </div>
    </div>
  );
}
