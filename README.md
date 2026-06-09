# Chaos Goblins

Online companion app for the Chaos Goblins tabletop RPG — a rules-light party
game where polymorphed goblins try to save the kingdom without blowing their
cover. Real-time shared game state, built-in video chat, and a stream overlay
styled as a Windows 98 desktop.

## Architecture

Two deploy targets — **both must be deployed when their code changes**:

| Piece | Code | Deploys to | How |
|---|---|---|---|
| Web app (UI) | `src/` | Vercel | `git push` to `main` (auto) |
| Game server (state sync) | `party/index.ts` | PartyKit | `npx partykit deploy` |

Shared game logic lives in `src/lib/gameLogic.ts` + `src/lib/types.ts` and is
imported by both the UI and the PartyKit server.

Video is WebRTC via [VDO.Ninja](https://vdo.ninja) — one fixed room
(`Chaos_Goblins01`) with seat-based stream IDs (`gm`, `seat1`..`seat7`), so OBS
sources never change between sessions. See `src/lib/video.ts`.

## Local development

Run BOTH servers:

```bash
npm run dev          # Next.js on :3000
npx partykit dev     # game server on :1999 (separate terminal)
```

`NEXT_PUBLIC_PARTYKIT_HOST` picks the game server: `.env.local` points at
localhost, `.env.production` (and the Vercel env var) at
`chaos-goblins.justrada.partykit.dev`.

## Routes

- `/` — create/join a room (4-letter code)
- `/room/<CODE>` — the game (lobby → character creation → mission → gameplay)
- `/overlay/<CODE>` — combined stream scene for OBS (video tiles + HUD,
  Win98 desktop style). Add as a single OBS Browser Source.

Per-guest raw video+audio feed URLs (for separate recording channels) are in
the GM panel → "OBS / Stream Setup".
