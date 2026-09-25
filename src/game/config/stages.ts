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
    name: "Tumbleweed Flats",
    enemyGrubMultiplier: 0.6,
    counterChance: 0.1,
    enemyLevel: 1,
    hideoutHp: 300,
    jailhouseHp: 600,
    firstClearBounty: 20,
  },
  {
    id: 2,
    name: "Quiet Crossing",
    enemyGrubMultiplier: 0.75,
    counterChance: 0.2,
    enemyLevel: 1,
    hideoutHp: 400,
    jailhouseHp: 550,
    firstClearBounty: 30,
  },
  {
    id: 3,
    name: "Dusty Gulch",
    enemyGrubMultiplier: 0.9,
    counterChance: 0.3,
    enemyLevel: 1,
    hideoutHp: 500,
    jailhouseHp: 500,
    firstClearBounty: 40,
  },
  {
    id: 4,
    name: "Rattlesnake Pass",
    enemyGrubMultiplier: 1.0,
    counterChance: 0.45,
    enemyLevel: 1,
    hideoutHp: 600,
    jailhouseHp: 500,
    firstClearBounty: 55,
  },
  {
    id: 5,
    name: "Coyote Creek",
    enemyGrubMultiplier: 1.1,
    counterChance: 0.55,
    enemyLevel: 2,
    hideoutHp: 700,
    jailhouseHp: 500,
    firstClearBounty: 70,
  },
  {
    id: 6,
    name: "Dead Man's Mesa",
    enemyGrubMultiplier: 1.2,
    counterChance: 0.7,
    enemyLevel: 3,
    hideoutHp: 800,
    jailhouseHp: 500,
    firstClearBounty: 90,
  },
  {
    id: 7,
    name: "Black Hat Canyon",
    enemyGrubMultiplier: 1.35,
    counterChance: 0.8,
    enemyLevel: 4,
    hideoutHp: 900,
    jailhouseHp: 500,
    firstClearBounty: 120,
  },
  {
    id: 8,
    name: "Vulture Ridge",
    enemyGrubMultiplier: 1.5,
    counterChance: 0.85,
    enemyLevel: 4,
    hideoutHp: 1050,
    jailhouseHp: 450,
    firstClearBounty: 150,
  },
  {
    id: 9,
    name: "Iron Horse Depot",
    enemyGrubMultiplier: 1.65,
    counterChance: 0.9,
    enemyLevel: 5,
    hideoutHp: 1200,
    jailhouseHp: 450,
    firstClearBounty: 190,
  },
  {
    id: 10,
    name: "Sundown Standoff",
    enemyGrubMultiplier: 1.8,
    counterChance: 0.95,
    enemyLevel: 5,
    hideoutHp: 1400,
    jailhouseHp: 400,
    firstClearBounty: 240,
  },
];

export const REPLAY_BOUNTY_RATIO = 0.5;
export const DEFEAT_BOUNTY = 10;
