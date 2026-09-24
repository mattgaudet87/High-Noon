import Phaser from "phaser";

export function drawJailhouse(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number
) {
  const width = 140;
  const height = 160;
  const baseY = y;

  // Main building
  graphics.fillStyle(0x8a6440, 1);
  graphics.fillRect(x - width / 2, baseY - height, width, height);

  // Roof
  graphics.fillStyle(0x4a3320, 1);
  graphics.fillTriangle(
    x - width / 2 - 10,
    baseY - height,
    x + width / 2 + 10,
    baseY - height,
    x,
    baseY - height - 50
  );

  // Door
  graphics.fillStyle(0x2b1b10, 1);
  graphics.fillRect(x - 18, baseY - 60, 36, 60);

  // Barred window
  graphics.fillStyle(0x1c1108, 1);
  graphics.fillRect(x - 45, baseY - 110, 30, 26);
  graphics.fillStyle(0x6b6b6b, 1);
  for (let i = 0; i < 3; i++) {
    graphics.fillRect(x - 45 + 8 + i * 8, baseY - 110, 2, 26);
  }

  // Sign
  graphics.fillStyle(0xeadbc4, 1);
  graphics.fillRoundedRect(x - 40, baseY - height - 14, 80, 20, 3);
  graphics.fillStyle(0x2b1b0e, 1);
  graphics.fillRect(x - 30, baseY - height - 7, 60, 4);
}
