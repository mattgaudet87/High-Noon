import Phaser from "phaser";
import { STAGES, REPLAY_BOUNTY_RATIO, DEFEAT_BOUNTY } from "@/game/config/stages";
import { loadLocal, saveLocal } from "@/lib/save/local";
import { pushCloudSave } from "@/lib/save/cloud";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class ResultsScene extends Phaser.Scene {
  private stageId = 1;
  private victory = false;

  constructor() {
    super("ResultsScene");
  }

  init(data: { stageId: number; victory: boolean }) {
    this.stageId = data.stageId;
    this.victory = data.victory;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2b1b0e);

    const stage = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    const save = loadLocal();

    let bounty: number;
    let unlockedNext = false;

    if (this.victory) {
      const alreadyCleared = save.highestStage > this.stageId;
      if (alreadyCleared) {
        bounty = Math.round(stage.firstClearBounty * REPLAY_BOUNTY_RATIO);
      } else {
        bounty = stage.firstClearBounty;
        if (save.highestStage === this.stageId) {
          save.highestStage = Math.min(STAGES.length, this.stageId + 1);
          unlockedNext = true;
        }
      }
    } else {
      bounty = DEFEAT_BOUNTY;
    }

    save.bounty += bounty;
    const stamped = saveLocal(save);
    pushCloudSave(stamped);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 140, this.victory ? "Victory" : "Defeat", {
        fontFamily: "monospace",
        fontSize: "64px",
        color: this.victory ? "#f5d76e" : "#e05252",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `+${bounty} bounty`, {
        fontFamily: "monospace",
        fontSize: "30px",
        color: "#eadbc4",
      })
      .setOrigin(0.5);

    if (unlockedNext) {
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, "New stage unlocked", {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#4caf50",
        })
        .setOrigin(0.5);
    }

    this.createButton(GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 80, "Back to map", () => {
      this.scene.start("StageSelectScene");
    });

    this.createButton(GAME_WIDTH / 2 + 130, GAME_HEIGHT / 2 + 80, "Try again", () => {
      this.scene.start("BattleScene", { stageId: this.stageId });
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
