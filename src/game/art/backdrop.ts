import Phaser from "phaser";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export function drawBackdrop(graphics: Phaser.GameObjects.Graphics) {
  // Sky
  graphics.fillStyle(0xf2a65a, 1);
  graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Sun
  graphics.fillStyle(0xfff2c1, 1);
  graphics.fillCircle(1080, 130, 70);

  // Mesas
  graphics.fillStyle(0xb35a2e, 1);
  graphics.fillTriangle(80, 420, 280, 200, 440, 420);
  graphics.fillTriangle(760, 420, 940, 260, 1120, 420);

  graphics.fillStyle(0x9a4a26, 1);
  graphics.fillTriangle(200, 420, 320, 280, 400, 420);
  graphics.fillTriangle(860, 420, 960, 320, 1040, 420);

  // Dirt street
  graphics.fillStyle(0xc98b4b, 1);
  graphics.fillRect(0, 420, GAME_WIDTH, GAME_HEIGHT - 420);

  graphics.fillStyle(0xb9773a, 1);
  for (let x = 20; x < GAME_WIDTH; x += 90) {
    graphics.fillEllipse(x, 620, 50, 14);
  }

  // Cacti
  drawCactus(graphics, 140, 400);
  drawCactus(graphics, 1150, 390);
}

function drawCactus(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
  graphics.fillStyle(0x3f7d4a, 1);
  graphics.fillRoundedRect(x - 10, y - 70, 20, 70, 8);
  graphics.fillRoundedRect(x - 30, y - 40, 20, 14, 6);
  graphics.fillRoundedRect(x - 30, y - 54, 14, 40, 6);
  graphics.fillRoundedRect(x + 10, y - 30, 20, 14, 6);
  graphics.fillRoundedRect(x + 16, y - 44, 14, 40, 6);
}
