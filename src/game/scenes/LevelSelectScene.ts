import Phaser from "phaser";
import { LEVELS } from "@/game/config/levels";
import { loadLocal } from "@/lib/save/local";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const CARD_WIDTH = 340;
const CARD_HEIGHT = 320;
const CARD_Y = 340;
const CARD_GAP = 60;

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0xf2a65a);

    const save = loadLocal();

    this.add
      .text(GAME_WIDTH / 2, 40, "High Noon", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, 86, "Choose your trail", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#5a4433",
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

    const totalWidth = LEVELS.length * CARD_WIDTH + (LEVELS.length - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + CARD_WIDTH / 2;

    LEVELS.forEach((level, i) => {
      const x = startX + i * (CARD_WIDTH + CARD_GAP);
      const unlocked = save.highestStage >= level.stageIds[0];
      const cleared = save.highestStage > level.stageIds[level.stageIds.length - 1];
      this.createLevelCard(x, CARD_Y, level, unlocked, cleared);
    });

    this.createStoreButton();
  }

  private createLevelCard(
    x: number,
    y: number,
    level: (typeof LEVELS)[number],
    unlocked: boolean,
    cleared: boolean
  ) {
    const background = this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, 0x2b1b0e, unlocked ? 0.85 : 0.6)
      .setStrokeStyle(3, unlocked ? 0xeadbc4 : 0x8a8a8a);

    this.add
      .text(x, y - CARD_HEIGHT / 2 + 24, `Level ${level.id}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#f5d76e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(x, y - CARD_HEIGHT / 2 + 56, unlocked ? level.name : "???", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#eadbc4",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: CARD_WIDTH - 40 },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        x,
        y + 10,
        `Stages ${level.stageIds[0]}-${level.stageIds[level.stageIds.length - 1]}`,
        {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#c9b89a",
        }
      )
      .setOrigin(0.5);

    if (unlocked) {
      this.add
        .text(x, y + 36, cleared ? "Cleared" : "In progress", {
          fontFamily: "monospace",
          fontSize: "14px",
          color: cleared ? "#4caf50" : "#f5d76e",
        })
        .setOrigin(0.5);

      background.setInteractive({ useHandCursor: true });
      background.on("pointerdown", () => {
        this.scene.start("StageSelectScene", { levelId: level.id });
      });
    } else {
      this.drawPadlock(x, y + 30);
    }
  }

  private drawPadlock(x: number, y: number) {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x5a4433, 1);
    graphics.fillRoundedRect(x - 12, y - 4, 24, 20, 3);

    graphics.lineStyle(5, 0x5a4433, 1);
    graphics.beginPath();
    graphics.arc(x, y - 7, 9, Math.PI, 0, false);
    graphics.strokePath();
  }

  private createStoreButton() {
    const x = 130;
    const y = GAME_HEIGHT - 60;

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
}
