"use client";

import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { DiceRoll } from "@/lib/types";

interface DiceRollerProps {
  roll: DiceRoll | null;
}

export default function DiceRoller({ roll }: DiceRollerProps) {
  const [displayNumber, setDisplayNumber] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [flash, setFlash] = useState<"success" | "failure" | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roll) {
      setDisplayNumber(null);
      setIsRolling(false);
      setOutcome(null);
      setFlash(null);
      return;
    }

    setIsRolling(true);
    setOutcome(null);
    setFlash(null);

    let count = 0;
    const maxSpins = 15;
    intervalRef.current = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * roll.dieSize) + 1);
      count++;
      if (count >= maxSpins) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayNumber(roll.result);
        setIsRolling(false);

        if (roll.outcome === "success" || roll.outcome === "critical") {
          setFlash("success");
          setOutcome(roll.outcome === "critical" ? "CRITICAL!!!" : "Success!");
          confetti({
            particleCount: roll.outcome === "critical" ? 200 : 80,
            spread: roll.outcome === "critical" ? 120 : 70,
            origin: { y: 0.6 },
            colors: roll.outcome === "critical"
              ? ["#ffff00", "#ff0000", "#00ff00", "#0000ff"]
              : ["#00ff00", "#00cc00", "#00ff88"],
          });
        } else if (roll.outcome === "failure") {
          setFlash("failure");
          setOutcome("FAILURE...");
        }

        setTimeout(() => setFlash(null), 1000);
      }
    }, 80);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roll]);

  if (!roll && displayNumber === null) return null;

  const dieLabel = `d${roll?.dieSize || 6}`;

  return (
    <>
      {/* Screen flash overlay */}
      {flash === "failure" && (
        <div className="fixed inset-0 bg-[#ff0000]/30 pointer-events-none z-50 animate-pulse" />
      )}

      <div className="flex flex-col items-center gap-3 py-4">
        {/* Player name */}
        {roll && (
          <p className="text-xl text-[#00ffff] title-shadow uppercase">
            &#9733; {roll.playerName} rolls {roll.type !== "table" ? `(${roll.type})` : ""} {dieLabel} &#9733;
          </p>
        )}

        {/* The die */}
        <div
          className={`
            relative w-36 h-36 flex items-center justify-center
            font-impact text-7xl
            ${isRolling ? "animate-bounce" : ""}
          `}
          style={{
            border: isRolling
              ? "5px outset #ffff00"
              : flash === "success"
                ? "5px outset #00ff00"
                : flash === "failure"
                  ? "5px outset #ff0000"
                  : "5px outset #c0c0c0",
            background: isRolling
              ? "#000080"
              : flash === "success"
                ? "#003300"
                : flash === "failure"
                  ? "#330000"
                  : "#000080",
            boxShadow: flash === "success"
              ? "0 0 30px #00ff00"
              : flash === "failure"
                ? "0 0 30px #ff0000"
                : "none",
          }}
        >
          <span
            className={`
              ${isRolling ? "animate-spin" : ""}
              ${flash === "success" ? "text-[#00ff00]" : ""}
              ${flash === "failure" ? "text-[#ff0000]" : ""}
              ${!flash && !isRolling ? "text-[#ffffff]" : ""}
            `}
            style={{ textShadow: "3px 3px 0 #000" }}
          >
            {displayNumber ?? "?"}
          </span>
        </div>

        {/* Outcome label */}
        {outcome && (
          <p
            className={`
              text-4xl font-impact uppercase title-shadow
              ${outcome === "CRITICAL!!!" ? "text-[#ffff00] blink" : ""}
              ${outcome === "Success!" ? "text-[#00ff00]" : ""}
              ${outcome === "FAILURE..." ? "text-[#ff0000]" : ""}
            `}
          >
            {outcome}
          </p>
        )}

        {/* Advantage/disadvantage: show both dice and which one counted */}
        {roll?.modifier && roll.rolls?.length === 2 && !isRolling && (
          <p className="text-lg text-[#ffff00] font-bold title-shadow">
            {roll.modifier.toUpperCase()}: rolled {roll.rolls.join(" & ")} → kept {roll.result}
          </p>
        )}

        {/* For table rolls */}
        {roll?.type === "table" && !isRolling && displayNumber !== null && (
          <p className="text-lg text-[#ff00ff]">Table roll: {displayNumber}</p>
        )}
      </div>
    </>
  );
}
