import Phaser from "phaser";
import { STAGES } from "@/game/config/stages";
import { loadLocal } from "@/lib/save/local";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const MARKER_POSITIONS = [
  { x: 110, y: 560 },
  { x: 290, y: 360 },
  { x: 470, y: 560 },
  { x: 650, y: 360 },
  { x: 830, y: 560 },
  { x: 1000, y: 360 },
  { x: 1170, y: 560 },
];

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super("StageSelectScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0xf2a65a);

    const save = loadLocal();

    this.add
      .text(GAME_WIDTH / 2, 40, "The Trail", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH - 20, 20, `Bounty: ${save.bounty}`, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);

    this.drawTrail();

    STAGES.forEach((stage, i) => {
      const pos = MARKER_POSITIONS[i];
      const unlocked = stage.id <= save.highestStage;
      this.createStageMarker(pos.x, pos.y, stage.id, stage.name, unlocked);
    });

    this.createStoreButton();
  }

  private createStoreButton() {
    const x = 130;
    const y = 660;

    const background = this.add
      .rectangle(x, y, 200, 56, 0x2b1b0e, 0.85)
      .setStrokeStyle(2, 0xeadbc4)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, "General Store", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", () => {
      this.scene.start("ShopScene");
    });
  }

  private drawTrail() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xb9773a, 1);

    for (let i = 0; i < MARKER_POSITIONS.length - 1; i++) {
      const a = MARKER_POSITIONS[i];
      const b = MARKER_POSITIONS[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const steps = Math.floor(length / 24);

      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        graphics.fillCircle(a.x + dx * t, a.y + dy * t, 4);
      }
    }
  }

  private createStageMarker(
    x: number,
    y: number,
    stageId: number,
    name: string,
    unlocked: boolean
  ) {
    const circleColor = unlocked ? 0x2f5da8 : 0x8a8a8a;

    const circle = this.add.circle(x, y, 34, circleColor).setStrokeStyle(3, 0xeadbc4);

    this.add
      .text(x, y, String(stageId), {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    if (unlocked) {
      this.add
        .text(x, y + 50, name, {
          fontFamily: "monospace",
          fontSize: "16px",
          color: "#2b1b0e",
          align: "center",
        })
        .setOrigin(0.5);

      circle.setInteractive({ useHandCursor: true });
      circle.on("pointerdown", () => {
        this.scene.start("BattleScene", { stageId });
      });
    } else {
      this.drawPadlock(x, y + 50);
    }
  }

  private drawPadlock(x: number, y: number) {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x5a4433, 1);
    graphics.fillRoundedRect(x - 10, y - 4, 20, 16, 3);

    graphics.lineStyle(4, 0x5a4433, 1);
    graphics.beginPath();
    graphics.arc(x, y - 6, 7, Math.PI, 0, false);
    graphics.strokePath();
  }
}
