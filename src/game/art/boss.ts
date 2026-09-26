import Phaser from "phaser";

// The Hideout's boss guard. Always drawn as an outlaw, bigger and busier
// than the regular troops so it reads as a threat the moment it walks out.
const SHIRT = 0x7a1f1f;
const HAT = 0x1c1c1c;
const DUSTER = 0x3b2a1a;
const SKIN = 0xd9a066;
const BUCKLE = 0xd4af37;

export function drawBoss(graphics: Phaser.GameObjects.Graphics, x: number, y: number, facing: 1 | -1) {
  // Long duster coat
  graphics.fillStyle(DUSTER, 1);
  graphics.fillRoundedRect(x - 16, y - 46, 32, 46, 4);

  // Legs
  graphics.fillStyle(0x2b1f14, 1);
  graphics.fillRect(x - 10, y - 20, 8, 20);
  graphics.fillRect(x + 2, y - 20, 8, 20);

  // Shirt collar showing above the coat
  graphics.fillStyle(SHIRT, 1);
  graphics.fillRoundedRect(x - 10, y - 48, 20, 16, 3);

  // Head
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x, y - 56, 11);

  // Bandana mask
  graphics.fillStyle(0x2b2b2b, 1);
  graphics.fillRect(x - 11, y - 57, 22, 6);

  // Wide-brim hat
  graphics.fillStyle(HAT, 1);
  graphics.fillRoundedRect(x - 18, y - 66, 36, 6, 2);
  graphics.fillRoundedRect(x - 9, y - 74, 18, 10, 2);

  // Gun belt buckle
  graphics.fillStyle(BUCKLE, 1);
  graphics.fillRect(x - 6, y - 30, 12, 4);

  // Twin pistols, held out toward the facing direction
  graphics.fillStyle(0x1c1c1c, 1);
  graphics.fillRect(x + facing * 10, y - 38, 14, 4);
  graphics.fillRect(x + facing * 10, y - 26, 14, 4);
  graphics.fillStyle(SKIN, 1);
  graphics.fillCircle(x + facing * 8, y - 36, 5);
  graphics.fillCircle(x + facing * 8, y - 24, 5);
}
