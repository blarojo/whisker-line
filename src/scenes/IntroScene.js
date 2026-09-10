// IntroScene.js
//
// Scene 1 — "The Note" (see docs/argument.md). Whisker is outside his
// burrow on the Seven Sisters high street when a defecting rat messenger
// warns him that LeCheddar's crew has raided his burrow and taken his
// sister. The scene ends with the player sending Whisker into the tube
// station to follow the only lead he has.
//
// The station entrance below is an original illustration of the real Seven
// Sisters subway entrance's actual layout — a sunken staircase framed by
// blue guard railings, a "SEVEN SISTERS STATION" sign over the stairs, and
// the classic freestanding "UNDERGROUND / SUBWAY" roundel sign beside it —
// rather than a traced photograph. See "On art and audio assets" in
// docs/architecture-guide.md.

import { Mouse } from '../entities/Mouse.js';
import { DialogBox } from '../ui/DialogBox.js';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(700, 0, 0, 0);
    this._entering = false;
    this.canEnterStation = false;

    this._drawBackground(width, height);

    this.dialogBox = new DialogBox(this);
    this.player = new Mouse(this, this.burrowX + 78, height - 92);
    this.player.setFlip(1);

    this.stationHotspot = this.add
      .zone(this.stationDoorX, height * 0.55, 60, height * 0.35)
      .setOrigin(0.5, 0.5);

    this.input.on('gameobjectdown', (_pointer, obj) => {
      if (obj === this.stationHotspot && this.canEnterStation) {
        this._enterStation();
      }
    });

    this._runOpening();
  }

  _drawBackground(width, height) {
    // Night sky
    this.add.rectangle(0, 0, width, height, 0x141626).setOrigin(0, 0);

    // Brick terrace backdrop — the high street
    const wall = this.add.graphics();
    wall.fillStyle(0x3a2a28, 1);
    wall.fillRect(0, height * 0.35, width, height * 0.37);
    wall.lineStyle(1, 0x2a1c1a, 0.6);
    for (let y = height * 0.35; y < height * 0.72; y += 12) {
      wall.lineBetween(0, y, width, y);
    }

    // The station entrance: a sunken staircase down from street level,
    // framed by blue guard railings — the real Seven Sisters entrance is a
    // subway stair, not a shopfront-style building.
    this.stationDoorX = width * 0.74;
    const groundY = height * 0.72;
    const pitHalfW = 46;
    const pitTop = groundY;
    const pitBottom = height;

    // Pavement (drawn here so the stairwell pit can cut into it)
    this.add.rectangle(0, groundY, width, height - groundY, 0x1a1c22).setOrigin(0, 0);
    const pave = this.add.graphics();
    pave.lineStyle(1, 0x000000, 0.35);
    for (let x = 0; x < width; x += 32) {
      pave.lineBetween(x, groundY, x, height);
    }

    // The stairwell itself: tiled side walls around a dark stair shaft,
    // with a handful of receding step-lines fading into the dark.
    const pit = this.add.graphics();
    pit.fillStyle(0xced8d6, 1);
    pit.fillRect(this.stationDoorX - pitHalfW, pitTop, pitHalfW * 2, pitBottom - pitTop);
    pit.fillStyle(0x05070a, 1);
    pit.fillTriangle(
      this.stationDoorX - pitHalfW + 6, pitTop,
      this.stationDoorX + pitHalfW - 6, pitTop,
      this.stationDoorX, pitBottom,
    );
    pit.lineStyle(1.5, 0x39424a, 0.8);
    for (let s = 1; s <= 5; s += 1) {
      const t = s / 6;
      const y = Phaser.Math.Linear(pitTop, pitBottom, t);
      const w = Phaser.Math.Linear(pitHalfW * 2 - 12, 4, t);
      pit.lineBetween(this.stationDoorX - w / 2, y, this.stationDoorX + w / 2, y);
    }
    // A soft light spilling up from below
    pit.fillStyle(0x8fd8cc, 0.18);
    pit.fillTriangle(
      this.stationDoorX - 14, pitTop + 10,
      this.stationDoorX + 14, pitTop + 10,
      this.stationDoorX, pitTop + 46,
    );

    // Blue guard railings along both sides of the stairs and across the
    // street-level opening — the entrance's most recognisable feature.
    const rail = this.add.graphics();
    rail.lineStyle(3, 0x1f6fb2, 1);
    rail.lineBetween(this.stationDoorX - pitHalfW - 6, groundY - 22, this.stationDoorX - pitHalfW - 6, groundY + 4);
    rail.lineBetween(this.stationDoorX - pitHalfW - 6, groundY - 22, this.stationDoorX - pitHalfW + 20, groundY - 6);
    rail.lineBetween(this.stationDoorX - pitHalfW + 20, groundY - 6, this.stationDoorX - pitHalfW + 20, groundY + 30);
    rail.lineBetween(this.stationDoorX + pitHalfW + 6, groundY - 22, this.stationDoorX + pitHalfW + 6, groundY + 4);
    rail.lineBetween(this.stationDoorX + pitHalfW + 6, groundY - 22, this.stationDoorX + pitHalfW - 20, groundY - 6);
    rail.lineBetween(this.stationDoorX + pitHalfW - 20, groundY - 6, this.stationDoorX + pitHalfW - 20, groundY + 30);
    rail.lineStyle(2.5, 0x1f6fb2, 1);
    rail.lineBetween(this.stationDoorX - pitHalfW - 6, groundY - 22, this.stationDoorX - 16, groundY - 26);
    rail.lineBetween(this.stationDoorX + pitHalfW + 6, groundY - 22, this.stationDoorX + 16, groundY - 26);

    // "SEVEN SISTERS STATION" sign, mounted right over the stairs.
    const signW = pitHalfW * 2 + 20;
    this.add.rectangle(this.stationDoorX, groundY - 34, signW, 16, 0x0d2a4a).setStrokeStyle(1, 0x05141f);
    this.add
      .text(this.stationDoorX, groundY - 34, 'SEVEN SISTERS STATION', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#eef3f6',
      })
      .setOrigin(0.5);

    // The freestanding "UNDERGROUND / SUBWAY" roundel sign beside the
    // stairs — the single most recognisable part of the real entrance.
    this._drawUndergroundSign(this.stationDoorX - pitHalfW - 46, groundY);

    // Whisker's burrow, opposite the station
    const burrowX = 88;
    this.burrowX = burrowX;
    this.add.ellipse(burrowX, height * 0.72 + 12, 40, 20, 0x0a0806);
    this.add.ellipse(burrowX, height * 0.72 + 12, 28, 12, 0x000000);

    // A crumb of cheese by the burrow
    this.add
      .triangle(burrowX + 32, height * 0.72 + 8, 0, 12, 10, -8, 20, 12, 0xf2c14e)
      .setStrokeStyle(2, 0x8a5a12);

    // A bit of street clutter
    this.add.rectangle(width * 0.45, height * 0.72 - 16, 20, 32, 0x2c3a3a).setStrokeStyle(2, 0x111111);

    // Streetlamp glow near the station
    const glow = this.add.circle(this.stationDoorX, groundY - 60, 60, 0xfff3c0, 0.06);
    this.tweens.add({ targets: glow, alpha: 0.1, duration: 1600, yoyo: true, repeat: -1 });
  }

  /**
   * The freestanding pole sign that marks a subway entrance: a white
   * placard with the red roundel ring and "UNDERGROUND" across it, and a
   * blue "SUBWAY" bar underneath — drawn as our own simplified original
   * illustration of that standard, generic wayfinding sign, not traced
   * from any specific photograph.
   */
  _drawUndergroundSign(x, groundY) {
    const signBottomY = groundY - 70;
    const signTopY = signBottomY - 54;
    const signHalfW = 20;

    const g = this.add.graphics();
    g.fillStyle(0x1f6fb2, 1);
    g.fillRect(x - 2, signBottomY, 4, groundY - signBottomY);

    g.fillStyle(0xf4f4f0, 1);
    g.fillRoundedRect(x - signHalfW, signTopY, signHalfW * 2, signBottomY - signTopY, 3);
    g.lineStyle(1, 0x1a1a1a, 0.4);
    g.strokeRoundedRect(x - signHalfW, signTopY, signHalfW * 2, signBottomY - signTopY, 3);

    const roundelCy = signTopY + 20;
    g.lineStyle(3, 0xcc2b2b, 1);
    g.strokeCircle(x, roundelCy, 14);

    g.fillStyle(0x1f4d8a, 1);
    g.fillRect(x - signHalfW + 3, roundelCy - 4, signHalfW * 2 - 6, 8);
    this.add
      .text(x, roundelCy, 'UNDERGROUND', {
        fontFamily: 'monospace',
        fontSize: '5px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const subwayY = signBottomY - 10;
    g.fillStyle(0x1f4d8a, 1);
    g.fillRect(x - signHalfW + 2, subwayY - 6, signHalfW * 2 - 4, 12);
    this.add
      .text(x, subwayY, 'SUBWAY', {
        fontFamily: 'monospace',
        fontSize: '6px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  async _runOpening() {
    await this._wait(600);
    await this.dialogBox.say(
      'Whisker',
      "Just me, the night air, and a good bit of cheddar. Can't complain.",
      '#e8e2c8',
    );

    // Ratty the messenger scurries in from the right — drawn with the same
    // Mouse rig as Whisker (shaded ears, whiskers, an eye highlight, paws)
    // but in a scruffier, greyer palette so he doesn't just read as a flat
    // brown blob.
    const messenger = new Mouse(this, this.scale.width + 40, this.scale.height - 80, {
      scale: 0.92,
      palette: {
        body: 0x6b5d4d,
        bodyShade: 0x554736,
        belly: 0xb8ab90,
        ear: 0x8a6f5c,
        earInner: 0x4f362c,
        outline: 0x1f1712,
        whisker: 0xcfc4ac,
      },
    });
    messenger.container.setDepth(9);
    messenger.setFlip(-1); // facing left, toward Whisker

    this.tweens.add({
      targets: messenger,
      x: this.player.x + 52,
      duration: 900,
      ease: 'Cubic.easeOut',
    });
    await this._wait(1000);

    await this.dialogBox.say('Ratty', 'Whisker! Thank the tunnels I found you—', '#c9b9a8');
    await this.dialogBox.say(
      'Ratty',
      "LeCheddar's rats hit your burrow while you were out. Took the whole winter store...",
      '#c9b9a8',
    );
    await this.dialogBox.say('Ratty', '...and they took your sister, too. I’m sorry.', '#c9b9a8');

    await this.dialogBox.say('Whisker', 'They took... Pip?', '#e8e2c8');
    await this.dialogBox.say(
      'Ratty',
      "There's a way down through the humans' tube station. LeCheddar's crew use it as a back door.",
      '#c9b9a8',
    );
    await this.dialogBox.say('Ratty', 'Nobody sane goes in there, but... it might be your only way to her.', '#c9b9a8');

    messenger.setFlip(1); // turns to scurry back off the way he came
    this.tweens.add({ targets: messenger, x: this.scale.width + 40, duration: 800, delay: 200 });
    await this.dialogBox.say('Ratty', "I have to go before they notice I've gone. Be careful, Whisker.", '#c9b9a8');
    await this._wait(900);
    messenger.container.destroy();

    await this.dialogBox.say('Whisker', 'Right. Cheese and family. LeCheddar picked the wrong mouse to steal both from.', '#e8e2c8');
    await this.dialogBox.say('Whisker', 'That tube station it is, then.', '#e8e2c8');

    this.canEnterStation = true;
    this.stationHotspot.setInteractive({ useHandCursor: true });
    this._pulseStationHint();
  }

  _pulseStationHint() {
    const hint = this.add.circle(this.stationDoorX, this.scale.height * 0.45, 6, 0xfff3c0, 0.9).setDepth(5);
    this.tweens.add({ targets: hint, y: '-=12', alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  _wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  async _enterStation() {
    if (this._entering) return;
    this._entering = true;
    this.canEnterStation = false;
    this.stationHotspot.disableInteractive();

    await this.player.walkTo(this.stationDoorX - 8, this.scale.height - 92);
    await this.dialogBox.say('Whisker', 'Here goes nothing.', '#e8e2c8', 1200);
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.time.delayedCall(750, () => this.scene.start('StationConcourseScene'));
  }
}
