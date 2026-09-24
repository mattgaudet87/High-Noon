"use client";

import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), {
  ssr: false,
});

export default function PlayPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <GameCanvas />
    </div>
  );
}
