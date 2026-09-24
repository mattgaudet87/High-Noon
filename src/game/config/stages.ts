export interface Stage {
  id: number;
  name: string;
  enemyGrubMultiplier: number;
  counterChance: number;
  enemyLevel: number;
  hideoutHp: number;
  jailhouseHp: number;
  firstClearBounty: number;
}

export const STAGES: Stage[] = [
  {
    id: 1,
    name: "Dusty Gulch",
    enemyGrubMultiplier: 0.9,
    counterChance: 0.3,
    enemyLevel: 1,
    hideoutHp: 500,
    jailhouseHp: 500,
    firstClearBounty: 40,
  },
  {
    id: 2,
    name: "Rattlesnake Pass",
    enemyGrubMultiplier: 1.0,
    counterChance: 0.45,
    enemyLevel: 1,
    hideoutHp: 600,
    jailhouseHp: 500,
    firstClearBounty: 55,
  },
  {
    id: 3,
    name: "Coyote Creek",
    enemyGrubMultiplier: 1.1,
    counterChance: 0.55,
    enemyLevel: 2,
    hideoutHp: 700,
    jailhouseHp: 500,
    firstClearBounty: 70,
  },
  {
    id: 4,
    name: "Dead Man's Mesa",
    enemyGrubMultiplier: 1.2,
    counterChance: 0.7,
    enemyLevel: 3,
    hideoutHp: 800,
    jailhouseHp: 500,
    firstClearBounty: 90,
  },
  {
    id: 5,
    name: "Black Hat Canyon",
    enemyGrubMultiplier: 1.35,
    counterChance: 0.8,
    enemyLevel: 4,
    hideoutHp: 900,
    jailhouseHp: 500,
    firstClearBounty: 120,
  },
];

export const REPLAY_BOUNTY_RATIO = 0.5;
export const DEFEAT_BOUNTY = 10;
