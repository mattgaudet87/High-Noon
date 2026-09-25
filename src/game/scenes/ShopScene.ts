import Phaser from "phaser";
import { UNITS, UnitKey } from "@/game/config/units";
import { MAX_LEVEL, UPGRADE_COSTS, getUnitStats } from "@/game/config/upgrades";
import {
  GLOBAL_UPGRADE_COSTS,
  GLOBAL_UPGRADE_MAX_LEVEL,
  GLOBAL_UPGRADES,
  GLOBAL_UPGRADE_KEYS,
  GlobalUpgradeKey,
  getGlobalUpgradeMultiplier,
} from "@/game/config/globalUpgrades";
import { drawBrawler } from "@/game/art/brawler";
import { drawGunslinger } from "@/game/art/gunslinger";
import { drawRider } from "@/game/art/rider";
import { drawShotgunner } from "@/game/art/shotgunner";
import { drawSharpshooter } from "@/game/art/sharpshooter";
import { drawDoc } from "@/game/art/doc";
import { drawPowderman } from "@/game/art/powderman";
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
  doc: drawDoc,
  powderman: drawPowderman,
};

// Cards flow into rows of up to 4, so the shop keeps working however many
// troop types the game has.
const CARDS_PER_ROW = 4;
const CARD_WIDTH = 260;
const CARD_HEIGHT = 220;
const CARD_ROW_START_Y = 195;
const CARD_ROW_GAP = 240;

function buildRowPositions(
  count: number,
  cardWidth: number,
  startY: number,
  rowGap: number,
  perRow: number
): { x: number; y: number }[] {
  const rows = Math.ceil(count / perRow);
  const positions: { x: number; y: number }[] = [];

  for (let row = 0; row < rows; row++) {
    const rowCount = Math.min(perRow, count - row * perRow);
    const rowWidth = rowCount * cardWidth + (rowCount - 1) * 40;
    const startX = GAME_WIDTH / 2 - rowWidth / 2 + cardWidth / 2;

    for (let col = 0; col < rowCount; col++) {
      positions.push({
        x: startX + col * (cardWidth + 40),
        y: startY + row * rowGap,
      });
    }
  }

  return positions;
}

function buildCardPositions(count: number): { x: number; y: number }[] {
  return buildRowPositions(count, CARD_WIDTH, CARD_ROW_START_Y, CARD_ROW_GAP, CARDS_PER_ROW);
}

// Global upgrades get their own, shorter row underneath the troop cards.
const GLOBAL_CARD_WIDTH = 380;
const GLOBAL_CARD_HEIGHT = 110;
const GLOBAL_CARD_Y = 645;

function buildGlobalCardPositions(count: number): { x: number; y: number }[] {
  return buildRowPositions(count, GLOBAL_CARD_WIDTH, GLOBAL_CARD_Y, 0, count);
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
  private globalCardRefs: Partial<
    Record<
      GlobalUpgradeKey,
      {
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

    this.add
      .text(GAME_WIDTH / 2, 555, "Trail Upgrades", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#f5d76e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const globalPositions = buildGlobalCardPositions(GLOBAL_UPGRADE_KEYS.length);
    GLOBAL_UPGRADE_KEYS.forEach((key, i) => {
      this.createGlobalCard(key, globalPositions[i].x, globalPositions[i].y);
    });

    this.createButton(
      110,
      30,
      "< Back",
      () => {
        this.scene.start("LevelSelectScene");
      },
      160,
      44
    );

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

    const statsText = this.add.text(x, y + 50, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#eadbc4",
      align: "center",
      lineSpacing: 4,
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

  private createGlobalCard(key: GlobalUpgradeKey, x: number, y: number) {
    const def = GLOBAL_UPGRADES[key];

    this.add
      .rectangle(x, y, GLOBAL_CARD_WIDTH, GLOBAL_CARD_HEIGHT, 0x3a2515, 1)
      .setStrokeStyle(3, 0xeadbc4);

    this.add
      .text(x - GLOBAL_CARD_WIDTH / 2 + 16, y - GLOBAL_CARD_HEIGHT / 2 + 14, def.name, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    this.add
      .text(x - GLOBAL_CARD_WIDTH / 2 + 16, y - GLOBAL_CARD_HEIGHT / 2 + 38, def.description, {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#c9b89a",
      })
      .setOrigin(0, 0);

    const levelText = this.add
      .text(x - GLOBAL_CARD_WIDTH / 2 + 16, y + 14, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#f5d76e",
        fontStyle: "bold",
      })
      .setOrigin(0, 0);

    const statsText = this.add
      .text(x - GLOBAL_CARD_WIDTH / 2 + 16, y + 34, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#eadbc4",
      })
      .setOrigin(0, 0);

    const buttonBg = this.add
      .rectangle(x + GLOBAL_CARD_WIDTH / 2 - 66, y + 24, 120, 34, 0xeadbc4, 1)
      .setInteractive({ useHandCursor: true });

    const buttonText = this.add
      .text(x + GLOBAL_CARD_WIDTH / 2 - 66, y + 24, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    buttonBg.on("pointerdown", () => this.upgradeGlobal(key));

    this.globalCardRefs[key] = { levelText, statsText, buttonBg, buttonText };
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

  private upgradeGlobal(key: GlobalUpgradeKey) {
    const level = this.save.settings.globalUpgrades[key];
    if (level >= GLOBAL_UPGRADE_MAX_LEVEL) return;

    const cost = GLOBAL_UPGRADE_COSTS[level + 1];
    if (this.save.bounty < cost) return;

    this.save.bounty -= cost;
    this.save.settings.globalUpgrades[key] = level + 1;
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

      if (level >= MAX_LEVEL) {
        refs.statsText.setText(`HP ${stats.hp}   DMG ${stats.damage}`);
        refs.buttonText.setText("Max level");
        refs.buttonBg.setFillStyle(0x5a4433, 1);
        refs.buttonBg.disableInteractive();
      } else {
        const nextStats = getUnitStats(key, level + 1);
        refs.statsText.setText(
          `HP ${stats.hp} -> ${nextStats.hp} (+${nextStats.hp - stats.hp})\n` +
            `DMG ${stats.damage} -> ${nextStats.damage} (+${nextStats.damage - stats.damage})`
        );

        const cost = UPGRADE_COSTS[level + 1];
        const canAfford = this.save.bounty >= cost;
        refs.buttonText.setText(`Upgrade: ${cost}`);
        refs.buttonBg.setFillStyle(0xeadbc4, 1);
        refs.buttonBg.setAlpha(canAfford ? 1 : 0.5);
        refs.buttonBg.setInteractive({ useHandCursor: true });
      }
    });

    GLOBAL_UPGRADE_KEYS.forEach((key) => {
      const refs = this.globalCardRefs[key];
      if (!refs) return;

      const level = this.save.settings.globalUpgrades[key];
      const currentPct = Math.round(
        (getGlobalUpgradeMultiplier(this.save.settings.globalUpgrades, key) - 1) * 100
      );

      refs.levelText.setText(`Level ${level}/${GLOBAL_UPGRADE_MAX_LEVEL}   (+${currentPct}% now)`);

      if (level >= GLOBAL_UPGRADE_MAX_LEVEL) {
        refs.statsText.setText("Maxed out");
        refs.buttonText.setText("Max level");
        refs.buttonBg.setFillStyle(0x5a4433, 1);
        refs.buttonBg.disableInteractive();
      } else {
        const nextPct = Math.round(GLOBAL_UPGRADES[key].bonusPerLevel * (level + 1) * 100);
        refs.statsText.setText(`Next level: +${nextPct}% total`);

        const cost = GLOBAL_UPGRADE_COSTS[level + 1];
        const canAfford = this.save.bounty >= cost;
        refs.buttonText.setText(`Upgrade: ${cost}`);
        refs.buttonBg.setFillStyle(0xeadbc4, 1);
        refs.buttonBg.setAlpha(canAfford ? 1 : 0.5);
        refs.buttonBg.setInteractive({ useHandCursor: true });
      }
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 220,
    height = 60
  ) {
    const background = this.add
      .rectangle(x, y, width, height, 0xeadbc4, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, label, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", onClick);
  }
}
