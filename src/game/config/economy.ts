export const STARTING_GRUB = 30;
export const GRUB_PER_SECOND = 7;

export const DYNAMITE = {
  damage: 70,
  cooldownSeconds: 10,
  fuseSeconds: 1.5,
  blastRadius: 90,
};

// Rally Horn: buffs every lawman currently on the field, rather than
// dealing damage. Units deployed after the horn sounds don't get the buff.
export const RALLY_HORN = {
  cooldownSeconds: 20,
  durationSeconds: 6,
  multiplier: 1.35,
};
