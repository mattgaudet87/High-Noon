import Phaser from "phaser";
import { LEVELS, Level } from "@/game/config/levels";
import { STAGES, REPLAY_BOUNTY_RATIO } from "@/game/config/stages";
import { CHAPTER_SPOTS } from "@/game/config/chapterMaps";
import { loadLocal, saveLocal } from "@/lib/save/local";
import { pushCloudSave } from "@/lib/save/cloud";

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
  greenOk: 0x7fc98a,
  sun: 0xfff2c1,
};

function ls(em: number, fontSize: number): number {
  return em * fontSize;
}

interface SpotInfo {
  x: number;
  y: number;
  real: boolean;
  stageId: number | null;
  cleared: boolean;
  current: boolean;
  locked: boolean;
  isHideout: boolean;
}

// Ports the reference design's card-placement heuristic: try 8 candidate
// spots around the marker and pick whichever one covers the fewest other
// markers on the map, never one that covers the selected marker itself.
function placeCard(
  sx: number,
  sy: number,
  cardHeight: number,
  points: [number, number][]
): { x: number; y: number } {
  const W = 256;
  const G = 30;
  const clampX = (v: number) => Math.max(12, Math.min(GAME_WIDTH - W - 12, v));
  const clampY = (v: number) => Math.max(12, Math.min(652 - cardHeight, v));

  const candidates: [number, number][] = [
    [sx + G, sy - cardHeight / 2],
    [sx - G - W, sy - cardHeight / 2],
    [sx - W / 2, sy - G - cardHeight],
    [sx - W / 2, sy + G],
    [sx + G, sy - cardHeight + 20],
    [sx - G - W, sy - cardHeight + 20],
    [sx + G, sy - 20],
    [sx - G - W, sy - 20],
  ].map(([x, y]) => [clampX(x), clampY(y)] as [number, number]);

  let best = candidates[0];
  let bestScore = Infinity;

  candidates.forEach(([x, y], i) => {
    let hits = 0;
    points.forEach(([px, py]) => {
      if (px > x - 18 && px < x + W + 18 && py > y - 18 && py < y + cardHeight + 18) hits++;
    });
    const coversSelected = sx > x - 20 && sx < x + W + 20 && sy > y - 20 && sy < y + cardHeight + 20;
    const score = hits * 10 + (coversSelected ? 1000 : 0) + i * 0.1;
    if (score < bestScore) {
      bestScore = score;
      best = [x, y];
    }
  });

  return { x: best[0], y: best[1] };
}

function drawDashedCircle(
  graphics: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  r: number,
  color: number,
  alpha: number,
  lineWidth: number,
  dashDeg = 16,
  gapDeg = 10
) {
  graphics.lineStyle(lineWidth, color, alpha);
  let angle = 0;
  while (angle < 360) {
    const start = Phaser.Math.DegToRad(angle);
    const end = Phaser.Math.DegToRad(Math.min(angle + dashDeg, 360));
    graphics.beginPath();
    graphics.arc(cx, cy, r, start, end, false);
    graphics.strokePath();
    angle += dashDeg + gapDeg;
  }
}

export class StageSelectScene extends Phaser.Scene {
  private levelId = 1;
  private skipIntro = false;
  private level!: Level;
  private spots: SpotInfo[] = [];
  private selectedIndex = 0;
  private hoveredIndex: number | null = null;
  private rings: Phaser.GameObjects.Arc[] = [];
  private cardContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("StageSelectScene");
  }

  init(data: { levelId?: number; skipIntro?: boolean }) {
    this.levelId = data.levelId ?? 1;
    this.skipIntro = data.skipIntro ?? false;
  }

  create() {
    const level = LEVELS.find((l) => l.id === this.levelId) ?? LEVELS[0];
    const save = loadLocal();

    const alreadySeen = save.settings.seenLevelIntroIds.includes(level.id);
    const levelStarted = save.highestStage > level.stageIds[0];

    if (!this.skipIntro && !alreadySeen && !levelStarted) {
      const updated = {
        ...save,
        settings: {
          ...save.settings,
          seenLevelIntroIds: [...save.settings.seenLevelIntroIds, level.id],
        },
      };
      const stamped = saveLocal(updated);
      pushCloudSave(stamped);

      this.scene.start("StoryScene", {
        title: level.name,
        body: level.intro,
        buttonLabel: "Ride out",
        next: { scene: "StageSelectScene", data: { levelId: level.id, skipIntro: true } },
      });
      return;
    }

    this.level = level;
    this.rings = [];
    this.hoveredIndex = null;

    const highestStage = save.highestStage;
    const points = CHAPTER_SPOTS[level.id] ?? [];
    const stageCount = level.stageIds.length;
    const first = level.stageIds[0];

    this.spots = points.map(([x, y], k) => {
      const real = k < stageCount;
      const stageId = real ? level.stageIds[k] : null;
      return {
        x,
        y,
        real,
        stageId,
        cleared: real && stageId !== null && stageId < highestStage,
        current: real && stageId !== null && stageId === highestStage,
        locked: real && stageId !== null && stageId > highestStage,
        isHideout: k === points.length - 1,
      };
    });

    // Default selection: the next-up stage, or the last spot if the whole
    // chapter is already cleared.
    if (highestStage >= first && highestStage < first + stageCount) {
      this.selectedIndex = highestStage - first;
    } else if (highestStage >= first + stageCount) {
      this.selectedIndex = stageCount - 1;
    } else {
      this.selectedIndex = 0;
    }

    this.cameras.main.setBackgroundColor(COLOR.ink);
    this.add
      .image(0, 0, `bg-chapter-${level.id}`)
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.spots.forEach((spot, k) => this.createMarker(spot, k));

    this.cardContainer = this.add.container(0, 0).setDepth(5);
    this.renderCard();

    this.createBottomBar(save.bounty, highestStage);
  }

  private createMarker(spot: SpotInfo, k: number) {
    const size = spot.current ? 36 : spot.real ? 26 : 22;
    const radius = size / 2;

    const fill = spot.cleared ? COLOR.gold : spot.current ? COLOR.paper : COLOR.inkDeep;
    const fillAlpha = spot.locked ? 0.88 : spot.real ? 1 : 0.6;

    if (spot.current) {
      // Soft glow behind the next-up marker, plus an ink ring just outside
      // its gold border.
      this.add.circle(spot.x, spot.y, radius + 16, COLOR.gold, 0.18);
      this.add.circle(spot.x, spot.y, radius + 8, COLOR.gold, 0.28);
      this.add.circle(spot.x, spot.y, radius + 4, 0, 0).setStrokeStyle(2, COLOR.ink);
    } else {
      this.add.circle(spot.x, spot.y + 2, radius, 0x000000, 0.45);
    }

    const marker = this.add.circle(spot.x, spot.y, radius, fill, fillAlpha);
    if (spot.cleared) {
      marker.setStrokeStyle(2, COLOR.ink);
    } else if (spot.current) {
      marker.setStrokeStyle(3, COLOR.gold);
    } else if (spot.locked) {
      marker.setStrokeStyle(2, COLOR.paper);
    } else {
      const dashGraphics = this.add.graphics();
      drawDashedCircle(dashGraphics, spot.x, spot.y, radius, COLOR.paperMuted, 1, 2);
    }

    const textColor = spot.cleared || spot.current ? "#2b1b0e" : spot.locked ? "#eadbc4" : "#c9b89a";
    const fontSize = spot.current ? 15 : spot.real ? 12 : 10;
    this.add
      .text(spot.x, spot.y, `${k + 1}`, {
        fontFamily: "Ultra",
        fontSize: `${fontSize}px`,
        color: textColor,
      })
      .setOrigin(0.5)
      .setDepth(1);

    if (spot.current) {
      const tagText = this.add
        .text(0, 0, "NEXT UP", {
          fontFamily: "IBM Plex Mono",
          fontSize: "10px",
          fontStyle: "700",
          color: "#2b1b0e",
        })
        .setLetterSpacing(ls(0.16, 10));
      const tagW = tagText.width + 16;
      const tagH = tagText.height + 6;
      const tagY = spot.y - radius - 8 - tagH;
      this.add
        .rectangle(spot.x, tagY + 3, tagW, tagH, COLOR.ink)
        .setOrigin(0.5, 0);
      this.add.rectangle(spot.x, tagY, tagW, tagH, COLOR.gold).setOrigin(0.5, 0);
      tagText.setPosition(spot.x, tagY + 3).setOrigin(0.5, 0).setDepth(1);
    }

    if (spot.isHideout) {
      const hideoutText = this.add
        .text(0, 0, "HIDEOUT", {
          fontFamily: "IBM Plex Mono",
          fontSize: "9px",
          fontStyle: "700",
          color: "#eadbc4",
        })
        .setLetterSpacing(ls(0.16, 9));
      const tagW = hideoutText.width + 12;
      const tagH = hideoutText.height + 4;
      const tagY = spot.y - radius - 6 - tagH - (spot.current ? 24 : 0);
      this.add
        .rectangle(spot.x, tagY, tagW, tagH, COLOR.inkDeep, 0.9)
        .setOrigin(0.5, 0)
        .setStrokeStyle(1, COLOR.stampRed);
      hideoutText.setPosition(spot.x, tagY + 2).setOrigin(0.5, 0).setDepth(1);
    }

    const ring = this.add
      .circle(spot.x, spot.y, radius + 3, 0, 0)
      .setStrokeStyle(2, COLOR.sun)
      .setVisible(k === this.selectedIndex);
    this.rings[k] = ring;

    const hitZone = this.add
      .circle(spot.x, spot.y, radius, 0x000000, 0)
      .setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      this.hoveredIndex = k;
      this.updateRings();
    });
    hitZone.on("pointerout", () => {
      if (this.hoveredIndex === k) this.hoveredIndex = null;
      this.updateRings();
    });
    hitZone.on("pointerdown", () => {
      if (this.selectedIndex === k) return;
      this.selectedIndex = k;
      this.updateRings();
      this.renderCard();
    });
  }

  private updateRings() {
    this.rings.forEach((ring, i) => {
      ring.setVisible(i === this.selectedIndex || i === this.hoveredIndex);
    });
  }

  private renderCard() {
    this.cardContainer.removeAll(true);

    const spot = this.spots[this.selectedIndex];
    const points = CHAPTER_SPOTS[this.level.id] ?? [];
    const cardHeight = spot.real ? 220 : 150;
    const { x: cardX, y: cardY } = placeCard(spot.x, spot.y, cardHeight, points);

    const stage = spot.stageId !== null ? STAGES.find((s) => s.id === spot.stageId) ?? null : null;

    const status = !spot.real
      ? "COMING SOON"
      : spot.cleared
        ? "CLEARED"
        : spot.current
          ? "NEXT UP"
          : "LOCKED";
    const statusColor = !spot.real
      ? "#c9b89a"
      : spot.cleared
        ? "#7fc98a"
        : spot.current
          ? "#f5d76e"
          : "#c9b89a";

    const name = spot.real ? (stage?.name ?? "") : spot.isHideout ? "The Hideout" : "Uncharted trail";
    const note = !spot.real
      ? "No stage here yet. New stages will fill in this stretch of the trail."
      : spot.cleared
        ? "Already taken. Replays pay half bounty."
        : spot.current
          ? "Deploy lawmen with Grub and take the outlaw Hideout."
          : `Clear stage ${this.selectedIndex} first.`;

    const canPlay = spot.real && (spot.cleared || spot.current);

    const padX = 16;
    const bg = this.add
      .rectangle(cardX, cardY + 8, 256, cardHeight, 0x000000, 0.45)
      .setOrigin(0, 0);
    const card = this.add
      .rectangle(cardX, cardY, 256, cardHeight, COLOR.ink)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.woodLine);
    this.cardContainer.add([bg, card]);

    let cy = cardY + 14;

    const header = this.add
      .text(cardX + padX, cy, `STAGE ${this.selectedIndex + 1}/${points.length}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.14, 10));
    const statusText = this.add
      .text(cardX + 256 - padX, cy, status, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: statusColor,
      })
      .setOrigin(1, 0)
      .setLetterSpacing(ls(0.1, 10));
    this.cardContainer.add([header, statusText]);
    cy += header.height + 8;

    const nameText = this.add.text(cardX + padX, cy, name, {
      fontFamily: "Ultra",
      fontSize: "20px",
      color: "#eadbc4",
      wordWrap: { width: 256 - padX * 2 },
    });
    this.cardContainer.add(nameText);
    cy += nameText.height + 8;

    if (spot.real && stage) {
      const bounty = spot.cleared
        ? Math.round(stage.firstClearBounty * REPLAY_BOUNTY_RATIO)
        : stage.firstClearBounty;

      const cells = [
        { label: "OUTLAWS", value: `Lv ${stage.enemyLevel}`, gold: false },
        { label: "HIDEOUT", value: `${stage.hideoutHp}`, gold: false },
        { label: "BOUNTY", value: `+${bounty}`, gold: true },
      ];
      const cellW = (256 - padX * 2 - 6 * 2) / 3;
      cells.forEach((cell, i) => {
        const cellX = cardX + padX + i * (cellW + 6);
        const cellBg = this.add.rectangle(cellX, cy, cellW, 44, COLOR.panel).setOrigin(0, 0);
        const label = this.add
          .text(cellX + 8, cy + 6, cell.label, {
            fontFamily: "IBM Plex Mono",
            fontSize: "9px",
            color: "#c9b89a",
          })
          .setLetterSpacing(ls(0.14, 9));
        const value = this.add.text(cellX + 8, cy + 6 + label.height + 2, cell.value, {
          fontFamily: "Ultra",
          fontSize: "15px",
          color: cell.gold ? "#f5d76e" : "#eadbc4",
        });
        this.cardContainer.add([cellBg, label, value]);
      });
      cy += 44 + 8;
    }

    const noteText = this.add.text(cardX + padX, cy, note, {
      fontFamily: "IBM Plex Mono",
      fontSize: "12px",
      color: "#eadbc4",
      wordWrap: { width: 256 - padX * 2 },
      lineSpacing: 5,
    });
    this.cardContainer.add(noteText);
    cy += noteText.height + 8;

    if (canPlay) {
      const btnLabel = spot.cleared ? "REPLAY" : "RIDE OUT";
      const btnBg = spot.cleared ? COLOR.ink : COLOR.gold;
      const btnBorder = spot.cleared ? COLOR.paper : COLOR.ink;
      const btnColor = spot.cleared ? "#eadbc4" : "#2b1b0e";

      const button = this.add
        .rectangle(cardX + padX, cy, 256 - padX * 2, 40, btnBg)
        .setOrigin(0, 0)
        .setStrokeStyle(2, btnBorder)
        .setInteractive({ useHandCursor: true });
      const buttonLabel = this.add
        .text(cardX + 128, cy + 20, btnLabel, {
          fontFamily: "Ultra",
          fontSize: "16px",
          color: btnColor,
        })
        .setOrigin(0.5);

      const stageId = spot.stageId as number;
      button.on("pointerdown", () => {
        this.scene.start("BattleScene", { stageId });
      });

      this.cardContainer.add([button, buttonLabel]);
    }
  }

  private createBottomBar(bounty: number, highestStage: number) {
    const barTop = 664;
    const barHeight = 56;
    const centerY = barTop + barHeight / 2;

    this.add.rectangle(0, barTop, GAME_WIDTH, barHeight, COLOR.inkDeep, 0.9).setOrigin(0, 0);
    this.add
      .rectangle(0, barTop, GAME_WIDTH, 2, COLOR.woodLine)
      .setOrigin(0, 0);

    const padX = 20;
    let x = padX;

    // ‹ CHAPTERS button
    const chaptersLabel = this.add
      .text(0, 0, "‹ CHAPTERS", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#eadbc4",
      })
      .setLetterSpacing(ls(0.12, 12));
    const chaptersW = chaptersLabel.width + 28;
    const chaptersBg = this.add
      .rectangle(x, centerY - 18, chaptersW, 36, COLOR.inkDeep, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.paper)
      .setInteractive({ useHandCursor: true });
    chaptersLabel.setPosition(x + chaptersW / 2, centerY).setOrigin(0.5).setDepth(1);
    chaptersBg.on("pointerover", () => chaptersBg.setFillStyle(COLOR.panel, 1));
    chaptersBg.on("pointerout", () => chaptersBg.setFillStyle(COLOR.inkDeep, 0));
    chaptersBg.on("pointerdown", () => this.scene.start("LevelSelectScene"));
    x += chaptersW + 18;

    // Chapter label stack
    this.add
      .text(x, centerY - 12, `CHAPTER ${this.level.id}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.2, 10));
    this.add.text(x, centerY, this.level.name, {
      fontFamily: "Ultra",
      fontSize: "17px",
      color: "#eadbc4",
    });

    // Right-hand cluster: legend, cleared count, store button, bounty chip.
    const legendItems: { color: number; dashed?: boolean; label: string }[] = [
      { color: COLOR.gold, label: "Cleared" },
      { color: COLOR.paper, label: "Next up" },
      { color: COLOR.inkDeep, label: "Locked" },
      { color: COLOR.inkDeep, dashed: true, label: "Coming soon" },
    ];
    const legendLabelTexts = legendItems.map((item) =>
      this.add.text(0, 0, item.label, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        color: "#eadbc4",
      })
    );
    const legendWidths = legendLabelTexts.map((t) => 14 + 6 + t.width);
    const legendTotalWidth =
      legendWidths.reduce((sum, w) => sum + w, 0) + 14 * (legendItems.length - 1);

    const clearedHere = Math.max(0, Math.min(this.level.stageIds.length, highestStage - this.level.stageIds[0]));
    const countText = this.add
      .text(0, 0, `${clearedHere}/${this.level.stageIds.length} CLEARED`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        color: "#c9b89a",
      })
      .setLetterSpacing(ls(0.14, 11));

    const storeLabel = this.add
      .text(0, 0, "GENERAL STORE", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#eadbc4",
      })
      .setLetterSpacing(ls(0.12, 12));
    const storeW = storeLabel.width + 28;

    const bountyLabel = this.add
      .text(0, 0, "BOUNTY", {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.2, 10));
    const bountyValue = this.add.text(0, 0, `${bounty}`, {
      fontFamily: "Ultra",
      fontSize: "18px",
      color: "#eadbc4",
    });
    const bountyChipW = bountyLabel.width + 8 + bountyValue.width + 24;

    const dividerGap = 16;
    const rightGroupWidth =
      legendTotalWidth + 18 + 1 + dividerGap + countText.width + 18 + storeW + 18 + bountyChipW;
    let rx = GAME_WIDTH - padX - rightGroupWidth;

    legendItems.forEach((item, i) => {
      const swatchY = centerY;
      if (item.dashed) {
        const g = this.add.graphics();
        drawDashedCircle(g, rx + 7, swatchY, 7, COLOR.paperMuted, 1, 2);
      } else {
        const swatch = this.add.circle(rx + 7, swatchY, 7, item.color);
        if (item.label === "Cleared") swatch.setStrokeStyle(2, COLOR.ink);
        if (item.label === "Next up") swatch.setStrokeStyle(3, COLOR.gold);
        if (item.label === "Locked") swatch.setStrokeStyle(2, COLOR.paper);
      }
      legendLabelTexts[i].setPosition(rx + 14 + 6, centerY).setOrigin(0, 0.5);
      rx += legendWidths[i] + 14;
    });
    rx += 18 - 14;

    this.add.rectangle(rx, centerY - 14, 1, 28, COLOR.brownMid).setOrigin(0, 0);
    rx += 1 + dividerGap;

    countText.setPosition(rx, centerY).setOrigin(0, 0.5);
    rx += countText.width + 18;

    const storeBg = this.add
      .rectangle(rx, centerY - 18, storeW, 36, COLOR.inkDeep, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.paper)
      .setInteractive({ useHandCursor: true });
    storeLabel.setPosition(rx + storeW / 2, centerY).setOrigin(0.5).setDepth(1);
    storeBg.on("pointerover", () => storeBg.setFillStyle(COLOR.panel, 1));
    storeBg.on("pointerout", () => storeBg.setFillStyle(COLOR.inkDeep, 0));
    storeBg.on("pointerdown", () => this.scene.start("ShopScene"));
    rx += storeW + 18;

    this.add
      .rectangle(rx, centerY - 18, bountyChipW, 36, 0, 0)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.gold);
    bountyLabel.setPosition(rx + 12, centerY).setOrigin(0, 0.5);
    bountyValue.setPosition(rx + 12 + bountyLabel.width + 8, centerY).setOrigin(0, 0.5);
  }
}
