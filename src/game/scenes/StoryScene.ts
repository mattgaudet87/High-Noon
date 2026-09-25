import Phaser from "phaser";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

export interface StoryNext {
  scene: string;
  data?: Record<string, unknown>;
}

export interface StoryData {
  title: string;
  body: string;
  buttonLabel: string;
  next: StoryNext;
}

// A single story card: a title, a couple of sentences, and a button that
// moves on. Used for level intros and outros. `next` can point at another
// StoryScene call to chain two cards (level outro, then the next level's
// intro) before landing back on the level map.
export class StoryScene extends Phaser.Scene {
  private story!: StoryData;

  constructor() {
    super("StoryScene");
  }

  init(data: StoryData) {
    this.story = data;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x2b1b0e);

    this.add
      .text(GAME_WIDTH / 2, 220, this.story.title, {
        fontFamily: "monospace",
        fontSize: "40px",
        color: "#f5d76e",
        fontStyle: "bold",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 340, this.story.body, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#eadbc4",
        align: "center",
        wordWrap: { width: 820 },
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);

    const buttonY = GAME_HEIGHT - 140;
    const background = this.add
      .rectangle(GAME_WIDTH / 2, buttonY, 260, 60, 0xeadbc4, 1)
      .setInteractive({ useHandCursor: true });

    this.add
      .text(GAME_WIDTH / 2, buttonY, this.story.buttonLabel, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    background.on("pointerdown", () => {
      this.scene.start(this.story.next.scene, this.story.next.data);
    });
  }
}
