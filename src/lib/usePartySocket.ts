// ============================================================
// Hook for connecting to the PartyKit server
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PartySocket from "partysocket";
import { GameState, ClientMessage, ServerMessage, DiceRoll } from "./types";

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

export function usePartySocket(roomCode: string | null) {
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [currentRoll, setCurrentRoll] = useState<DiceRoll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const socket = new PartySocket({
      host: PARTY_HOST,
      room: roomCode,
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setConnected(true);
    });

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    socket.addEventListener("message", (event) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "state":
          setState(msg.state);
          break;
        case "player-id":
          setPlayerId(msg.id);
          break;
        case "roll-animation":
          setCurrentRoll(msg.roll);
          // Clear roll after animation time
          setTimeout(() => setCurrentRoll(null), 3000);
          break;
        case "error":
          setError(msg.message);
          setTimeout(() => setError(null), 3000);
          break;
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomCode]);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { state, playerId, connected, currentRoll, error, send };
}
