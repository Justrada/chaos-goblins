// ============================================================
// Hook for connecting to the PartyKit server
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import { GameState, ClientMessage, ServerMessage, DiceRoll } from "./types";

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

// Stable per-room player id, persisted so a page refresh (or tab reopen)
// reconnects as the SAME player instead of a stranger locked out mid-game.
function getPersistentId(roomCode: string): string {
  const key = `cg-player-id:${roomCode}`;
  try {
    let id = window.localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(key, id);
    }
    return id;
  } catch {
    // Storage blocked (private mode etc.) — fall back to a session-only id.
    return crypto.randomUUID();
  }
}

export function usePartySocket(
  roomCode: string | null,
  opts?: { spectator?: boolean }
) {
  const spectator = opts?.spectator ?? false;
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    // Spectators (the stream overlay) use a throwaway id so they never
    // collide with a real player connection from the same browser.
    const socket = new PartySocket({
      host: PARTY_HOST,
      room: roomCode,
      ...(spectator ? {} : { id: getPersistentId(roomCode) }),
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case "state":
          setState(msg.state);
          break;
        case "player-id":
          setPlayerId(msg.id);
          break;
        case "roll-animation":
          setCurrentRoll(msg.roll);
          // Clear after the animation; reset the timer if rolls come fast.
          if (rollTimer.current) clearTimeout(rollTimer.current);
          rollTimer.current = setTimeout(() => setCurrentRoll(null), 3000);
          break;
        case "error":
          setError(msg.message);
          if (errorTimer.current) clearTimeout(errorTimer.current);
          errorTimer.current = setTimeout(() => setError(null), 3000);
          break;
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
      if (rollTimer.current) clearTimeout(rollTimer.current);
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, [roomCode, spectator]);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { state, playerId, connected, currentRoll, error, send };
}
