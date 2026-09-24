import Phaser from "phaser";
import { Team } from "./brawler";

const LAWMAN_SHIRT = 0x2f5da8;
const LAWMAN_HAT = 0xf5f2e8;
const OUTLAW_SHIRT = 0x7a1f1f;
const OUTLAW_HAT = 0x1c1c1c;
const SKIN = 0xd9a066;
const HORSE_BODY = 0x6b4a30;
const HORSE_MANE = 0x2f2016;

export function drawRider(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  facing: 1 | -1,
  level: number,
  team: Team = "lawman"
) {
  const shirt = team === "lawman" ? LAWMAN_SHIRT : OUTLAW_SHIRT;
  const hatColor = team === "lawman" ? LAWMAN_HAT : OUTLAW_HAT;

  // Horse body
  graphics.fillStyle(HORSE_BODY, 1);
  graphics.fillEllipse(x, y - 16, 46, 22);

  // Horse legs
  graphics.fillStyle(HORSE_BODY, 1);
  graphics.fillRect(x - 16, y - 8, 5, 14);
  graphics.fillRect(x + 10, y - 8, 5, 14);

  // Horse head + mane
  graphics.fillStyle(HORSE_BODY, 1);
  graphics.fillRoundedRect(x + facing * 18, y - 30, 14, 18, 4);
  graphics.fillStyle(HORSE_MANE, 1);
  graphics.fillRect(x + facing * 16, y - 32, 4, 16);

  // Rider body
  graphics.fillStyle(shirt, 1);
  graphics.fillRoundedRect(x - 10, y - 44, 20, 22, 4);

  // Rider head
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x, y - 50, 8);

  // Hat
  graphics.fillStyle(hatColor, 1);
  graphics.fillRoundedRect(x - 11, y - 58, 22, 5, 2);
  graphics.fillRoundedRect(x - 5, y - 63, 10, 7, 2);

  if (team === "outlaw") {
    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRect(x - 8, y - 51, 16, 5);
  }

  // Rifle
  graphics.fillStyle(0x3a3a3a, 1);
  graphics.fillRect(x + facing * 6, y - 38, facing * 20, 4);

  if (level >= 3) {
    graphics.fillStyle(0x5c4326, 1);
    graphics.fillRoundedRect(x - 11, y - 42, 22, 18, 4);
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillCircle(x, y - 36, 3);
  }

  if (level >= 5) {
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(x, y - 36, 3.5);
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillRect(x + facing * 6, y - 38, facing * 20, 4);
  }
}
