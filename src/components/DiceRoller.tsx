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

    // Spinning animation — rapid random numbers
    let count = 0;
    const maxSpins = 15;
    intervalRef.current = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * roll.dieSize) + 1);
      count++;
      if (count >= maxSpins) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Land on final number
        setDisplayNumber(roll.result);
        setIsRolling(false);

        // Trigger effects
        if (roll.outcome === "success" || roll.outcome === "critical") {
          setFlash("success");
          setOutcome(roll.outcome === "critical" ? "CRITICAL!" : "Success!");
          confetti({
            particleCount: roll.outcome === "critical" ? 200 : 80,
            spread: roll.outcome === "critical" ? 120 : 70,
            origin: { y: 0.6 },
            colors: roll.outcome === "critical"
              ? ["#FFD700", "#FFA500", "#FF6347", "#7CFC00"]
              : ["#7CFC00", "#00FA9A", "#98FB98"],
          });
        } else if (roll.outcome === "failure") {
          setFlash("failure");
          setOutcome("Failure...");
        }

        // Clear flash after a moment
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
        <div className="fixed inset-0 bg-red-900/40 pointer-events-none z-50 animate-pulse" />
      )}

      <div className="flex flex-col items-center gap-3 py-6">
        {/* Player name */}
        {roll && (
          <p className="text-sm text-gray-400 uppercase tracking-wider">
            {roll.playerName} rolls {roll.type !== "table" ? `(${roll.type})` : ""} {dieLabel}
          </p>
        )}

        {/* The die */}
        <div
          className={`
            relative w-28 h-28 flex items-center justify-center
            rounded-2xl border-4 font-bold text-5xl
            transition-all duration-200
            ${isRolling
              ? "border-yellow-400 bg-yellow-400/10 animate-bounce scale-110"
              : flash === "success"
                ? "border-green-400 bg-green-400/20 shadow-[0_0_30px_rgba(74,222,128,0.5)]"
                : flash === "failure"
                  ? "border-red-500 bg-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  : "border-gray-500 bg-gray-800"
            }
          `}
        >
          <span
            className={`
              ${isRolling ? "animate-spin" : ""}
              ${flash === "success" ? "text-green-300" : ""}
              ${flash === "failure" ? "text-red-300" : ""}
              ${!flash && !isRolling ? "text-white" : ""}
            `}
          >
            {displayNumber ?? "?"}
          </span>
        </div>

        {/* Outcome label */}
        {outcome && (
          <p
            className={`
              text-2xl font-black uppercase tracking-wider
              ${outcome === "CRITICAL!" ? "text-yellow-300 animate-pulse" : ""}
              ${outcome === "Success!" ? "text-green-400" : ""}
              ${outcome === "Failure..." ? "text-red-400" : ""}
            `}
          >
            {outcome}
          </p>
        )}

        {/* For table rolls, show what was rolled */}
        {roll?.type === "table" && !isRolling && displayNumber !== null && (
          <p className="text-xs text-gray-500 mt-1">Table roll: {displayNumber}</p>
        )}
      </div>
    </>
  );
}
