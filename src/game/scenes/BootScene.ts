import Phaser from "phaser";
import { drawBackdrop } from "@/game/art/backdrop";

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
  }
}
