import Phaser from "phaser";
import { UNITS, UnitKey } from "@/game/config/units";
import { MAX_LEVEL, UPGRADE_COSTS, getUnitStats } from "@/game/config/upgrades";
import { drawBrawler } from "@/game/art/brawler";
import { drawGunslinger } from "@/game/art/gunslinger";
import { drawRider } from "@/game/art/rider";
import { drawShotgunner } from "@/game/art/shotgunner";
import { drawSharpshooter } from "@/game/art/sharpshooter";
import { loadLocal, saveLocal } from "@/lib/save/local";
import { pushCloudSave } from "@/lib/save/cloud";
import { SaveData } from "@/lib/save/types";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];

const DRAW_FUNCS: Record<
  UnitKey,
  (
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    facing: 1 | -1,
    level: number,
    team: "lawman" | "outlaw"
  ) => void
> = {
  brawler: drawBrawler,
  gunslinger: drawGunslinger,
  rider: drawRider,
  shotgunner: drawShotgunner,
  sharpshooter: drawSharpshooter,
};

// Cards flow into rows of up to 3, so the shop keeps working however many
// troop types the game has.
const CARDS_PER_ROW = 3;
const CARD_WIDTH = 340;
const CARD_HEIGHT = 240;
const CARD_ROW_START_Y = 200;
const CARD_ROW_GAP = 280;

function buildCardPositions(count: number): { x: number; y: number }[] {
  const rows = Math.ceil(count / CARDS_PER_ROW);
  const positions: { x: number; y: number }[] = [];

  for (let row = 0; row < rows; row++) {
    const rowCount = Math.min(CARDS_PER_ROW, count - row * CARDS_PER_ROW);
    const rowWidth = rowCount * CARD_WIDTH + (rowCount - 1) * 40;
    const startX = GAME_WIDTH / 2 - rowWidth / 2 + CARD_WIDTH / 2;

    for (let col = 0; col < rowCount; col++) {
      positions.push({
        x: startX + col * (CARD_WIDTH + 40),
        y: CARD_ROW_START_Y + row * CARD_ROW_GAP,
      });
    }
  }

  return positions;
}

export class ShopScene extends Phaser.Scene {
  private save!: SaveData;
  private bountyText!: Phaser.GameObjects.Text;
  private cardRefs: Partial<
    Record<
      UnitKey,
      {
        art: Phaser.GameObjects.Graphics;
        levelText: Phaser.GameObjects.Text;
        statsText: Phaser.GameObjects.Text;
        buttonBg: Phaser.GameObjects.Rectangle;
        buttonText: Phaser.GameObjects.Text;
      }
    >
  > = {};

  constructor() {
    super("ShopScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2b1b0e);
    this.save = loadLocal();

    this.add
      .text(GAME_WIDTH / 2, 40, "General Store", {
        fontFamily: "monospace",
        fontSize: "36px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.bountyText = this.add
      .text(GAME_WIDTH - 20, 20, "", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f5d76e",
        fontStyle: "bold",
      })
      .setOrigin(1, 0);

    const cardPositions = buildCardPositions(UNIT_KEYS.length);
    UNIT_KEYS.forEach((key, i) => {
      this.createUnitCard(key, cardPositions[i].x, cardPositions[i].y);
    });

    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT - 50, "Back to map", () => {
      this.scene.start("StageSelectScene");
    });

    this.refresh();
  }

  private createUnitCard(key: UnitKey, x: number, y: number) {
    const stats = UNITS[key];

    this.add
      .rectangle(x, y, CARD_WIDTH, CARD_HEIGHT, 0x3a2515, 1)
      .setStrokeStyle(3, 0xeadbc4);

    this.add
      .text(x, y - CARD_HEIGHT / 2 + 20, stats.name, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const art = this.add.graphics();
    art.setPosition(x, y - 20);

    const levelText = this.add.text(x, y + 28, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#f5d76e",
      fontStyle: "bold",
    }).setOrigin(0.5);

    const statsText = this.add.text(x, y + 52, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#eadbc4",
      align: "center",
    }).setOrigin(0.5);

    const buttonBg = this.add
      .rectangle(x, y + CARD_HEIGHT / 2 - 28, 190, 36, 0xeadbc4, 1)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(x, y + CARD_HEIGHT / 2 - 28, "", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    buttonBg.on("pointerdown", () => this.upgrade(key));

    this.cardRefs[key] = { art, levelText, statsText, buttonBg, buttonText };
  }

  private upgrade(key: UnitKey) {
    const level = this.save.unitLevels[key];
    if (level >= MAX_LEVEL) return;

    const cost = UPGRADE_COSTS[level + 1];
    if (this.save.bounty < cost) return;

    this.save.bounty -= cost;
    this.save.unitLevels[key] = level + 1;
    this.save = saveLocal(this.save);
    pushCloudSave(this.save);

    this.refresh();
  }

  private refresh() {
    this.bountyText.setText(`Bounty: ${this.save.bounty}`);

    UNIT_KEYS.forEach((key) => {
      const refs = this.cardRefs[key];
      if (!refs) return;

      const level = this.save.unitLevels[key];
      const stats = getUnitStats(key, level);

      refs.art.clear();
      DRAW_FUNCS[key](refs.art, 0, 0, 1, level, "lawman");

      refs.levelText.setText(`Level ${level}`);
      refs.statsText.setText(
        `HP ${stats.hp}   DMG ${stats.damage}`
      );

      if (level >= MAX_LEVEL) {
        refs.buttonText.setText("Max level");
        refs.buttonBg.setFillStyle(0x5a4433, 1);
        refs.buttonBg.disableInteractive();
      } else {
        const cost = UPGRADE_COSTS[level + 1];
        const canAfford = this.save.bounty >= cost;
        refs.buttonText.setText(`Upgrade: ${cost}`);
        refs.buttonBg.setFillStyle(0xeadbc4, 1);
        refs.buttonBg.setAlpha(canAfford ? 1 : 0.5);
        refs.buttonBg.setInteractive({ useHandCursor: true });
      }
    });
  }

  private createButton(x: number, y: number, label: string, onClick: () => void) {
    const background = this.add
      .rectangle(x, y, 220, 60, 0xeadbc4, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", onClick);
  }
}
