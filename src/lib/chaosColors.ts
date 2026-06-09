// Shared chaos-zone palette: 0 (Full Human / blue) .. 8 (Full Goblin / red).
// Used for meters, borders, and badges so every surface agrees.
export function chaosZoneColor(value: number): string {
  if (value >= 7) return "#ff0000";
  if (value >= 5) return "#ff6600";
  if (value >= 3) return "#ffcc00";
  if (value >= 1) return "#0088ff";
  return "#0066ff";
}
