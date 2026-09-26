"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BootScene } from "@/game/scenes/BootScene";
import { HomeScene } from "@/game/scenes/HomeScene";
import { BattleScene } from "@/game/scenes/BattleScene";
import { LevelSelectScene } from "@/game/scenes/LevelSelectScene";
import { StageSelectScene } from "@/game/scenes/StageSelectScene";
import { StoryScene } from "@/game/scenes/StoryScene";
import { ResultsScene } from "@/game/scenes/ResultsScene";
import { ShopScene } from "@/game/scenes/ShopScene";

// Phaser text falls back to another font if it renders before these two are
// ready, so the game waits for them before it mounts.
async function waitForGameFonts() {
  try {
    await Promise.all([
      document.fonts.load('20px "Ultra"'),
      document.fonts.load('12px "IBM Plex Mono"'),
    ]);
  } catch {
    // A font failed to load. The game still runs, just with a fallback font.
  }
}

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    let cancelled = false;

    waitForGameFonts().then(() => {
      if (cancelled || !containerRef.current || gameRef.current) return;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 1280,
        height: 720,
        parent: containerRef.current,
        backgroundColor: "#f2a65a",
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [
          BootScene,
          HomeScene,
          LevelSelectScene,
          StageSelectScene,
          StoryScene,
          BattleScene,
          ResultsScene,
          ShopScene,
        ],
      });
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
