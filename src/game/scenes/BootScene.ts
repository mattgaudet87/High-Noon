import Phaser from "phaser";
import { drawBackdrop } from "@/game/art/backdrop";
import { loadLocal } from "@/lib/save/local";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    const graphics = this.add.graphics();
    drawBackdrop(graphics);

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Scaffold OK", {
        fontFamily: "monospace",
        fontSize: "48px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const save = loadLocal();
    const readout = [
      `Bounty ${save.bounty}, Stage ${save.highestStage}`,
      `Brawler Lv${save.unitLevels.brawler}  Gunslinger Lv${save.unitLevels.gunslinger}  Rider Lv${save.unitLevels.rider}`,
    ].join("\n");

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 + 60, readout, {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#2b1b0e",
        align: "center",
      })
      .setOrigin(0.5);
  }
}
