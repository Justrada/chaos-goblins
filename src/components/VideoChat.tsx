"use client";

import { useState } from "react";
import { pushUrl, streamIdFor } from "@/lib/video";

interface VideoChatProps {
  seat: number;
  isGM: boolean;
  name?: string;
}

// In-app video chat: joins the fixed VDO.Ninja room and publishes this
// participant's camera under their seat's stream ID (so OBS can pull it
// separately). Collapsible so it doesn't crowd the game board.
export default function VideoChat({ seat, isGM, name = "" }: VideoChatProps) {
  const [show, setShow] = useState(true);
  const [joined, setJoined] = useState(false);
  const id = streamIdFor(seat, isGM);
  const src = pushUrl(seat, isGM, name);

  return (
    <div className="panel-raised p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-bold text-[#000080]">
          &#9742; Video Chat — you are <span className="text-[#cc0000]">{id}</span>
        </span>
        <button
          onClick={() => setShow((s) => !s)}
          className="btn-98 !text-sm !px-2 !py-1"
        >
          {show ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {show && (
        joined ? (
          <iframe
            title="Chaos Goblins Video"
            src={src}
            className="w-full mt-2"
            style={{ height: "240px", border: "3px inset #c0c0c0", background: "#000" }}
            allow="camera; microphone; autoplay; fullscreen; display-capture; picture-in-picture"
          />
        ) : (
          <div className="mt-2 panel-white p-4 text-center">
            <p className="text-base text-[#000080] font-bold mb-2">
              Click to turn on your camera &amp; mic. Wear headphones to avoid echo!
            </p>
            <button onClick={() => setJoined(true)} className="btn-98 btn-98-green btn-98-big">
              &#9742; Join Video
            </button>
          </div>
        )
      )}
    </div>
  );
}
