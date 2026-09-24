import Phaser from "phaser";

export function drawHideout(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number
) {
  const width = 150;
  const height = 170;
  const baseY = y;

  // Main building, rougher and darker than the Jailhouse
  graphics.fillStyle(0x5a4433, 1);
  graphics.fillRect(x - width / 2, baseY - height, width, height);

  // Jagged broken roofline
  graphics.fillStyle(0x2b1f16, 1);
  graphics.fillTriangle(
    x - width / 2 - 12,
    baseY - height,
    x + width / 2 + 12,
    baseY - height,
    x,
    baseY - height - 40
  );
  graphics.fillTriangle(
    x - width / 2 - 12,
    baseY - height,
    x - 20,
    baseY - height,
    x - width / 2 + 10,
    baseY - height - 20
  );

  // Boarded-up door
  graphics.fillStyle(0x1c1108, 1);
  graphics.fillRect(x - 20, baseY - 65, 40, 65);
  graphics.fillStyle(0x3f2c1e, 1);
  graphics.fillRect(x - 20, baseY - 45, 40, 6);
  graphics.fillRect(x - 20, baseY - 25, 40, 6);

  // Cracked window
  graphics.fillStyle(0x0f0a06, 1);
  graphics.fillRect(x + 30, baseY - 120, 28, 24);

  // Warning skull sign
  graphics.fillStyle(0x2b1f16, 1);
  graphics.fillRoundedRect(x - 34, baseY - height - 16, 68, 22, 3);
  graphics.fillStyle(0xd9d0c0, 1);
  graphics.fillCircle(x, baseY - height - 5, 6);
}
