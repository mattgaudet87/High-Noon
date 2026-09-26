import Phaser from "phaser";
import { LEVELS, Level } from "@/game/config/levels";
import { STAGES } from "@/game/config/stages";
import { UNITS, COUNTERS, UnitKey } from "@/game/config/units";
import { loadLocal } from "@/lib/save/local";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const COLOR = {
  ink: 0x2b1b0e,
  inkDeep: 0x1f1309,
  panel: 0x3a2515,
  woodLine: 0x7a5a3e,
  brownMid: 0x5a4433,
  paper: 0xeadbc4,
  paperMuted: 0xc9b89a,
  gold: 0xf5d76e,
  rust: 0x7a2e1f,
  stampRed: 0xb3342a,
};

// Poster hit areas, traced from the painted backdrop. All top=397, height=228.
const POSTERS = [
  { x: 165, w: 178 },
  { x: 355, w: 176 },
  { x: 551, w: 177 },
  { x: 745, w: 180 },
  { x: 937, w: 187 },
];
const POSTER_TOP = 397;
const POSTER_HEIGHT = 228;

function ls(em: number, fontSize: number): number {
  return em * fontSize;
}

// Follows COUNTERS around the cycle starting at Brawler, so the how-to-play
// chain always reflects the real balance config, never a hardcoded list.
function buildCounterChain(): string[] {
  const start: UnitKey = "brawler";
  const chain: string[] = [];
  let current: UnitKey = start;
  do {
    chain.push(UNITS[current].name);
    const next: UnitKey | undefined = COUNTERS[current];
    if (!next) break;
    current = next;
  } while (current !== start);
  return chain;
}

function rewardForLevel(level: Level): number {
  return level.stageIds.reduce((sum, stageId) => {
    const stage = STAGES.find((s) => s.id === stageId);
    return sum + (stage?.firstClearBounty ?? 0);
  }, 0);
}

export class LevelSelectScene extends Phaser.Scene {
  private howToContainer!: Phaser.GameObjects.Container;
  private howToOpen = false;

  constructor() {
    super("LevelSelectScene");
  }

  create() {
    this.howToOpen = false;

    this.cameras.main.setBackgroundColor(COLOR.ink);
    this.add.image(0, 0, "bg-chapters").setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    const save = loadLocal();
    const highestStage = save.highestStage;
    const currentIndex = Math.max(
      0,
      LEVELS.findIndex(
        (level) =>
          highestStage >= level.stageIds[0] &&
          highestStage <= level.stageIds[level.stageIds.length - 1]
      )
    );

    this.createBountyBox(save.bounty, highestStage);

    LEVELS.forEach((level, i) => {
      this.createPoster(level, i, highestStage, i === currentIndex);
    });

    this.createBottomButtons();
    this.createHowToModal();
  }

  private createBountyBox(bounty: number, highestStage: number) {
    const rightEdge = 1168;
    const top = 22;
    const padX = 14;
    const padY = 10;

    const bountyLabel = this.add
      .text(0, 0, "BOUNTY", {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.2, 11));
    const bountyValue = this.add.text(0, 0, `${bounty}`, {
      fontFamily: "Ultra",
      fontSize: "22px",
      color: "#eadbc4",
    });

    const clearedCount = highestStage - 1;
    const trailLabel = this.add
      .text(0, 0, `TRAIL ${clearedCount}/${STAGES.length}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        color: "#c9b89a",
      })
      .setLetterSpacing(ls(0.14, 11));

    const row1Width = bountyLabel.width + 10 + bountyValue.width;
    const row2Width = trailLabel.width + 8 + 90;
    const contentWidth = Math.max(row1Width, row2Width);
    const boxWidth = contentWidth + padX * 2;
    const boxHeight = padY * 2 + bountyValue.height + 8 + 6;
    const left = rightEdge - boxWidth;

    this.add
      .rectangle(left, top, boxWidth, boxHeight, COLOR.inkDeep, 0.88)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.woodLine);
    bountyLabel.setDepth(1);
    bountyValue.setDepth(1);
    trailLabel.setDepth(1);

    bountyLabel.setPosition(rightEdge - contentWidth, top + padY);
    bountyValue.setPosition(bountyLabel.x + bountyLabel.width + 10, top + padY - 3);

    const barY = top + padY + bountyValue.height + 8;
    trailLabel.setPosition(rightEdge - contentWidth, barY);

    const barW = 90;
    const barX = trailLabel.x + trailLabel.width + 8;
    this.add.rectangle(barX, barY + 1, barW, 6, COLOR.inkDeep).setOrigin(0, 0).setStrokeStyle(1, COLOR.paperMuted);
    const fillW = Math.max(0, Math.min(1, clearedCount / STAGES.length)) * barW;
    this.add.rectangle(barX, barY + 1, fillW, 6, COLOR.gold).setOrigin(0, 0);
  }

  private createPoster(level: Level, index: number, highestStage: number, current: boolean) {
    const rect = POSTERS[index];
    const firstStage = level.stageIds[0];
    const lastStage = level.stageIds[level.stageIds.length - 1];
    const unlocked = highestStage >= firstStage;
    const locked = !unlocked;
    const cleared = highestStage > lastStage;
    const done = Math.max(0, Math.min(5, highestStage - firstStage));

    const centerX = rect.x + rect.w / 2;

    if (locked) {
      this.add
        .rectangle(rect.x, POSTER_TOP, rect.w, POSTER_HEIGHT, 0x180e06, 0.74)
        .setOrigin(0, 0);

      this.drawPadlock(centerX, POSTER_TOP + 60);

      this.add
        .text(centerX, POSTER_TOP + 90, `CHAPTER ${level.id}`, {
          fontFamily: "IBM Plex Mono",
          fontSize: "11px",
          fontStyle: "700",
          color: "#eadbc4",
        })
        .setOrigin(0.5)
        .setLetterSpacing(ls(0.2, 11));

      this.add
        .text(centerX, POSTER_TOP + 108, `Clear chapter ${level.id - 1} to ride here`, {
          fontFamily: "IBM Plex Mono",
          fontSize: "11px",
          color: "#c9b89a",
          align: "center",
          wordWrap: { width: rect.w - 20 },
        })
        .setOrigin(0.5, 0);
      return;
    }

    if (current) {
      const glow = this.add
        .rectangle(rect.x - 6, POSTER_TOP - 6, rect.w + 12, POSTER_HEIGHT + 12, COLOR.gold, 0.18)
        .setOrigin(0, 0);
      const glow2 = this.add
        .rectangle(rect.x - 3, POSTER_TOP - 3, rect.w + 6, POSTER_HEIGHT + 6, COLOR.gold, 0.28)
        .setOrigin(0, 0);
      this.add
        .rectangle(rect.x, POSTER_TOP, rect.w, POSTER_HEIGHT, 0, 0)
        .setOrigin(0, 0)
        .setStrokeStyle(3, COLOR.gold);

      const tagText = this.add
        .text(0, 0, "NOW RIDING", {
          fontFamily: "IBM Plex Mono",
          fontSize: "11px",
          fontStyle: "700",
          color: "#2b1b0e",
        })
        .setLetterSpacing(ls(0.18, 11));
      const tagW = tagText.width + 20;
      const tagH = tagText.height + 8;
      const tagShadow = this.add
        .rectangle(centerX, POSTER_TOP - 30 + 3, tagW, tagH, COLOR.ink)
        .setOrigin(0.5, 0);
      const tagBg = this.add
        .rectangle(centerX, POSTER_TOP - 30, tagW, tagH, COLOR.gold)
        .setOrigin(0.5, 0);
      tagText.setPosition(centerX, POSTER_TOP - 30 + 4).setOrigin(0.5, 0).setDepth(1);
      void glow;
      void glow2;
      void tagShadow;
      void tagBg;
    }

    if (cleared) {
      const stamp = this.add
        .text(centerX, POSTER_TOP + 62, "CAUGHT", {
          fontFamily: "Ultra",
          fontSize: "26px",
          color: "#b3342a",
          backgroundColor: "rgba(234,219,196,0.7)",
          padding: { left: 10, right: 10, top: 0, bottom: 0 },
        })
        .setOrigin(0.5, 0)
        .setStroke("#b3342a", 4)
        .setAngle(-14);
      void stamp;
    }

    // Name plate, inset 8px from the poster's left/right/bottom edges.
    const plateX = rect.x + 8;
    const plateW = rect.w - 16;
    const plateBottom = POSTER_TOP + POSTER_HEIGHT - 10;
    const reward = rewardForLevel(level);

    const chLabel = this.add
      .text(0, 0, `CH. ${level.id}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#5a4433",
      })
      .setLetterSpacing(ls(0.18, 10));
    const rewardLabel = this.add
      .text(0, 0, `${reward} REWARD`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#7a2e1f",
      })
      .setLetterSpacing(ls(0.1, 10));
    const nameText = this.add
      .text(0, 0, level.name, {
        fontFamily: "Ultra",
        fontSize: "13px",
        color: "#2b1b0e",
        align: "center",
        wordWrap: { width: plateW - 16 },
      })
      .setOrigin(0.5, 0);

    const plateTop = plateBottom - 7 - 5 - nameText.height - 4 - chLabel.height - 6;
    const plateH = plateBottom - plateTop;

    const plateBg = this.add
      .rectangle(plateX, plateTop, plateW, plateH, COLOR.paper)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLOR.ink);

    chLabel.setPosition(plateX + 8, plateTop + 6);
    rewardLabel.setPosition(plateX + plateW - 8 - rewardLabel.width, plateTop + 6);
    nameText.setPosition(plateX + plateW / 2, plateTop + 6 + chLabel.height + 4);

    const pipsY = plateBottom - 5 - 5;
    const pipsTotalW = 5 * 14 + 4 * 3;
    let pipX = plateX + plateW / 2 - pipsTotalW / 2;
    for (let k = 0; k < 5; k++) {
      const filled = k < done;
      this.add
        .rectangle(pipX, pipsY, 14, 5, filled ? COLOR.rust : COLOR.paperMuted)
        .setOrigin(0, 0);
      pipX += 14 + 3;
    }

    plateBg.setDepth(1);
    chLabel.setDepth(2);
    rewardLabel.setDepth(2);
    nameText.setDepth(2);

    const hitZone = this.add
      .rectangle(rect.x, POSTER_TOP, rect.w, POSTER_HEIGHT, 0x000000, 0)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });

    const hoverOutline = this.add
      .rectangle(rect.x, POSTER_TOP, rect.w, POSTER_HEIGHT, 0, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(3, COLOR.paper)
      .setVisible(false);

    hitZone.on("pointerover", () => hoverOutline.setVisible(true));
    hitZone.on("pointerout", () => hoverOutline.setVisible(false));
    hitZone.on("pointerdown", () => {
      this.scene.start("StageSelectScene", { levelId: level.id });
    });
  }

  private drawPadlock(x: number, y: number) {
    const graphics = this.add.graphics();
    graphics.lineStyle(5, COLOR.paper, 1);
    graphics.beginPath();
    graphics.arc(x, y - 6, 9, Math.PI, 0, false);
    graphics.strokePath();

    graphics.fillStyle(COLOR.paper, 1);
    graphics.fillRoundedRect(x - 14, y - 4, 28, 24, 3);
  }

  private createBottomButtons() {
    const y = 646;
    const h = 44;
    const gap = 12;

    const items: { label: string; gold?: boolean; onClick: () => void }[] = [
      { label: "‹ SAVES", onClick: () => this.scene.start("HomeScene") },
      { label: "GENERAL STORE", onClick: () => this.scene.start("ShopScene") },
      { label: "HOW TO PLAY", gold: true, onClick: () => this.setHowToOpen(true) },
    ];

    const labels = items.map((item) =>
      this.add
        .text(0, 0, item.label, {
          fontFamily: "IBM Plex Mono",
          fontSize: "13px",
          fontStyle: "700",
          color: item.gold ? "#f5d76e" : "#eadbc4",
        })
        .setLetterSpacing(ls(0.12, 13))
    );

    const widths = labels.map((label) => label.width + 36);
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + gap * (items.length - 1);
    let x = GAME_WIDTH / 2 - totalWidth / 2;

    items.forEach((item, i) => {
      const w = widths[i];
      const bg = this.add
        .rectangle(x, y, w, h, COLOR.inkDeep, 0.9)
        .setOrigin(0, 0)
        .setStrokeStyle(2, item.gold ? COLOR.gold : COLOR.paper)
        .setInteractive({ useHandCursor: true });

      labels[i].setPosition(x + w / 2, y + h / 2).setOrigin(0.5).setDepth(1);

      bg.on("pointerover", () => bg.setFillStyle(COLOR.panel, 0.9));
      bg.on("pointerout", () => bg.setFillStyle(COLOR.inkDeep, 0.9));
      bg.on("pointerdown", item.onClick);

      x += w + gap;
    });
  }

  private createHowToModal() {
    this.howToContainer = this.add.container(0, 0).setVisible(false).setDepth(10);

    const backdrop = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0f0904, 0.6)
      .setOrigin(0, 0)
      .setInteractive();
    backdrop.on("pointerdown", () => this.setHowToOpen(false));

    const panelW = 600;
    const padX = 24;
    const padY = 22;

    const title = this.add.text(0, 0, "How the fight works", {
      fontFamily: "Ultra",
      fontSize: "24px",
      color: "#eadbc4",
    });
    const closeLabel = this.add
      .text(0, 0, "CLOSE ✕", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.14, 12));

    const subtitle = this.add.text(0, 0, "Each troop beats the next for 2x damage", {
      fontFamily: "IBM Plex Mono",
      fontSize: "12px",
      color: "#c9b89a",
    });

    const chain = buildCounterChain();
    const chipTexts = chain.map((name) =>
      this.add.text(0, 0, name, {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#2b1b0e",
        backgroundColor: "#eadbc4",
        padding: { left: 8, right: 8, top: 6, bottom: 6 },
      })
    );

    const body = this.add.text(
      0,
      0,
      "Sharpshooter loops back to beat Brawler. Doc heals and Powder Man blasts, and neither is part of the cycle. Spend Grub to deploy lawmen, swipe across the street to throw Dynamite, and take down the Hideout.",
      {
        fontFamily: "IBM Plex Mono",
        fontSize: "13px",
        color: "#eadbc4",
        wordWrap: { width: panelW - padX * 2 },
        lineSpacing: 7,
      }
    );

    const chainRowHeight = Math.max(...chipTexts.map((c) => c.height));
    const panelH =
      padY * 2 +
      title.height +
      14 +
      subtitle.height +
      14 +
      chainRowHeight +
      14 +
      body.height;

    const panelX = GAME_WIDTH / 2 - panelW / 2;
    const panelY = GAME_HEIGHT / 2 - panelH / 2;

    const shadow = this.add
      .rectangle(panelX, panelY + 10, panelW, panelH, 0x000000, 0.45)
      .setOrigin(0, 0);
    const panelBg = this.add
      .rectangle(panelX, panelY, panelW, panelH, COLOR.panel)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.woodLine);

    let cy = panelY + padY;
    title.setPosition(panelX + padX, cy);
    closeLabel.setPosition(panelX + panelW - padX - closeLabel.width, cy + title.height - closeLabel.height);
    cy += title.height + 14;

    subtitle.setPosition(panelX + padX, cy);
    cy += subtitle.height + 14;

    let chipX = panelX + padX;
    const arrows: Phaser.GameObjects.Text[] = [];
    chipTexts.forEach((chip, i) => {
      chip.setPosition(chipX, cy);
      chipX += chip.width;
      if (i < chipTexts.length - 1) {
        const arrow = this.add.text(chipX + 4, cy + 4, "›", {
          fontFamily: "IBM Plex Mono",
          fontSize: "14px",
          fontStyle: "700",
          color: "#f5d76e",
        });
        arrows.push(arrow);
        chipX += arrow.width + 8;
      }
    });
    cy += chainRowHeight + 14;

    body.setPosition(panelX + padX, cy);

    this.howToContainer.add([
      backdrop,
      shadow,
      panelBg,
      title,
      closeLabel,
      subtitle,
      ...chipTexts,
      ...arrows,
      body,
    ]);

    closeLabel.setInteractive({ useHandCursor: true });
    closeLabel.on("pointerdown", () => this.setHowToOpen(false));
  }

  private setHowToOpen(open: boolean) {
    this.howToOpen = open;
    this.howToContainer.setVisible(open);
  }
}
