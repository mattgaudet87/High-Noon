# High Noon: project rules

Side-scrolling western showdown game. The player (the Sheriff) spends Grub to deploy
lawmen who march right and attack the outlaw Hideout. Win = destroy the Hideout.
Owner: Matt (not a developer). Explain every change in plain language.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind
- Phaser 3 for the game, mounted in ONE client component (next/dynamic, ssr: false)
- Drizzle ORM + Turso (libSQL) for cloud saves (added in Phase 7)
- Hosted on Vercel. Local dev on port 3004 via pm2

## Run it (pm2 only, never a raw `npm run dev`)
- Start: `pm2 start npm --name high-noon -- run dev -- -p 3004`
- Restart: `pm2 restart high-noon`   Stop: `pm2 stop high-noon`
- Logs: `pm2 logs high-noon --lines 50 --nostream`
- Run `pm2 save` after any start/stop/delete change
- Open: http://localhost:3004

## Folder map
- `src/app/page.tsx` title screen. `src/app/play/page.tsx` hosts the game
- `src/components/GameCanvas.tsx` creates and destroys the Phaser game
- `src/game/scenes/` one file per scene (Boot, StageSelect, Battle, Results, Shop)
- `src/game/art/` code-drawn visuals, one function per unit/building
- `src/game/config/` ALL balance numbers (units, economy, stages, upgrades)
- `src/game/ai/` enemy logic
- `src/lib/save/` local save + cloud sync. `src/db/` Drizzle schema + client
- `src/app/api/save/route.ts` GET and PUT the cloud save

## Game rules (source of truth)
- Units: Brawler (melee), Gunslinger (ranged), Rider (fast, horseback)
- Counters deal 2x damage: Brawler > Gunslinger > Rider > Brawler
- Grub = in-battle resource, ticks up automatically, resets every battle
- Bounty = permanent currency, earned from battles, spent in the General Store
- Unit levels 1 to 5. Lv3 adds duster coat + tin badge. Lv5 adds gold star + silver weapon
- Power: Dynamite. Player swipes across the street, blasts hit outlaws along the swipe
- Player base = Jailhouse (left). Enemy base = Hideout (right)
- Grounded Western tone: no magic, no fantasy creatures

## Art rules
- Everything is drawn with Phaser Graphics. No image files yet
- Each draw function takes (graphics, x, y, facing, level) so PNG sprites can replace it later
- Lawmen: blue shirts, white hats. Outlaws: dark red shirts, black hats, bandanas

## Data rules
- Table `saves`: id (text, always "main"), bounty (int), unit_levels (JSON text),
  highest_stage (int), settings (JSON text), updated_at (int, ms timestamp)
- Save to localStorage first, then sync to Turso. Newest updated_at wins
- API requires header `x-save-pin` matching env `SAVE_PIN`, else return 401
- Env vars: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, SAVE_PIN (.env.local, never committed)
- The game must stay playable if Turso is unreachable

## Coding rules
- Never hardcode balance numbers in scenes. Import from `src/game/config/`
- Touch and mouse must both work. Use Phaser pointer events only
- Game size 1280x720, Phaser Scale.FIT, landscape
- Small focused changes. Do not refactor files outside the current phase
- Do not add libraries without asking Matt first
- No em dashes in any user-facing text

## Communicating with Matt
After completing each task, tell me clearly: what you did, what you created or
changed, and what the next step is. If you run into a decision that requires my
input, give me two options with your recommendation.
End each phase with the exact git commit command for me to run.
