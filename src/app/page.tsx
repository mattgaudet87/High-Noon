import { redirect } from "next/navigation";

// The game's Home screen (Saved Games) is now the real title screen, drawn
// inside the Phaser canvas at /play. This page used to show its own plain
// "HIGH NOON / Ride Out" title card first, which just made players click
// through two title screens to get to one. Skip straight to the game.
export default function Home() {
  redirect("/play");
}
