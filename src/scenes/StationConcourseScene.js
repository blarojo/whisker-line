// StationConcourseScene.js
//
// Scene 2 — "The Turnstile" (see docs/argument.md). Whisker's first taste
// of the Whisker Line proper: a mouse-scale ticket hall built in the gaps
// of the real station, run in part by Nibs, a local trader who's made her
// peace with LeCheddar's toll. The scene's puzzle is small and
// self-contained: find something that passes for a coin, and feed the
// turnstile LeCheddar's crew rigged up to block the way to the platforms.
//
// All original illustration — a stylised mouse-scale ticket hall, not a
// real place. See "On art and audio assets" in docs/architecture-guide.md.

import { Mouse } from '../entities/Mouse.js';
import { DialogBox } from '../ui/DialogBox.js';
import { Inventory } from '../ui/Inventory.js';
import { ITEMS } from '../data/Items.js';

const NIBS_PALETTE = {
  body: 0x9a7550,
  bodyShade: 0x7a5a3a,
  belly: 0xe8d8b8,
  ear: 0xc99878,
  earInner: 0x8a5040,
  outline: 0x2a1c12,
  whisker: 0xe8d8c0,
};

export class StationConcourseScene extends Phaser.Scene {
  constructor() {
    super('StationConcourseScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.floorY = height * 0.78;
    this._busyAction = false;
    this._litterSearched = false;
    this._turnstileOpen = false;

    this._drawBackground(width, height);

    this.dialogBox = new DialogBox(this);
    this.inventory = new Inventory(this);

    this.player = new Mouse(this, 50, this.floorY - 6);
    this.player.setFlip(1);

    this.nibs = new Mouse(this, this.nibsX, this.floorY - 4, { palette: NIBS_PALETTE, scale: 1.05 });
    this.nibs.setFlip(-1);

    this._setupHotspots(width, height);
    this._runOpening();
  }

  _drawBackground(width, height) {
    // Underground brick/tile backdrop
    this.add.rectangle(0, 0, width, height, 0x0d1420).setOrigin(0, 0);
    const wall = this.add.graphics();
    wall.fillStyle(0x1c2a38, 1);
    wall.fillRect(0, height * 0.2, width, this.floorY - height * 0.2);
    wall.lineStyle(1, 0x142030, 0.7);
    for (let y = height * 0.2; y < this.floorY; y += 14) {
      wall.lineBetween(0, y, width, y);
    }
    for (let x = 0; x < width; x += 46) {
      wall.lineBetween(x, height * 0.2, x, this.floorY);
    }

    // Floor
    this.add.rectangle(0, this.floorY, width, height - this.floorY, 0x0a0e14).setOrigin(0, 0);
    const floor = this.add.graphics();
    floor.lineStyle(1, 0x000000, 0.4);
    for (let x = 0; x < width; x += 24) {
      floor.lineBetween(x, this.floorY, x - 10, height);
    }

    // A worn poster board, stage left
    this.posterX = 90;
    const board = this.add.graphics();
    board.fillStyle(0x2a1c14, 1);
    board.fillRect(this.posterX - 22, this.floorY - 90, 44, 68);
    board.fillStyle(0xd8cfa0, 1);
    board.fillRect(this.posterX - 17, this.floorY - 84, 34, 56);
    board.lineStyle(3, 0xaa2b2b, 1);
    board.strokeRect(this.posterX - 17, this.floorY - 84, 34, 56);
    this.add
      .text(this.posterX, this.floorY - 66, 'WANTED\n\nLECHEDDAR\n\napproach\nwith\ncheese', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#2a1c14',
        align: 'center',
      })
      .setOrigin(0.5);

    // Nibs' stall
    this.nibsX = 230;
    const stall = this.add.graphics();
    stall.fillStyle(0x5a3c28, 1);
    stall.fillRect(this.nibsX - 4, this.floorY - 40, 4, 40);
    stall.fillRect(this.nibsX + 40, this.floorY - 40, 4, 40);
    stall.fillStyle(0x8a4a3a, 1);
    stall.fillTriangle(
      this.nibsX - 10, this.floorY - 40,
      this.nibsX + 50, this.floorY - 40,
      this.nibsX + 20, this.floorY - 58,
    );
    stall.fillStyle(0x3a2a1c, 1);
    stall.fillRect(this.nibsX - 2, this.floorY - 22, 40, 22);
    stall.lineStyle(1, 0x1a1210, 0.8);
    stall.strokeRect(this.nibsX - 2, this.floorY - 22, 40, 22);
    // A few wares on the counter
    stall.fillStyle(0xf2c14e, 1);
    stall.fillCircle(this.nibsX + 8, this.floorY - 24, 4);
    stall.fillCircle(this.nibsX + 18, this.floorY - 25, 3);
    stall.fillStyle(0xd4d4c8, 1);
    stall.fillCircle(this.nibsX + 30, this.floorY - 23, 3.5);

    // A pile of litter/newspaper against the wall
    this.litterX = 350;
    const litter = this.add.graphics();
    litter.fillStyle(0x3a3428, 1);
    litter.fillEllipse(this.litterX, this.floorY - 6, 34, 14);
    litter.fillStyle(0x4a4438, 1);
    litter.fillTriangle(
      this.litterX - 14, this.floorY - 4,
      this.litterX - 2, this.floorY - 18,
      this.litterX + 6, this.floorY - 6,
    );
    litter.lineStyle(1, 0x2a2418, 0.6);
    litter.lineBetween(this.litterX - 10, this.floorY - 10, this.litterX + 2, this.floorY - 6);
    litter.lineBetween(this.litterX - 6, this.floorY - 14, this.litterX + 4, this.floorY - 4);

    // The turnstile: a coin-slot gate blocking the way to the platforms
    this.turnstileX = width * 0.78;
    const gateTop = this.floorY - 70;

    // A dark tunnel glimpsed beyond the gate — drawn first so the turnstile
    // itself (post, arm, slot, sign) always renders in front of it.
    this.add.rectangle(this.turnstileX + 34, gateTop, width - (this.turnstileX + 34), this.floorY - gateTop, 0x03050a);

    const post = this.add.graphics();
    post.fillStyle(0x1a2432, 1);
    post.fillRect(this.turnstileX - 30, height * 0.22, 60, this.floorY - height * 0.22);
    post.fillStyle(0x0a0e14, 1);
    post.fillRect(this.turnstileX - 20, gateTop, 40, this.floorY - gateTop);

    this.turnstileArm = this.add.graphics();
    this._drawTurnstileArm(0);

    const slot = this.add.graphics();
    slot.fillStyle(0x2a3648, 1);
    slot.fillRoundedRect(this.turnstileX - 5, gateTop + 14, 10, 5, 1.5);

    this.add
      .text(this.turnstileX, gateTop - 14, 'PLATFORMS ->', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#8fa8bc',
      })
      .setOrigin(0.5);

    // Ceiling lamp glow
    const glow = this.add.circle(width * 0.5, height * 0.18, 90, 0xfff3c0, 0.05);
    this.tweens.add({ targets: glow, alpha: 0.09, duration: 1800, yoyo: true, repeat: -1 });
  }

  _drawTurnstileArm(rotationDeg) {
    this.turnstileArm.clear();
    const g = this.turnstileArm;
    const cx = this.turnstileX;
    const cy = this.floorY - 30;
    g.lineStyle(3, 0x3a5c82, 1);
    for (let i = 0; i < 3; i += 1) {
      const rad = Phaser.Math.DegToRad(rotationDeg + i * 120);
      g.lineBetween(cx, cy, cx + Math.cos(rad) * 16, cy + Math.sin(rad) * 16);
    }
    g.fillStyle(0x1a2432, 1);
    g.fillCircle(cx, cy, 3.5);
  }

  _setupHotspots(width, height) {
    this.canExplore = false;

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

    makeZone(this.posterX, this.floorY - 50, 50, 90, this.posterX - 24, () => this._lookPoster());
    makeZone(this.nibsX + 18, this.floorY - 20, 60, 50, this.nibsX - 20, () => this._talkNibs());
    this.litterZone = makeZone(this.litterX, this.floorY - 10, 44, 30, this.litterX - 24, () => this._searchLitter());
    makeZone(this.turnstileX, this.floorY - 35, 50, 80, this.turnstileX - 40, () => this._useTurnstile());

    this._litterHint = this.add.circle(this.litterX, this.floorY - 30, 4, 0xfff3c0, 0.9).setDepth(5);
    this.tweens.add({ targets: this._litterHint, y: '-=8', alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  async _runHotspot(walkX, onInteract) {
    this._busyAction = true;
    await this.player.walkTo(walkX, this.floorY - 6);
    await onInteract();
    this._busyAction = false;
  }

  async _runOpening() {
    await this._wait(500);
    await this.dialogBox.say('Whisker', "Bit warmer down here, at least. And bigger than it looked from the street.", '#e8e2c8');

    await this._wait(300);
    await this.dialogBox.say('Nibs', "Oi! Don't see many burrow-mice down this far.", '#f0d8b0');
    await this.dialogBox.say('Whisker', "Just passing through. Trying to reach the platforms.", '#e8e2c8');
    await this.dialogBox.say('Nibs', "Through there? Not without feeding the turnstile — LeCheddar's rule, not mine.", '#f0d8b0');
    await this.dialogBox.say('Whisker', "...Feeding it?", '#e8e2c8');
    await this.dialogBox.say(
      'Nibs',
      "Coin-slot. Rigged up by his lot. Don't think it checks too closely what you feed it, mind, so long as it shines.",
      '#f0d8b0',
    );
    await this.dialogBox.say('Whisker', "Right. I'll have a look around.", '#e8e2c8');

    this.canExplore = true;
  }

  async _lookPoster() {
    await this.dialogBox.say(
      'Whisker',
      "\"WANTED: LeCheddar. Approach with caution, and possibly cheese.\" ...Encouraging.",
      '#e8e2c8',
    );
  }

  async _talkNibs() {
    const lines = [
      "Careful down them platforms. Toll or no toll.",
      "Business is business. I don't ask where the coin comes from.",
      "Lost a good bottle cap round here somewhere. Shame, that.",
    ];
    const line = lines[Math.min(this._nibsLineIndex || 0, lines.length - 1)];
    this._nibsLineIndex = (this._nibsLineIndex || 0) + 1;
    await this.dialogBox.say('Nibs', line, '#f0d8b0');
  }

  async _searchLitter() {
    if (this._litterSearched) {
      await this.dialogBox.say('Whisker', "Nothing else worth grabbing in there.", '#e8e2c8');
      return;
    }
    this._litterSearched = true;
    this._litterHint.destroy();
    await this.dialogBox.say('Whisker', "Just rubbish— oh, hello.", '#e8e2c8');
    this.inventory.add(ITEMS.bottleCap);
    await this.dialogBox.say('Whisker', "A bottle cap. Might just shine enough for that turnstile.", '#e8e2c8');
  }

  async _useTurnstile() {
    if (this._turnstileOpen) {
      await this.dialogBox.say('Whisker', "The way through's already open.", '#e8e2c8');
      return;
    }

    const selected = this.inventory.getSelectedId();
    if (selected !== 'bottleCap') {
      await this.dialogBox.say('Whisker', "Locked tight. I'd need something to feed it — something that shines.", '#e8e2c8');
      return;
    }

    this._turnstileOpen = true;
    this.inventory.remove('bottleCap');
    await this.dialogBox.say('Whisker', "Here goes nothing.", '#e8e2c8', 1200);

    this.tweens.addCounter({
      from: 0,
      to: 150,
      duration: 500,
      onUpdate: (tween) => this._drawTurnstileArm(tween.getValue()),
    });
    await this._wait(600);
    await this.dialogBox.say('Nibs', "Ha! Knew you had it in you. Mind the tracks down there!", '#f0d8b0');

    await this.player.walkTo(this.turnstileX + 10, this.floorY - 6);
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.time.delayedCall(750, () => this.scene.start('PlatformScene'));
  }

  _wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }
}
