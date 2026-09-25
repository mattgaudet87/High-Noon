import Phaser from "phaser";
import { drawBackdrop } from "@/game/art/backdrop";
import { drawJailhouse } from "@/game/art/jailhouse";
import { drawHideout } from "@/game/art/hideout";
import { drawBrawler } from "@/game/art/brawler";
import { drawGunslinger } from "@/game/art/gunslinger";
import { drawRider } from "@/game/art/rider";
import { UNITS, UnitKey, COUNTERS, COUNTER_MULTIPLIER } from "@/game/config/units";
import { STARTING_GRUB, GRUB_PER_SECOND, DYNAMITE } from "@/game/config/economy";
import { STAGES, Stage } from "@/game/config/stages";
import { getUnitStats } from "@/game/config/upgrades";
import { EnemyAI } from "@/game/ai/enemyAI";
import { loadLocal } from "@/lib/save/local";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const GROUND_Y = 580;

const JAILHOUSE_X = 130;
const JAILHOUSE_HEIGHT = 160;
const JAILHOUSE_FRONT = JAILHOUSE_X + 70;
const HIDEOUT_X = 1150;
const HIDEOUT_HEIGHT = 170;
const HIDEOUT_FRONT = HIDEOUT_X - 75;
const BUILDING_BASE_Y = 420;

const UNIT_SPAWN_OFFSET = 90;
const UNIT_SPACING = 34;

const SWIPE_ZONE_BOTTOM = 600;
const BLAST_TOP_Y = 380;
const BLAST_BOTTOM_Y = 620;

const DRAW_FUNCS: Record<
  UnitKey,
  (
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    facing: 1 | -1,
    level: number,
    team: "lawman" | "outlaw"
  ) => void
> = {
  brawler: drawBrawler,
  gunslinger: drawGunslinger,
  rider: drawRider,
};

const UNIT_KEYS = Object.keys(UNITS) as UnitKey[];

interface BattleUnit {
  team: "lawman" | "outlaw";
  key: UnitKey;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  speed: number;
  attackCooldown: number;
  cooldownRemaining: number;
  facing: 1 | -1;
  container: Phaser.GameObjects.Container;
  healthBar: Phaser.GameObjects.Graphics;
}

interface DeployButton {
  key: UnitKey;
  background: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class BattleScene extends Phaser.Scene {
  private stageId = 1;
  private stage!: Stage;

  private units: BattleUnit[] = [];
  private grub = STARTING_GRUB;
  private grubText!: Phaser.GameObjects.Text;
  private deployButtons: DeployButton[] = [];

  private jailhouseHp = 0;
  private hideoutHp = 0;
  private jailhouseBar!: Phaser.GameObjects.Graphics;
  private hideoutBar!: Phaser.GameObjects.Graphics;

  private enemyAI!: EnemyAI;
  private battleOver = false;
  private unitLevels!: Record<UnitKey, number>;

  private dynamiteCooldownRemaining = 0;
  private dynamiteText!: Phaser.GameObjects.Text;
  private swipeGraphics!: Phaser.GameObjects.Graphics;
  private blastGraphics!: Phaser.GameObjects.Graphics;
  private swipeStartX: number | null = null;

  constructor() {
    super("BattleScene");
  }

  init(data: { stageId?: number }) {
    this.stageId = data.stageId ?? 1;
    this.stage = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    this.units = [];
    this.grub = STARTING_GRUB;
    this.deployButtons = [];
    this.jailhouseHp = this.stage.jailhouseHp;
    this.hideoutHp = this.stage.hideoutHp;
    this.battleOver = false;
    this.enemyAI = new EnemyAI(this.stage);
    this.unitLevels = loadLocal().unitLevels;
    this.dynamiteCooldownRemaining = 0;
    this.swipeStartX = null;
  }

  create() {
    const graphics = this.add.graphics();
    drawBackdrop(graphics);

    drawJailhouse(graphics, JAILHOUSE_X, BUILDING_BASE_Y);
    drawHideout(graphics, HIDEOUT_X, BUILDING_BASE_Y);

    this.jailhouseBar = this.add.graphics();
    this.hideoutBar = this.add.graphics();
    this.drawBuildingBars();

    this.createHud();

    this.swipeGraphics = this.add.graphics();
    this.blastGraphics = this.add.graphics();
    this.setupDynamiteInput();
  }

  update(_time: number, delta: number) {
    if (this.battleOver) return;

    const dt = delta / 1000;

    this.grub += GRUB_PER_SECOND * dt;
    this.grubText.setText(`Grub: ${Math.floor(this.grub)}`);
    this.updateDeployButtons();

    if (this.dynamiteCooldownRemaining > 0) {
      this.dynamiteCooldownRemaining = Math.max(0, this.dynamiteCooldownRemaining - dt);
    }
    this.updateDynamiteHud();

    this.updateUnits(dt);

    const lawmenOnField = this.units
      .filter((u) => u.team === "lawman")
      .map((u) => u.key);
    this.enemyAI.update(dt, lawmenOnField, (key) =>
      this.spawnUnit(key, "outlaw", this.stage.enemyLevel)
    );

    this.drawBuildingBars();
    this.checkBattleEnd();
  }

  // ---------- HUD ----------

  private createHud() {
    this.grubText = this.add.text(20, 20, `Grub: ${Math.floor(this.grub)}`, {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#2b1b0e",
      fontStyle: "bold",
    });

    this.dynamiteText = this.add.text(20, 56, "", {
      fontFamily: "monospace",
      fontSize: "18px",
      color: "#7a1f1f",
      fontStyle: "bold",
    });

    this.add
      .text(GAME_WIDTH / 2, 20, this.stage.name, {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#2b1b0e",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    const buttonY = GAME_HEIGHT - 60;
    const positions = [GAME_WIDTH / 2 - 260, GAME_WIDTH / 2, GAME_WIDTH / 2 + 260];

    UNIT_KEYS.forEach((key, i) => {
      const stats = UNITS[key];
      const x = positions[i];

      const background = this.add
        .rectangle(x, buttonY, 220, 70, 0x2b1b0e, 0.85)
        .setStrokeStyle(2, 0xeadbc4)
        .setInteractive({ useHandCursor: true });

      const label = this.add
        .text(x, buttonY, `${stats.name}\n${stats.cost} grub`, {
          fontFamily: "monospace",
          fontSize: "18px",
          color: "#eadbc4",
          align: "center",
        })
        .setOrigin(0.5);

      background.on("pointerdown", () => this.deployUnit(key));

      this.deployButtons.push({ key, background, label });
    });
  }

  private updateDeployButtons() {
    for (const button of this.deployButtons) {
      const canAfford = this.grub >= UNITS[button.key].cost;
      const alpha = canAfford ? 1 : 0.5;
      button.background.setAlpha(alpha);
      button.label.setAlpha(alpha);
    }
  }

  private drawBuildingBars() {
    this.drawHealthBar(
      this.jailhouseBar,
      JAILHOUSE_X,
      BUILDING_BASE_Y - JAILHOUSE_HEIGHT - 34,
      140,
      this.jailhouseHp / this.stage.jailhouseHp
    );
    this.drawHealthBar(
      this.hideoutBar,
      HIDEOUT_X,
      BUILDING_BASE_Y - HIDEOUT_HEIGHT - 34,
      150,
      this.hideoutHp / this.stage.hideoutHp
    );
  }

  private drawHealthBar(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    y: number,
    width: number,
    fraction: number
  ) {
    const clamped = Math.max(0, Math.min(1, fraction));
    graphics.clear();
    graphics.fillStyle(0x2b1b0e, 0.8);
    graphics.fillRect(centerX - width / 2, y, width, 10);
    graphics.fillStyle(clamped > 0.3 ? 0x4caf50 : 0xc0392b, 1);
    graphics.fillRect(centerX - width / 2, y, width * clamped, 10);
  }

  // ---------- Dynamite ----------

  private setupDynamiteInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > SWIPE_ZONE_BOTTOM) return;
      this.swipeStartX = pointer.x;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.swipeStartX === null) return;
      this.drawSwipeTrail(this.swipeStartX, pointer.x);
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.swipeStartX === null) return;
      this.triggerDynamite(this.swipeStartX, pointer.x);
      this.swipeStartX = null;
      this.swipeGraphics.clear();
    });
  }

  private drawSwipeTrail(x1: number, x2: number) {
    this.swipeGraphics.clear();
    const ready = this.dynamiteCooldownRemaining <= 0;
    this.swipeGraphics.lineStyle(4, ready ? 0xf5d76e : 0x8a8a8a, 0.8);
    this.swipeGraphics.beginPath();
    this.swipeGraphics.moveTo(x1, GROUND_Y - 40);
    this.swipeGraphics.lineTo(x2, GROUND_Y - 40);
    this.swipeGraphics.strokePath();
  }

  private triggerDynamite(x1: number, x2: number) {
    if (this.dynamiteCooldownRemaining > 0) return;

    const dragDistance = Math.abs(x2 - x1);
    const width = Phaser.Math.Clamp(dragDistance, DYNAMITE.minWidth, DYNAMITE.maxWidth);
    const centerX = (x1 + x2) / 2;
    const blastMinX = centerX - width / 2;
    const blastMaxX = centerX + width / 2;

    for (const unit of this.units) {
      if (unit.team !== "outlaw") continue;
      if (unit.container.x >= blastMinX && unit.container.x <= blastMaxX) {
        unit.hp = Math.max(0, unit.hp - DYNAMITE.damage);
        this.drawUnitHealthBar(unit);
      }
    }
    this.removeDeadUnits();

    this.dynamiteCooldownRemaining = DYNAMITE.cooldownSeconds;
    this.showBlastEffect(blastMinX, blastMaxX);
  }

  private showBlastEffect(minX: number, maxX: number) {
    this.blastGraphics.clear();
    this.blastGraphics.fillStyle(0xf5d76e, 0.55);
    this.blastGraphics.fillRect(minX, BLAST_TOP_Y, maxX - minX, BLAST_BOTTOM_Y - BLAST_TOP_Y);

    this.tweens.add({
      targets: this.blastGraphics,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        this.blastGraphics.clear();
        this.blastGraphics.setAlpha(1);
      },
    });
  }

  private updateDynamiteHud() {
    if (this.dynamiteCooldownRemaining <= 0) {
      this.dynamiteText.setText("Dynamite: Ready (swipe the street)");
      this.dynamiteText.setColor("#4caf50");
    } else {
      this.dynamiteText.setText(`Dynamite: ${Math.ceil(this.dynamiteCooldownRemaining)}s`);
      this.dynamiteText.setColor("#7a1f1f");
    }
  }

  // ---------- Units ----------

  private deployUnit(key: UnitKey) {
    const cost = UNITS[key].cost;
    if (this.grub < cost) return;
    this.grub -= cost;
    this.spawnUnit(key, "lawman", this.unitLevels[key]);
  }

  private spawnUnit(key: UnitKey, team: "lawman" | "outlaw", level: number) {
    const stats = getUnitStats(key, level);
    const facing: 1 | -1 = team === "lawman" ? 1 : -1;
    const spawnX =
      team === "lawman" ? JAILHOUSE_X + UNIT_SPAWN_OFFSET : HIDEOUT_X - UNIT_SPAWN_OFFSET;

    const art = this.add.graphics();
    DRAW_FUNCS[key](art, 0, 0, facing, level, team);

    const healthBar = this.add.graphics();

    const container = this.add.container(spawnX, GROUND_Y, [art, healthBar]);

    const unit: BattleUnit = {
      team,
      key,
      hp: stats.hp,
      maxHp: stats.hp,
      damage: stats.damage,
      range: stats.range,
      speed: stats.speed,
      attackCooldown: stats.attackCooldown,
      cooldownRemaining: 0,
      facing,
      container,
      healthBar,
    };

    this.units.push(unit);
    this.drawUnitHealthBar(unit);
  }

  private drawUnitHealthBar(unit: BattleUnit) {
    const fraction = Math.max(0, unit.hp / unit.maxHp);
    unit.healthBar.clear();
    unit.healthBar.fillStyle(0x2b1b0e, 0.8);
    unit.healthBar.fillRect(-16, -78, 32, 5);
    unit.healthBar.fillStyle(unit.team === "lawman" ? 0x4caf50 : 0xc0392b, 1);
    unit.healthBar.fillRect(-16, -78, 32 * fraction, 5);
  }

  private updateUnits(dt: number) {
    for (const unit of this.units) {
      if (unit.cooldownRemaining > 0) unit.cooldownRemaining -= dt;

      const nearestEnemy = this.findNearestEnemy(unit);
      if (nearestEnemy && this.distance(unit, nearestEnemy) <= unit.range) {
        if (unit.cooldownRemaining <= 0) {
          this.attackUnit(unit, nearestEnemy);
          unit.cooldownRemaining = unit.attackCooldown;
        }
        continue;
      }

      const buildingFrontX = unit.team === "lawman" ? HIDEOUT_FRONT : JAILHOUSE_FRONT;
      const buildingDist = Math.abs(buildingFrontX - unit.container.x);
      if (buildingDist <= unit.range) {
        if (unit.cooldownRemaining <= 0) {
          this.attackBuilding(unit);
          unit.cooldownRemaining = unit.attackCooldown;
        }
        continue;
      }

      if (!this.isBlockedByTeammate(unit)) {
        unit.container.x += unit.speed * dt * unit.facing;
      }
    }

    this.removeDeadUnits();
  }

  private findNearestEnemy(unit: BattleUnit): BattleUnit | null {
    let nearest: BattleUnit | null = null;
    let nearestDist = Infinity;
    for (const other of this.units) {
      if (other.team === unit.team || other.hp <= 0) continue;
      const d = this.distance(unit, other);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = other;
      }
    }
    return nearest;
  }

  private distance(a: BattleUnit, b: BattleUnit) {
    return Math.abs(a.container.x - b.container.x);
  }

  private isBlockedByTeammate(unit: BattleUnit): boolean {
    return this.units.some((other) => {
      if (other === unit || other.team !== unit.team) return false;
      const dx = other.container.x - unit.container.x;
      const sameDirection = Math.sign(dx) === unit.facing;
      return sameDirection && Math.abs(dx) < UNIT_SPACING;
    });
  }

  private attackUnit(attacker: BattleUnit, defender: BattleUnit) {
    let damage = attacker.damage;
    if (COUNTERS[attacker.key] === defender.key) {
      damage *= COUNTER_MULTIPLIER;
    }
    defender.hp = Math.max(0, defender.hp - damage);
    this.drawUnitHealthBar(defender);
  }

  private attackBuilding(unit: BattleUnit) {
    if (unit.team === "lawman") {
      this.hideoutHp = Math.max(0, this.hideoutHp - unit.damage);
    } else {
      this.jailhouseHp = Math.max(0, this.jailhouseHp - unit.damage);
    }
  }

  private removeDeadUnits() {
    this.units = this.units.filter((unit) => {
      if (unit.hp <= 0) {
        unit.container.destroy();
        return false;
      }
      return true;
    });
  }

  // ---------- Battle end ----------

  private checkBattleEnd() {
    if (this.hideoutHp <= 0) {
      this.endBattle(true);
    } else if (this.jailhouseHp <= 0) {
      this.endBattle(false);
    }
  }

  private endBattle(victory: boolean) {
    this.battleOver = true;
    this.scene.start("ResultsScene", { stageId: this.stageId, victory });
  }
}
