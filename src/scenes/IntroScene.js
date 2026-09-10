// IntroScene.js
//
// Scene 1 — "The Note" (see docs/argument.md). Whisker is outside his
// burrow on the Seven Sisters high street when a defecting rat messenger
// warns him that LeCheddar's crew has raided his burrow and taken his
// sister. The scene ends with the player sending Whisker into the tube
// station to follow the only lead he has.
//
// The station frontage below is an original pixel-art interpretation of
// Seven Sisters station's ticket hall entrance (brick-and-glass frontage,
// Underground roundel signage) — not a traced photograph. See "On art and
// audio assets" in docs/architecture-guide.md.

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

    // Station frontage: brick-and-glass box with a lit roundel
    this.stationDoorX = width * 0.72;
    const doorW = 108;
    const doorX = this.stationDoorX - doorW / 2;
    const doorTop = height * 0.3;
    const doorBottom = height * 0.7;

    wall.fillStyle(0x241a1c, 1);
    wall.fillRect(doorX - 12, doorTop - 12, doorW + 24, doorBottom - doorTop + 12);

    // Glass doors, lit from inside
    wall.fillStyle(0x9fd8d0, 0.5);
    wall.fillRect(doorX, doorTop + 16, doorW, doorBottom - doorTop - 16);
    wall.lineStyle(2, 0x1a1210, 1);
    wall.strokeRect(doorX, doorTop + 16, doorW, doorBottom - doorTop - 16);
    wall.lineBetween(this.stationDoorX, doorTop + 16, this.stationDoorX, doorBottom);

    // Roundel sign above the doors
    const roundel = this.add.graphics();
    roundel.fillStyle(0x0d4a2e, 1);
    roundel.fillRect(doorX - 8, doorTop - 32, doorW + 16, 24);
    roundel.lineStyle(4, 0xcc2b2b, 1);
    roundel.strokeCircle(this.stationDoorX, doorTop - 20, 11);
    roundel.fillStyle(0xcc2b2b, 1);
    roundel.fillRect(this.stationDoorX - 16, doorTop - 22, 32, 4.8);

    this.add
      .text(this.stationDoorX, doorTop - 52, 'SEVEN SISTERS', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#eae2c8',
      })
      .setOrigin(0.5);

    // Pavement
    this.add.rectangle(0, height * 0.72, width, height * 0.28, 0x0c0d10).setOrigin(0, 0);
    const pave = this.add.graphics();
    pave.lineStyle(1, 0x000000, 0.4);
    for (let x = 0; x < width; x += 32) {
      pave.lineBetween(x, height * 0.72, x, height);
    }

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
    const glow = this.add.circle(this.stationDoorX, doorTop - 60, 60, 0xfff3c0, 0.06);
    this.tweens.add({ targets: glow, alpha: 0.1, duration: 1600, yoyo: true, repeat: -1 });
  }

  async _runOpening() {
    await this._wait(600);
    await this.dialogBox.say(
      'Whisker',
      "Just me, the night air, and a good bit of cheddar. Can't complain.",
      '#e8e2c8',
    );

    // Rat messenger scurries in from the right
    const messenger = this.add.container(this.scale.width + 40, this.scale.height - 80);
    const mg = this.add.graphics();
    mg.fillStyle(0x5a4a42, 1);
    mg.fillEllipse(0, 0, 32, 18);
    mg.fillCircle(16, -6, 9);
    mg.fillStyle(0x2a1e1a, 1);
    mg.fillCircle(22, -6, 1.8);
    messenger.add(mg);
    messenger.setDepth(9);

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

    this.tweens.add({ targets: messenger, x: this.scale.width + 40, duration: 800, delay: 200 });
    await this.dialogBox.say('Ratty', "I have to go before they notice I've gone. Be careful, Whisker.", '#c9b9a8');
    await this._wait(900);
    messenger.destroy();

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
