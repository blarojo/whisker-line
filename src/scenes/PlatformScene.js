// PlatformScene.js
//
// Scene 3 — "The Grate" (see docs/argument.md). Whisker reaches the
// platform proper and meets Old Tom, a platform-dwelling mouse who's seen
// enough of LeCheddar's toll-tunnels to know the way in and out. The
// scene's puzzle mirrors Scene 2's shape deliberately (find a small useful
// object, use it on the thing blocking the way) so the "look around, pick
// up, use on" pattern gets reinforced before the story leans on it harder
// later. Ends the current content slice on a cliffhanger as Whisker heads
// into LeCheddar's tunnels.
//
// All original illustration — a stylised mouse-scale platform, not a real
// place. See "On art and audio assets" in docs/architecture-guide.md.

import { Mouse } from '../entities/Mouse.js';
import { DialogBox } from '../ui/DialogBox.js';
import { Inventory } from '../ui/Inventory.js';
import { ITEMS } from '../data/Items.js';

const OLD_TOM_PALETTE = {
  body: 0x6a6a6a,
  bodyShade: 0x4e4e4e,
  belly: 0xc8c4b8,
  ear: 0x8a8078,
  earInner: 0x4a4038,
  outline: 0x161616,
  whisker: 0xd8d4c8,
};

export class PlatformScene extends Phaser.Scene {
  constructor() {
    super('PlatformScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.floorY = height * 0.72;
    this._busyAction = false;
    this._machineSearched = false;
    this._grateOpen = false;
    this._tomLineIndex = 0;

    this._drawBackground(width, height);

    this.dialogBox = new DialogBox(this);
    this.inventory = new Inventory(this);

    this.player = new Mouse(this, 50, this.floorY - 6);
    this.player.setFlip(1);

    this.tom = new Mouse(this, this.tomX, this.floorY - 4, { palette: OLD_TOM_PALETTE, scale: 1.08 });
    this.tom.setFlip(-1);

    this._setupHotspots();
    this._runOpening();
  }

  _drawBackground(width, height) {
    // Platform wall
    this.add.rectangle(0, 0, width, height, 0x0b1018).setOrigin(0, 0);
    const wall = this.add.graphics();
    wall.fillStyle(0x182430, 1);
    wall.fillRect(0, height * 0.18, width, this.floorY - height * 0.18);
    wall.lineStyle(1, 0x0f1822, 0.7);
    for (let y = height * 0.18; y < this.floorY; y += 16) {
      wall.lineBetween(0, y, width, y);
    }
    for (let x = 0; x < width; x += 40) {
      wall.lineBetween(x, height * 0.18, x, this.floorY);
    }
    // A curved tunnel-mouth motif high on the wall for atmosphere
    wall.lineStyle(2, 0x233246, 0.6);
    wall.strokeCircle(width * 0.5, height * 0.18, 46);

    // Platform floor + edge + track pit
    this.add.rectangle(0, this.floorY, width, height - this.floorY, 0x11161d).setOrigin(0, 0);
    const edge = this.add.graphics();
    edge.fillStyle(0xc9a83a, 1);
    edge.fillRect(0, this.floorY, width, 4);
    edge.fillStyle(0x02040a, 1);
    edge.fillRect(0, this.floorY + 4, width, height - (this.floorY + 4));
    edge.lineStyle(1.5, 0x3a4a5a, 0.5);
    edge.lineBetween(0, this.floorY + 14, width, this.floorY + 14);
    edge.lineBetween(0, this.floorY + 22, width, this.floorY + 22);

    // An old vending machine, dented, with a matchstick visible in its
    // cracked base panel
    this.machineX = 300;
    const machine = this.add.graphics();
    machine.fillStyle(0x2a3c4a, 1);
    machine.fillRoundedRect(this.machineX - 20, this.floorY - 70, 40, 70, 3);
    machine.fillStyle(0x0a141c, 1);
    machine.fillRoundedRect(this.machineX - 14, this.floorY - 62, 28, 30, 2);
    machine.lineStyle(1, 0x1c2c38, 1);
    for (let r = 0; r < 3; r += 1) {
      machine.lineBetween(this.machineX - 14, this.floorY - 62 + r * 10, this.machineX + 14, this.floorY - 62 + r * 10);
    }
    machine.fillStyle(0x0a1218, 1);
    machine.fillRect(this.machineX - 16, this.floorY - 26, 32, 20);
    machine.lineStyle(1.5, 0x000000, 0.6);
    machine.lineBetween(this.machineX - 6, this.floorY - 26, this.machineX - 2, this.floorY - 6);

    // Whisker's target: a rusted grate over the onward tunnel
    this.grateX = width * 0.8;
    const gateTop = this.floorY - 76;
    this.add.rectangle(this.grateX + 30, gateTop - 10, width - (this.grateX + 30), this.floorY - gateTop + 10, 0x02040a);

    this.grateGraphic = this.add.graphics();
    this._drawGrate(0);

    this.add
      .text(this.grateX, gateTop - 20, "LECHEDDAR'S TUNNELS", {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#8a3a3a',
      })
      .setOrigin(0.5);

    const flicker = this.add.rectangle(width * 0.5, height * 0.05, width, 10, 0xfff3c0, 0.05);
    this.tweens.add({ targets: flicker, alpha: 0.1, duration: 220, yoyo: true, repeat: -1, delay: 900 });
  }

  _drawGrate(openAmount) {
    // openAmount: 0 (shut) to 1 (fully swung open)
    this.grateGraphic.clear();
    const g = this.grateGraphic;
    const gateTop = this.floorY - 76;
    const w = 44;
    g.fillStyle(0x1a2432, 1);
    g.fillRect(this.grateX - w / 2 - 6, gateTop - 6, w + 12, this.floorY - gateTop + 6);

    const hingeX = this.grateX - w / 2;
    const swing = Phaser.Math.Linear(0, -70, openAmount);
    g.save();
    g.translateCanvas(hingeX, gateTop);
    g.rotateCanvas(Phaser.Math.DegToRad(swing));
    g.lineStyle(3, 0x3a4a58, 1);
    g.strokeRect(0, 0, w, this.floorY - gateTop);
    for (let bar = 1; bar < 4; bar += 1) {
      g.lineBetween((w / 4) * bar, 0, (w / 4) * bar, this.floorY - gateTop);
    }
    g.restore();
  }

  _setupHotspots() {
    this.canExplore = false;
    this.tomX = 180;

    const makeZone = (x, y, w, h, walkX, onInteract) => {
      // Zone game objects aren't interactive by default — without this
      // call the zone silently never receives pointer events at all.
      const zone = this.add.zone(x, y, w, h).setOrigin(0.5, 0.5).setInteractive({ useHandCursor: true });
      this.input.on('gameobjectdown', (_pointer, obj) => {
        if (obj === zone && this.canExplore && !this._busyAction) {
          this._runHotspot(walkX, onInteract);
        }
      });
      return zone;
    };

    makeZone(this.tomX + 16, this.floorY - 20, 60, 50, this.tomX - 22, () => this._talkTom());
    makeZone(this.machineX, this.floorY - 35, 46, 76, this.machineX - 26, () => this._searchMachine());
    makeZone(this.grateX, this.floorY - 38, 56, 82, this.grateX - 46, () => this._useGrate());

    this._machineHint = this.add.circle(this.machineX - 6, this.floorY - 8, 4, 0xfff3c0, 0.9).setDepth(5);
    this.tweens.add({ targets: this._machineHint, y: '-=8', alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  async _runHotspot(walkX, onInteract) {
    this._busyAction = true;
    await this.player.walkTo(walkX, this.floorY - 6);
    await onInteract();
    this._busyAction = false;
  }

  async _runOpening() {
    await this._wait(500);
    await this.dialogBox.say('Whisker', "...Right. That's a lot of platform.", '#e8e2c8');

    await this._wait(300);
    await this.dialogBox.say('Old Tom', "New face. Walking, not scurrying — brave or stupid, and usually both.", '#c8c4b8');
    await this.dialogBox.say('Whisker', "Bit of both, probably. I'm looking for a way further in. My sister's out there somewhere.", '#e8e2c8');
    await this.dialogBox.say('Old Tom', "Further in means past that grate. LeCheddar's rats keep it shut, but the latch is just rusted — not locked proper.", '#c8c4b8');
    await this.dialogBox.say('Whisker', "So I'd just need to pry it.", '#e8e2c8');
    await this.dialogBox.say('Old Tom', "Something stiff and thin ought to do it. This platform's seen a lot of dropped rubbish over the years.", '#c8c4b8');

    this.canExplore = true;
  }

  async _talkTom() {
    const lines = [
      "Mind the third rail. Mind LeCheddar more.",
      "Used to be a hundred of us on this platform. Toll took most of that.",
      "Whatever's through that grate, it isn't kind. Go in with your eyes open.",
    ];
    const line = lines[Math.min(this._tomLineIndex, lines.length - 1)];
    this._tomLineIndex += 1;
    await this.dialogBox.say('Old Tom', line, '#c8c4b8');
  }

  async _searchMachine() {
    if (this._machineSearched) {
      await this.dialogBox.say('Whisker', "Nothing else worth pulling out of there.", '#e8e2c8');
      return;
    }
    this._machineSearched = true;
    this._machineHint.destroy();
    await this.dialogBox.say('Whisker', "Cracked wide open. Somebody's been at this before me.", '#e8e2c8');
    this.inventory.add(ITEMS.matchstick);
    await this.dialogBox.say('Whisker', "A matchstick. Should be stiff enough to pry a rusted latch.", '#e8e2c8');
  }

  async _useGrate() {
    if (this._grateOpen) {
      await this.dialogBox.say('Whisker', "Already open. No turning back now.", '#e8e2c8');
      return;
    }

    const selected = this.inventory.getSelectedId();
    if (selected !== 'matchstick') {
      await this.dialogBox.say('Whisker', "Rusted shut tight. I need something stiff to pry the latch.", '#e8e2c8');
      return;
    }

    this._grateOpen = true;
    this.inventory.remove('matchstick');
    await this.dialogBox.say('Whisker', "Come on... come on...", '#e8e2c8', 1000);

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 700,
      onUpdate: (tween) => this._drawGrate(tween.getValue()),
    });
    await this._wait(800);

    await this.dialogBox.say('Old Tom', "Once you're through there, there's no calling for help.", '#c8c4b8');
    await this.dialogBox.say('Old Tom', "You sure about this, lad?", '#c8c4b8');
    await this.dialogBox.say('Whisker', "No. But I'm going anyway.", '#e8e2c8');

    await this.player.walkTo(this.grateX + 10, this.floorY - 6);
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.time.delayedCall(950, () => this.scene.start('EndOfDemoScene'));
  }

  _wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
