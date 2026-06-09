"use client";

import { useEffect, useState } from "react";
import { obsViewUrl } from "@/lib/video";

// Collapsible GM-only reference card listing the exact OBS browser-source
// URLs. Build the OBS scene once; the URLs never change between sessions.
export default function StreamSetup({ roomCode }: { roomCode: string }) {
  const [show, setShow] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copy = (label: string, url: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
  };

  const overlayUrl = origin ? `${origin}/overlay/${roomCode}` : `…/overlay/${roomCode}`;

  const videoSources: { label: string; url: string }[] = [
    { label: "GM camera", url: obsViewUrl(0, true) },
    ...Array.from({ length: 7 }, (_, i) => ({
      label: `Player seat ${i + 1}`,
      url: obsViewUrl(i + 1, false),
    })),
  ];

  const Row = ({ label, url }: { label: string; url: string }) => (
    <div className="panel-white p-2 flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-[#000080] min-w-[110px]">{label}</span>
      <code className="font-courier text-xs text-[#006600] flex-1 min-w-[180px] break-all">{url}</code>
      <button onClick={() => copy(label, url)} className="btn-98 !text-sm !px-2 !py-1">
        {copied === label ? "Copied!" : "Copy"}
      </button>
    </div>
  );

  return (
    <div className="panel-sunken p-3">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-[#000080]">&#9658; OBS / Stream Setup</span>
        <button onClick={() => setShow((s) => !s)} className="btn-98 !text-sm !px-2 !py-1">
          {show ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {show && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#000000] font-bold">
            Add each of these as a <b>Browser Source</b> in OBS. The video sources are clean
            feeds; lay the overlay on top. For audio: set each video source&apos;s Audio
            Monitoring to <b>Monitor Off</b> so your desktop doesn&apos;t echo.
          </p>

          <div>
            <p className="text-base text-[#cc0000] font-bold uppercase mb-1">&#9733; Game Overlay (graphics) &#9733;</p>
            <Row label="Overlay" url={overlayUrl} />
          </div>

          <div>
            <p className="text-base text-[#cc0000] font-bold uppercase mb-1">&#9733; Video Feeds (one per seat) &#9733;</p>
            <div className="space-y-2">
              {videoSources.map((s) => (
                <Row key={s.label} label={s.label} url={s.url} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
