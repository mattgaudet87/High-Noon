import Phaser from "phaser";
import { LEVELS, getLevelForStage } from "@/game/config/levels";
import { STAGES } from "@/game/config/stages";
import { DEFAULT_SAVE, loadSlotRaw, saveLocal, deleteSlotLocal, setActiveSlot } from "@/lib/save/local";
import { pushCloudSave, deleteCloudSave } from "@/lib/save/cloud";
import { SaveData, SlotId, SLOT_IDS } from "@/lib/save/types";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

// Design tokens (see the design handoff README).
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

const CARD_WIDTH = 256;
const CARD_HEIGHT = 236;
const CARD_TOP = 300;
const CARD_LEFTS = [245, 523, 801];

// Letter-spacing in em is size-relative; Phaser wants pixels.
function ls(em: number, fontSize: number): number {
  return em * fontSize;
}

interface SlotSummary {
  chapterId: number;
  chapterName: string;
  stageId: number;
  stageName: string;
  bounty: number;
  clearedCount: number;
  progressPct: number;
  lastPlayedLabel: string;
}

function formatLastPlayed(updatedAt: number): string {
  const diffDays = Math.floor((Date.now() - updatedAt) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}

function buildSummary(save: SaveData): SlotSummary {
  const displayStageId = Math.min(save.highestStage, STAGES.length);
  const level = getLevelForStage(displayStageId) ?? LEVELS[LEVELS.length - 1];
  const stage = STAGES.find((s) => s.id === displayStageId) ?? STAGES[STAGES.length - 1];
  const clearedCount = displayStageId - 1;

  return {
    chapterId: level.id,
    chapterName: level.name,
    stageId: displayStageId,
    stageName: stage.name,
    bounty: save.bounty,
    clearedCount,
    progressPct: clearedCount / STAGES.length,
    lastPlayedLabel: formatLastPlayed(save.updatedAt),
  };
}

export class HomeScene extends Phaser.Scene {
  private summaries: (SlotSummary | null)[] = [null, null, null];
  private confirmingIndex: number | null = null;
  private slotContainers: Phaser.GameObjects.Container[] = [];
  private headingContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("HomeScene");
  }

  create() {
    this.summaries = [null, null, null];
    this.confirmingIndex = null;
    this.slotContainers = [];

    this.cameras.main.setBackgroundColor(COLOR.ink);
    this.add.image(0, 0, "bg-home").setOrigin(0, 0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.headingContainer = this.add.container(0, 0);

    this.loadSummaries();
    this.renderHeading();

    for (let i = 0; i < SLOT_IDS.length; i++) {
      const container = this.add.container(CARD_LEFTS[i], CARD_TOP);
      this.slotContainers.push(container);
      this.renderSlot(i);
    }

    this.createSettingsButton();
  }

  private loadSummaries() {
    this.summaries = SLOT_IDS.map((slotId) => {
      const save = loadSlotRaw(slotId);
      return save ? buildSummary(save) : null;
    });
  }

  private refresh() {
    this.loadSummaries();
    this.renderHeading();
    for (let i = 0; i < SLOT_IDS.length; i++) {
      this.renderSlot(i);
    }
  }

  private renderHeading() {
    this.headingContainer.removeAll(true);

    const plateText = this.add
      .text(0, 0, "★ SAVED GAMES ★", {
        fontFamily: "Ultra",
        fontSize: "16px",
        color: "#eadbc4",
      })
      .setLetterSpacing(ls(0.3, 16));

    const plateW = plateText.width + 36;
    const plateH = plateText.height + 12;

    const plateBg = this.add
      .rectangle(GAME_WIDTH / 2, 236, plateW, plateH, COLOR.inkDeep, 0.86)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, COLOR.woodLine);
    plateText.setPosition(GAME_WIDTH / 2, 236 + 6).setOrigin(0.5, 0);

    this.headingContainer.add([plateBg, plateText]);

    const allFull = this.summaries.every((s) => s !== null);
    if (allFull) {
      const noticeY = 236 + plateH + 6;
      const noticeText = this.add
        .text(0, 0, "All 3 slots are full. Delete a save to start a new game.", {
          fontFamily: "IBM Plex Mono",
          fontSize: "12px",
          color: "#f5d76e",
        })
        .setOrigin(0.5, 0);

      const noticeW = noticeText.width + 20;
      const noticeH = noticeText.height + 6;
      const noticeBg = this.add
        .rectangle(GAME_WIDTH / 2, noticeY, noticeW, noticeH, COLOR.inkDeep, 0.86)
        .setOrigin(0.5, 0);
      noticeText.setPosition(GAME_WIDTH / 2, noticeY + 3);

      this.headingContainer.add([noticeBg, noticeText]);
    }
  }

  private renderSlot(index: number) {
    const container = this.slotContainers[index];
    container.removeAll(true);

    const summary = this.summaries[index];
    const confirming = this.confirmingIndex === index && summary !== null;

    if (confirming && summary) {
      this.renderConfirmCard(container, index, summary);
    } else if (summary) {
      this.renderFilledCard(container, index, summary);
    } else {
      this.renderEmptyCard(container, index);
    }
  }

  private addShadow(container: Phaser.GameObjects.Container, offsetY: number) {
    const shadow = this.add
      .rectangle(0, offsetY, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0.4)
      .setOrigin(0, 0);
    container.add(shadow);
  }

  private renderFilledCard(
    container: Phaser.GameObjects.Container,
    index: number,
    summary: SlotSummary
  ) {
    this.addShadow(container, 8);

    const card = this.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLOR.paper, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(1, COLOR.ink);
    container.add(card);

    const pin = this.add.circle(CARD_WIDTH / 2, 1, 6, COLOR.rust);
    container.add(pin);

    const padX = 16;

    const slotLabel = this.add
      .text(padX, 14, `SLOT ${index + 1}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#5a4433",
      })
      .setLetterSpacing(ls(0.2, 11));

    const playedLabel = this.add
      .text(CARD_WIDTH - padX, 14, summary.lastPlayedLabel, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        color: "#5a4433",
      })
      .setOrigin(1, 0);

    const chapterLabel = this.add
      .text(padX, 34, `CHAPTER ${summary.chapterId}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        fontStyle: "700",
        color: "#7a2e1f",
      })
      .setLetterSpacing(ls(0.2, 10));

    const chapterName = this.add.text(padX, 52, summary.chapterName, {
      fontFamily: "Ultra",
      fontSize: "18px",
      color: "#2b1b0e",
      wordWrap: { width: CARD_WIDTH - padX * 2 },
    });

    const stageLine = this.add.text(
      padX,
      100,
      `Stage ${summary.stageId} · ${summary.stageName}`,
      {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "600",
        color: "#2b1b0e",
      }
    );

    const trackW = 182;
    const track = this.add
      .rectangle(padX, 124, trackW, 6, COLOR.paperMuted)
      .setOrigin(0, 0);
    const fillW = Math.max(0, Math.min(1, summary.progressPct)) * trackW;
    const fill = this.add.rectangle(padX, 124, fillW, 6, COLOR.rust).setOrigin(0, 0);
    const progressLabel = this.add
      .text(padX + trackW + 8, 120, `${summary.clearedCount}/${STAGES.length}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#5a4433",
      })
      .setOrigin(0, 0);

    const bountyLabel = this.add
      .text(padX, 137, "BOUNTY", {
        fontFamily: "IBM Plex Mono",
        fontSize: "10px",
        color: "#5a4433",
      })
      .setLetterSpacing(ls(0.2, 10));
    const bountyValue = this.add
      .text(padX + bountyLabel.width + 8, 135, `${summary.bounty}`, {
        fontFamily: "Ultra",
        fontSize: "16px",
        color: "#7a2e1f",
      })
      .setOrigin(0, 0);

    const buttonY = CARD_HEIGHT - 14 - 40;
    const deleteWidth = 70;
    const continueWidth = CARD_WIDTH - padX * 2 - 8 - deleteWidth;

    const continueBg = this.add
      .rectangle(padX, buttonY, continueWidth, 40, COLOR.gold)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.ink)
      .setInteractive({ useHandCursor: true });
    const continueLabel = this.add
      .text(padX + continueWidth / 2, buttonY + 20, "CONTINUE", {
        fontFamily: "Ultra",
        fontSize: "16px",
        color: "#2b1b0e",
      })
      .setOrigin(0.5);

    continueBg.on("pointerover", () => continueBg.setFillStyle(0xffe48a));
    continueBg.on("pointerout", () => continueBg.setFillStyle(COLOR.gold));
    continueBg.on("pointerdown", () => this.onContinue(index));

    const deleteX = padX + continueWidth + 8;
    const deleteBg = this.add
      .rectangle(deleteX, buttonY, deleteWidth, 40, COLOR.paper)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.rust)
      .setInteractive({ useHandCursor: true });
    const deleteLabel = this.add
      .text(deleteX + deleteWidth / 2, buttonY + 20, "DELETE", {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#7a2e1f",
      })
      .setOrigin(0.5)
      .setLetterSpacing(ls(0.1, 11));

    deleteBg.on("pointerover", () => {
      deleteBg.setFillStyle(COLOR.rust);
      deleteLabel.setColor("#eadbc4");
    });
    deleteBg.on("pointerout", () => {
      deleteBg.setFillStyle(COLOR.paper);
      deleteLabel.setColor("#7a2e1f");
    });
    deleteBg.on("pointerdown", () => this.onAskDelete(index));

    container.add([
      slotLabel,
      playedLabel,
      chapterLabel,
      chapterName,
      stageLine,
      track,
      fill,
      progressLabel,
      bountyLabel,
      bountyValue,
      continueBg,
      continueLabel,
      deleteBg,
      deleteLabel,
    ]);
  }

  private renderConfirmCard(
    container: Phaser.GameObjects.Container,
    index: number,
    summary: SlotSummary
  ) {
    this.addShadow(container, 8);

    const card = this.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLOR.panel, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.stampRed);
    container.add(card);

    const padX = 16;

    const slotLabel = this.add
      .text(padX, 18, `SLOT ${index + 1}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#f5d76e",
      })
      .setLetterSpacing(ls(0.2, 11));

    const title = this.add.text(padX, 39, "Delete this save?", {
      fontFamily: "Ultra",
      fontSize: "20px",
      color: "#eadbc4",
    });

    const body = this.add.text(
      padX,
      69,
      `${summary.chapterName}, stage ${summary.stageId}, ${summary.bounty} bounty. This can't be undone.`,
      {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        color: "#eadbc4",
        wordWrap: { width: CARD_WIDTH - padX * 2 },
        lineSpacing: 6,
      }
    );

    const buttonY = CARD_HEIGHT - 18 - 40;
    const btnW = (CARD_WIDTH - padX * 2 - 8) / 2;

    const keepBg = this.add
      .rectangle(padX, buttonY, btnW, 40, COLOR.panel)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.paper)
      .setInteractive({ useHandCursor: true });
    const keepLabel = this.add
      .text(padX + btnW / 2, buttonY + 20, "KEEP IT", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#eadbc4",
      })
      .setOrigin(0.5)
      .setLetterSpacing(ls(0.12, 12));

    keepBg.on("pointerover", () => keepBg.setFillStyle(COLOR.ink));
    keepBg.on("pointerout", () => keepBg.setFillStyle(COLOR.panel));
    keepBg.on("pointerdown", () => this.onCancelDelete());

    const deleteX = padX + btnW + 8;
    const deleteBg = this.add
      .rectangle(deleteX, buttonY, btnW, 40, COLOR.stampRed)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    const deleteLabel = this.add
      .text(deleteX + btnW / 2, buttonY + 20, "DELETE", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        fontStyle: "700",
        color: "#fff2e6",
      })
      .setOrigin(0.5)
      .setLetterSpacing(ls(0.12, 12));

    deleteBg.on("pointerover", () => deleteBg.setFillStyle(0xc9443a));
    deleteBg.on("pointerout", () => deleteBg.setFillStyle(COLOR.stampRed));
    deleteBg.on("pointerdown", () => this.onConfirmDelete(index));

    container.add([slotLabel, title, body, keepBg, keepLabel, deleteBg, deleteLabel]);
  }

  private renderEmptyCard(container: Phaser.GameObjects.Container, index: number) {
    this.addShadow(container, 8);

    const card = this.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, COLOR.inkDeep, 0.84)
      .setOrigin(0, 0);
    container.add(card);

    const dashGraphics = this.add.graphics();
    this.drawDashedRect(dashGraphics, 0, 0, CARD_WIDTH, CARD_HEIGHT, COLOR.paperMuted, 1, 2);
    container.add(dashGraphics);

    const centerX = CARD_WIDTH / 2;

    const slotLabel = this.add
      .text(centerX, 53, `SLOT ${index + 1}`, {
        fontFamily: "IBM Plex Mono",
        fontSize: "11px",
        fontStyle: "700",
        color: "#c9b89a",
      })
      .setOrigin(0.5, 0)
      .setLetterSpacing(ls(0.2, 11));

    const emptyLabel = this.add
      .text(centerX, 72, "Empty", {
        fontFamily: "Ultra",
        fontSize: "22px",
        color: "#eadbc4",
      })
      .setOrigin(0.5, 0);

    const description = this.add
      .text(centerX, 102, "Swear in a new posse and start at Tumbleweed Flats.", {
        fontFamily: "IBM Plex Mono",
        fontSize: "12px",
        color: "#eadbc4",
        align: "center",
        wordWrap: { width: 190 },
      })
      .setOrigin(0.5, 0);

    const btnW = 150;
    const buttonY = 142;
    const newGameBg = this.add
      .rectangle(centerX - btnW / 2, buttonY, btnW, 40, COLOR.gold)
      .setOrigin(0, 0)
      .setStrokeStyle(2, COLOR.ink)
      .setInteractive({ useHandCursor: true });
    const newGameLabel = this.add
      .text(centerX, buttonY + 20, "NEW GAME", {
        fontFamily: "Ultra",
        fontSize: "16px",
        color: "#2b1b0e",
      })
      .setOrigin(0.5);

    newGameBg.on("pointerover", () => newGameBg.setFillStyle(0xffe48a));
    newGameBg.on("pointerout", () => newGameBg.setFillStyle(COLOR.gold));
    newGameBg.on("pointerdown", () => this.onNewGame(index));

    container.add([
      slotLabel,
      emptyLabel,
      description,
      newGameBg,
      newGameLabel,
    ]);
  }

  private drawDashedRect(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    alpha: number,
    lineWidth: number,
    dash = 6,
    gap = 4
  ) {
    graphics.lineStyle(lineWidth, color, alpha);
    const edges: [number, number, number, number][] = [
      [x, y, x + w, y],
      [x, y + h, x + w, y + h],
      [x, y, x, y + h],
      [x + w, y, x + w, y + h],
    ];
    for (const [x1, y1, x2, y2] of edges) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const ux = len === 0 ? 0 : dx / len;
      const uy = len === 0 ? 0 : dy / len;
      let pos = 0;
      while (pos < len) {
        const segEnd = Math.min(pos + dash, len);
        graphics.lineBetween(x1 + ux * pos, y1 + uy * pos, x1 + ux * segEnd, y1 + uy * segEnd);
        pos += dash + gap;
      }
    }
  }

  private createSettingsButton() {
    const label = this.add.text(0, 0, "SETTINGS", {
      fontFamily: "IBM Plex Mono",
      fontSize: "13px",
      fontStyle: "700",
      color: "#eadbc4",
    });
    label.setLetterSpacing(ls(0.12, 13));

    const w = label.width + 36;
    const bg = this.add
      .rectangle(GAME_WIDTH / 2, 650, w, 40, COLOR.inkDeep, 0.9)
      .setStrokeStyle(2, COLOR.paper);
    label.setPosition(GAME_WIDTH / 2, 650).setOrigin(0.5);
  }

  private onContinue(index: number) {
    setActiveSlot(SLOT_IDS[index]);
    this.scene.start("LevelSelectScene");
  }

  private onAskDelete(index: number) {
    this.confirmingIndex = index;
    this.renderSlot(index);
  }

  private onCancelDelete() {
    const index = this.confirmingIndex;
    this.confirmingIndex = null;
    if (index !== null) this.renderSlot(index);
  }

  private onConfirmDelete(index: number) {
    const slotId: SlotId = SLOT_IDS[index];
    deleteSlotLocal(slotId);
    deleteCloudSave(slotId);
    this.confirmingIndex = null;
    this.refresh();
  }

  private onNewGame(index: number) {
    const slotId: SlotId = SLOT_IDS[index];
    const fresh = saveLocal(DEFAULT_SAVE, slotId);
    pushCloudSave(fresh, slotId);
    setActiveSlot(slotId);
    this.scene.start("LevelSelectScene");
  }
}
