"use client";

import { useState } from "react";
import { obsViewUrl } from "@/lib/video";

// Collapsible GM-only reference card listing the exact OBS browser-source
// URLs. Build the OBS scene once; the URLs never change between sessions.

function UrlRow({
  label,
  url,
  copied,
  onCopy,
}: {
  label: string;
  url: string;
  copied: boolean;
  onCopy: (label: string, url: string) => void;
}) {
  return (
    <div className="panel-white p-2 flex flex-wrap items-center gap-2">
      <span className="text-sm font-bold text-[#000080] min-w-[110px]">{label}</span>
      <code className="font-courier text-xs text-[#006600] flex-1 min-w-[180px] break-all">{url}</code>
      <button onClick={() => onCopy(label, url)} className="btn-98 !text-sm !px-2 !py-1">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

export default function StreamSetup({ roomCode }: { roomCode: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (label: string, url: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(label);
    setTimeout(() => setCopied((c) => (c === label ? null : c)), 1500);
  };

  // This component never server-renders (it's gated behind the websocket
  // connection), so window is always available here.
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const overlayUrl = `${origin}/overlay/${roomCode}`;

  const rawFeeds: { label: string; url: string }[] = [
    { label: "GM (video+audio)", url: obsViewUrl(0, true) },
    ...Array.from({ length: 7 }, (_, i) => ({
      label: `Seat ${i + 1} (video+audio)`,
      url: obsViewUrl(i + 1, false),
    })),
  ];

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
          <div>
            <p className="text-base text-[#cc0000] font-bold uppercase mb-1">&#9733; Combined Scene (use this in OBS) &#9733;</p>
            <p className="text-sm text-[#000000] font-bold mb-1">
              One Browser Source = the whole show: video tiles, chaos borders, animations,
              mic glow, and the game HUD, all in one.
            </p>
            <UrlRow label="Combined Scene" url={overlayUrl} copied={copied === "Combined Scene"} onCopy={copy} />
          </div>

          <div>
            <p className="text-base text-[#cc0000] font-bold uppercase mb-1">&#9733; Per-Guest Raw Feeds (video + audio) &#9733;</p>
            <p className="text-sm text-[#000000] font-bold mb-1">
              Clean individual feeds (with audio) for recording each guest on a separate
              channel. Paste into your own OBS/recorder workflow.
            </p>
            <div className="space-y-2">
              {rawFeeds.map((s) => (
                <UrlRow key={s.label} label={s.label} url={s.url} copied={copied === s.label} onCopy={copy} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
