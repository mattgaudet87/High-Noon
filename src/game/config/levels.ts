// Groups the trail's stages into levels, each with a short story beat so
// the player knows why they're riding out. A level unlocks once the last
// stage of the level before it is cleared (see StageSelectScene, which
// reuses the existing highestStage counter for this).
export interface Level {
  id: number;
  name: string;
  stageIds: number[];
  intro: string;
  outro: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The Cutter Gang",
    stageIds: [1, 2, 3, 4, 5],
    intro:
      "A small-time outlaw gang has been raiding the frontier towns, hitting the bank and the stagecoach line. The Sheriff swears in a posse and rides out to push them back toward their hideout.",
    outro:
      "The Cutter Gang is finished. But the guns they were carrying were better than anything a two-bit outfit like theirs should have had. Someone bigger was arming them.",
  },
  {
    id: 2,
    name: "The Vulture Syndicate",
    stageIds: [6, 7, 8, 9, 10],
    intro:
      "The trail of stolen guns and cattle leads deeper into the badlands, to an outfit calling itself the Vulture Syndicate. They run the territory's rustling and gun-running from a stronghold in the rock. The Sheriff means to shut it down.",
    outro:
      "The Syndicate's stronghold burns. Before he goes down, the boss laughs and says the guns came from further out, from a crew hijacking the new railroad to bankroll an army. The Sheriff has a train to catch.",
  },
  {
    id: 3,
    name: "The Iron Horse Cartel",
    stageIds: [11, 12, 13, 14, 15],
    intro:
      "The Iron Horse Cartel has been hijacking the new railroad, selling the guns and the payroll both. If they finish arming their outfit, no town on the line will be safe. The Sheriff rides for the rail depot for one last stand.",
    outro:
      "The depot is quiet. The Iron Horse Cartel is broken, the railroad is safe, and the frontier finally gets some peace. The Sheriff rides home.",
  },
];

export function getLevelForStage(stageId: number): Level | undefined {
  return LEVELS.find((level) => level.stageIds.includes(stageId));
}
