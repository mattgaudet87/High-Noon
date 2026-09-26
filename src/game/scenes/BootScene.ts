import Phaser from "phaser";
import { migrateLegacySave } from "@/lib/save/local";
import { syncAllSlots } from "@/lib/save/cloud";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("bg-home", "/assets/home-bg.png");
    this.load.image("bg-chapters", "/assets/chapters-bg.png");
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

    migrateLegacySave();

    syncAllSlots().finally(() => {
      this.scene.start("HomeScene");
    });
  }
}
