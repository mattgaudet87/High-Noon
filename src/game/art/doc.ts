import Phaser from "phaser";
import { Team } from "./brawler";

const LAWMAN_SHIRT = 0x2f5da8;
const LAWMAN_HAT = 0xf5f2e8;
const OUTLAW_SHIRT = 0x7a1f1f;
const OUTLAW_HAT = 0x1c1c1c;
const SKIN = 0xd9a066;
const APRON = 0xeadbc4;
const CROSS = 0xc0392b;

// Doc heals nearby lawmen instead of fighting. Drawn with a medic's apron
// and bag instead of a weapon so the battlefield reads at a glance.
export function drawDoc(
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
  graphics.fillRect(x - 8, y - 18, 6, 18);
  graphics.fillRect(x + 2, y - 18, 6, 18);

  // Body
  graphics.fillStyle(shirt, 1);
  graphics.fillRoundedRect(x - 12, y - 42, 24, 26, 4);

  // Apron
  graphics.fillStyle(APRON, 1);
  graphics.fillRoundedRect(x - 9, y - 38, 18, 20, 3);
  graphics.fillStyle(CROSS, 1);
  graphics.fillRect(x - 2, y - 32, 4, 10);
  graphics.fillRect(x - 5, y - 29, 10, 4);

  // Head
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x, y - 50, 9);

  // Hat
  graphics.fillStyle(hatColor, 1);
  graphics.fillRoundedRect(x - 12, y - 58, 24, 5, 2);
  graphics.fillRoundedRect(x - 6, y - 64, 12, 8, 2);

  if (team === "outlaw") {
    graphics.fillStyle(0x2b2b2b, 1);
    graphics.fillRect(x - 9, y - 51, 18, 5);
  }

  // Medic bag, carried at the side
  graphics.fillStyle(0x5c4326, 1);
  graphics.fillRoundedRect(x + facing * 10, y - 28, 10, 9, 2);
  graphics.fillStyle(CROSS, 1);
  graphics.fillRect(x + facing * 14, y - 26, 2, 5);
  graphics.fillRect(x + facing * 12, y - 24, 6, 1.5);

  // Arm reaching toward whoever's being tended to
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x + facing * 15, y - 33, 5);

  if (level >= 3) {
    graphics.fillStyle(0x5c4326, 1);
    graphics.fillRoundedRect(x - 13, y - 40, 26, 22, 4);
    graphics.fillStyle(0xd4af37, 1);
    graphics.fillCircle(x, y - 34, 3);
  }

  if (level >= 5) {
    graphics.fillStyle(0xffd700, 1);
    graphics.fillCircle(x, y - 34, 3.5);
    graphics.fillStyle(0xc0c0c0, 1);
    graphics.fillRoundedRect(x + facing * 10, y - 28, 10, 9, 2);
  }
}
