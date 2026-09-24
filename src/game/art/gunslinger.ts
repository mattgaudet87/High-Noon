import Phaser from "phaser";
import { Team } from "./brawler";

const LAWMAN_SHIRT = 0x2f5da8;
const LAWMAN_HAT = 0xf5f2e8;
const OUTLAW_SHIRT = 0x7a1f1f;
const OUTLAW_HAT = 0x1c1c1c;
const SKIN = 0xd9a066;

export function drawGunslinger(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: 1 | -1,
  level: number,
  team: Team = "lawman"
) {
  const shirt = team === "lawman" ? LAWMAN_SHIRT : OUTLAW_SHIRT;
  const hatColor = team === "lawman" ? LAWMAN_HAT : OUTLAW_HAT;

  // Legs
  graphics.fillStyle(0x3f2c1e, 1);
  graphics.fillRect(x - 8, y - 16, 6, 16);
  graphics.fillRect(x + 2, y - 16, 6, 16);

  // Body (slimmer than the brawler)
  graphics.fillStyle(shirt, 1);
  graphics.fillRoundedRect(x - 10, y - 38, 20, 24, 4);

  // Head
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x, y - 46, 8);

  // Hat
  graphics.fillStyle(hatColor, 1);
  graphics.fillRoundedRect(x - 11, y - 54, 22, 5, 2);
  graphics.fillRoundedRect(x - 5, y - 59, 10, 7, 2);

  if (team === "outlaw") {
    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRect(x - 8, y - 47, 16, 5);
  }

  // Outstretched arm + revolver
  graphics.fillStyle(SKIN, 1);
  graphics.fillRect(x, y - 30, facing * 18, 4);
  graphics.fillStyle(0x3a3a3a, 1);
  graphics.fillRect(x + facing * 14, y - 32, facing * 10, 5);
  graphics.fillRect(x + facing * 16, y - 32, 3, 8);

  if (level >= 3) {
    graphics.fillStyle(0x5c4326, 1);
    graphics.fillRoundedRect(x - 11, y - 36, 22, 20, 4);
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillCircle(x, y - 30, 3);
  }

  if (level >= 5) {
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(x, y - 30, 3.5);
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillRect(x + facing * 14, y - 32, facing * 10, 5);
  }
}
