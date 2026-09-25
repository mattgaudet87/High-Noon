import Phaser from "phaser";
import { syncOnLoad } from "@/lib/save/cloud";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2b1b0e);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Loading...", {
        fontFamily: "monospace",
        fontSize: "28px",
        color: "#eadbc4",
      })
      .setOrigin(0.5);

    syncOnLoad().finally(() => {
      this.scene.start("StageSelectScene");
    });
  }
}
