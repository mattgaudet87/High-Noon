import Phaser from "phaser";
import { STAGES } from "@/game/config/stages";
import { LEVELS } from "@/game/config/levels";
import { loadLocal, saveLocal } from "@/lib/save/local";
import { pushCloudSave } from "@/lib/save/cloud";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const TRAIL_MARGIN_X = 110;
const TRAIL_LOW_Y = 560;
const TRAIL_HIGH_Y = 360;

// Lays the stage markers out in a zigzag trail spanning the screen, however
// many stages there are, so adding more stages never needs new coordinates.
function buildMarkerPositions(count: number): { x: number; y: number }[] {
  if (count === 1) return [{ x: GAME_WIDTH / 2, y: TRAIL_LOW_Y }];

  const step = (GAME_WIDTH - TRAIL_MARGIN_X * 2) / (count - 1);
  return Array.from({ length: count }, (_, i) => ({
    x: TRAIL_MARGIN_X + step * i,
    y: i % 2 === 0 ? TRAIL_LOW_Y : TRAIL_HIGH_Y,
  }));
}

export class StageSelectScene extends Phaser.Scene {
  private levelId = 1;
  private skipIntro = false;

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

    this.cameras.main.setBackgroundColor(0xf2a65a);

    this.add
      .text(GAME_WIDTH / 2, 40, level.name, {
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

    const levelStages = STAGES.filter((s) => level.stageIds.includes(s.id));
    const markerPositions = buildMarkerPositions(levelStages.length);

    this.drawTrail(markerPositions);

    levelStages.forEach((stage, i) => {
      const pos = markerPositions[i];
      const unlocked = stage.id <= save.highestStage;
      this.createStageMarker(pos.x, pos.y, stage.id, stage.name, unlocked);
    });

    this.createBackButton();
  }

  private createBackButton() {
    const x = 110;
    const y = 30;

    const background = this.add
      .rectangle(x, y, 160, 44, 0x2b1b0e, 0.85)
      .setStrokeStyle(2, 0xeadbc4)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(x, y, "< Levels", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#eadbc4",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", () => {
      this.scene.start("LevelSelectScene");
    });
  }

  private drawTrail(markerPositions: { x: number; y: number }[]) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xb9773a, 1);

    for (let i = 0; i < markerPositions.length - 1; i++) {
      const a = markerPositions[i];
      const b = markerPositions[i + 1];
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
