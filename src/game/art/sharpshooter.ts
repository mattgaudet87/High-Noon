import Phaser from "phaser";
import { Team } from "./brawler";

const LAWMAN_SHIRT = 0x2f5da8;
const LAWMAN_HAT = 0xf5f2e8;
const OUTLAW_SHIRT = 0x7a1f1f;
const OUTLAW_HAT = 0x1c1c1c;
const SKIN = 0xd9a066;

export function drawSharpshooter(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: 1 | -1,
  level: number,
  team: Team = "lawman"
) {
  const shirt = team === "lawman" ? LAWMAN_SHIRT : OUTLAW_SHIRT;
  const hatColor = team === "lawman" ? LAWMAN_HAT : OUTLAW_HAT;

  // Legs (narrow, crouched stance)
  graphics.fillStyle(0x3f2c1e, 1);
  graphics.fillRect(x - 7, y - 16, 5, 16);
  graphics.fillRect(x + 2, y - 16, 5, 16);

  // Body (lean build)
  graphics.fillStyle(shirt, 1);
  graphics.fillRoundedRect(x - 9, y - 36, 18, 22, 4);

  // Head
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x, y - 44, 8);

  // Wide-brimmed hat, pulled low
  graphics.fillStyle(hatColor, 1);
  graphics.fillRoundedRect(x - 13, y - 51, 26, 5, 2);
  graphics.fillRoundedRect(x - 5, y - 56, 10, 6, 2);

  if (team === "outlaw") {
    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRect(x - 8, y - 45, 16, 5);
  }

  // Long rifle held out with a small scope on top
  graphics.fillStyle(0x3a3a3a, 1);
  graphics.fillRect(x, y - 30, facing * 28, 3);
  graphics.fillStyle(0x5c4326, 1);
  graphics.fillRect(x - facing * 2, y - 31, facing * 8, 5);
  graphics.fillStyle(0x2b2b2b, 1);
  graphics.fillRect(x + facing * 10, y - 34, 5, 3);

  if (level >= 3) {
    graphics.fillStyle(0x5c4326, 1);
    graphics.fillRoundedRect(x - 10, y - 34, 20, 18, 4);
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillCircle(x, y - 28, 3);
  }

  if (level >= 5) {
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(x, y - 28, 3.5);
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillRect(x, y - 30, facing * 28, 3);
  }
}
