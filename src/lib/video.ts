// ============================================================
// Chaos Goblins - VDO.Ninja video config
// ============================================================
//
// One fixed "studio" room is reused every session so the OBS scene
// can be built once. Each participant publishes a stable stream ID
// based on their seat (GM = "gm", players = "seat1".."seat7"), so the
// OBS browser sources never need to change between games.

export const VDO_ROOM = "Chaos_Goblins01";
const VDO_BASE = "https://vdo.ninja";

export function streamIdFor(seat: number, isGM: boolean): string {
  return isGM ? "gm" : `seat${seat}`;
}

// URL a player's browser loads to JOIN the room + PUBLISH their camera.
// They also see everyone else in the room (in-app video chat).
export function pushUrl(seat: number, isGM: boolean, name: string): string {
  const id = streamIdFor(seat, isGM);
  const params = new URLSearchParams({
    room: VDO_ROOM,
    push: id,
    label: name || id,
    autostart: "1",
    webcam: "1",
  });
  return `${VDO_BASE}/?${params.toString()}`;
}

// URL for an OBS browser source that pulls ONE participant's feed,
// clean (no UI) so it drops straight into your overlay or a separate channel.
export function obsViewUrl(seat: number, isGM: boolean): string {
  const id = streamIdFor(seat, isGM);
  const params = new URLSearchParams({
    room: VDO_ROOM,
    view: id,
    solo: "1",
    cleanoutput: "1",
  });
  return `${VDO_BASE}/?${params.toString()}`;
}

// URL embedded INSIDE the combined scene for a single seat's video tile.
// cover = fill the container; cleanoutput = no VDO UI.
export function sceneTileUrl(seat: number, isGM: boolean): string {
  const id = streamIdFor(seat, isGM);
  const params = new URLSearchParams({
    room: VDO_ROOM,
    view: id,
    solo: "1",
    cleanoutput: "1",
    cover: "1",
  });
  return `${VDO_BASE}/?${params.toString()}`;
}
