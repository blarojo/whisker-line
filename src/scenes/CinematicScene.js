// CinematicScene.js
//
// The mandatory cold open, in the spirit of The Secret of Monkey Island's
// famous title sequence: a painterly establishing shot the player has to
// sit through before reaching the menu, drifting cartoon clouds included,
// an old-timer telling a story by firelight on a high perch, and a runner
// darting through the scene below. Ours swaps MI1's Mêlée Island dock for
// a dusk skyline of London — the London Eye, the Gherkin, the Shard — and
// Guybrush's silhouette for Whisker's; the old sea captain spinning ghost
// stories becomes an old mouse spinning tunnel legends from atop the
// Gherkin.
//
// No actual Monkey Island art, footage, or music is used here — see "On
// art and audio assets" in docs/architecture-guide.md. The score is the
// same original chiptune theme used on the menu that follows this scene.

import { ChiptuneComposer } from '../audio/ChiptuneComposer.js';

export class CinematicScene extends Phaser.Scene {
  constructor() {
    super('CinematicScene');
  }

  create() {
    const { width, height } = this.scale;
    this._started = false;

    // Gate on a user gesture first (browsers won't allow audio otherwise),
    // styled as a plain "click to begin" black screen — the only input
    // this scene accepts until the cinematic has fully played out.
    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0).setDepth(0);
    const startPrompt = this.add
      .text(width / 2, height / 2, 'Click or press any key to begin', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(100);
    this.tweens.add({
      targets: startPrompt,
      alpha: { from: 0.3, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    this.composer = new ChiptuneComposer(this.sound.context);

    const begin = () => {
      if (this._started) return;
      this._started = true;
      if (this.sound.context.state === 'suspended') this.sound.context.resume();
      this.composer.start();
      startPrompt.destroy();
      this._playCinematic(width, height);
    };
    this.input.once('pointerdown', begin);
    this.input.keyboard.once('keydown', begin);
  }

  _playCinematic(width, height) {
    // Dusk sky gradient
    const sky = this.add.graphics().setDepth(1);
    sky.fillGradientStyle(0x1a1440, 0x1a1440, 0x4a2f4d, 0x8a5a4a, 1);
    sky.fillRect(0, 0, width, height * 0.72);

    // Riverside ground band
    this.add.rectangle(0, height * 0.72, width, height * 0.28, 0x0a0812).setOrigin(0, 0).setDepth(1);
    const river = this.add.graphics().setDepth(1);
    river.fillStyle(0x1c2340, 1);
    river.fillRect(0, height * 0.74, width, height * 0.08);
    for (let x = 0; x < width; x += 40) {
      river.fillStyle(0x3a3f66, 0.5);
      river.fillRect(x, height * 0.76 + Phaser.Math.Between(-3, 3), 22, 2);
    }

    // Drifting cartoon clouds — two parallax layers, à la Monkey Island's
    // cold open sky.
    this._addClouds(width, height, 3, 18000, 0.85);
    this._addClouds(width, height, 2, 28000, 0.6);

    // The skyline: London Eye, the Gherkin (with its fireside storyteller),
    // and the Shard.
    this._drawLondonEye(width * 0.18, height * 0.72, 62);
    this._drawShard(width * 0.66, height * 0.72, 58, 230);
    this._drawGherkin(width * 0.44, height * 0.72, 44, 150);

    // Whisker's silhouette, dashing around the riverside street below.
    this._runMouseAround(width, height);

    // Film-style narration captions, then hand control to the player.
    this._playCaptions(width, height, () => this._showContinuePrompt(width, height));
  }

  _addClouds(width, height, count, baseDuration, alpha) {
    for (let i = 0; i < count; i += 1) {
      const cloud = this.add.container(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(20, height * 0.28),
      );
      const g = this.add.graphics();
      g.fillStyle(0xe8e2f0, alpha);
      const puffs = 4 + Math.floor(Math.random() * 2);
      for (let p = 0; p < puffs; p += 1) {
        g.fillEllipse(p * 26 - puffs * 12, Phaser.Math.Between(-5, 5), 40, 22);
      }
      cloud.add(g);
      cloud.setDepth(2);
      const duration = Phaser.Math.Between(baseDuration * 0.8, baseDuration * 1.2);
      this.tweens.add({
        targets: cloud,
        x: width + 140,
        duration,
        repeat: -1,
        onRepeat: () => {
          cloud.x = -140;
        },
      });
    }
  }

  _drawLondonEye(cx, groundY, radius) {
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(3, 0x140f28, 0.9);
    g.strokeCircle(cx, groundY - radius, radius);
    for (let a = 0; a < 360; a += 30) {
      const rad = Phaser.Math.DegToRad(a);
      g.lineBetween(
        cx,
        groundY - radius,
        cx + Math.cos(rad) * radius,
        groundY - radius + Math.sin(rad) * radius,
      );
    }
    g.lineStyle(4, 0x140f28, 0.9);
    g.lineBetween(cx, groundY, cx, groundY - radius * 2 + 8);
    g.lineBetween(cx - radius * 0.5, groundY, cx + radius * 0.5, groundY);
  }

  _drawShard(cx, groundY, halfWidth, spireHeight) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x140f28, 1);
    g.beginPath();
    g.moveTo(cx - halfWidth, groundY);
    g.lineTo(cx - halfWidth * 0.15, groundY - spireHeight);
    g.lineTo(cx + halfWidth * 0.1, groundY - spireHeight * 0.94);
    g.lineTo(cx + halfWidth, groundY);
    g.closePath();
    g.fillPath();
  }

  _drawGherkin(cx, groundY, halfWidth, towerHeight) {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0x140f28, 1);
    g.fillRect(cx - halfWidth, groundY - towerHeight * 0.72, halfWidth * 2, towerHeight * 0.72);
    g.fillEllipse(cx, groundY - towerHeight * 0.72, halfWidth * 2, halfWidth * 1.3);
    g.fillTriangle(
      cx - halfWidth * 0.85,
      groundY - towerHeight * 0.78,
      cx + halfWidth * 0.85,
      groundY - towerHeight * 0.78,
      cx,
      groundY - towerHeight,
    );

    // Campfire glow, and the old mouse storyteller at the very top — our
    // nod to the old sea captain telling ghost stories by firelight in
    // Monkey Island 1's opening.
    const fireY = groundY - towerHeight - 8;
    const glow = this.add.circle(cx, fireY, 24, 0xffae3d, 0.18).setDepth(2);
    this.tweens.add({
      targets: glow,
      alpha: 0.32,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const fg = this.add.graphics().setDepth(3);
    fg.fillStyle(0xff8c2e, 1);
    fg.fillTriangle(cx - 4, fireY + 5, cx + 4, fireY + 5, cx, fireY - 7);
    fg.fillStyle(0xffd35c, 1);
    fg.fillTriangle(cx - 2, fireY + 5, cx + 2, fireY + 5, cx, fireY - 2);

    // The old mouse, seated, cane in paw, ears just visible — a silhouette
    // so simple it reads at any size.
    fg.fillStyle(0x0d0a18, 1);
    fg.fillEllipse(cx - 14, fireY + 5, 13, 9);
    fg.fillCircle(cx - 17, fireY - 3, 5);
    fg.fillCircle(cx - 20, fireY - 7, 2);
    fg.fillCircle(cx - 15, fireY - 8, 2);
    fg.fillRect(cx - 21, fireY - 7, 1.6, 8);

    for (let i = 0; i < 3; i += 1) {
      const smoke = this.add.circle(cx, fireY - 10 - i * 6, 2 + i, 0xcccccc, 0.15).setDepth(3);
      this.tweens.add({
        targets: smoke,
        y: smoke.y - 22,
        alpha: 0,
        duration: 3000 + i * 400,
        repeat: -1,
        delay: i * 600,
      });
    }
  }

  _runMouseAround(width, height) {
    const groundY = height * 0.9;
    const mouseSil = this.add.ellipse(-20, groundY, 16, 9, 0x000000).setDepth(4);
    const runOnce = (fromX, toX, dur, delay) => {
      this.tweens.add({
        targets: mouseSil,
        x: { from: fromX, to: toX },
        duration: dur,
        delay,
        ease: 'Sine.easeInOut',
      });
    };
    // A few criss-crossing dashes, so Whisker feels like he's darting all
    // over the riverside while the story unfolds above him.
    runOnce(-20, width * 0.55, 3200, 500);
    runOnce(width * 0.55, width * 0.12, 2600, 3900);
    runOnce(width * 0.12, width * 0.82, 3400, 6700);
    runOnce(width * 0.82, width * 0.35, 2600, 10300);
    runOnce(width * 0.35, width + 20, 3000, 13100);
  }

  _playCaptions(width, height, onDone) {
    const lines = [
      "Far below London's streets...",
      '...runs a line only the smallest feet can walk.',
      'They call it... the Whisker Line.',
    ];
    const caption = this.add
      .text(width / 2, height - 56, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontStyle: 'italic',
        color: '#f2ead6',
        align: 'center',
        wordWrap: { width: width - 140 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(50);

    let t = 1200;
    const perLine = 3400;
    lines.forEach((line) => {
      this.time.delayedCall(t, () => {
        caption.setText(line);
        this.tweens.add({ targets: caption, alpha: 1, duration: 500 });
      });
      this.time.delayedCall(t + perLine - 500, () => {
        this.tweens.add({ targets: caption, alpha: 0, duration: 500 });
      });
      t += perLine;
    });

    this.time.delayedCall(t + 500, onDone);
  }

  _showContinuePrompt(width, height) {
    const prompt = this.add
      .text(width / 2, height - 32, 'Press ENTER to continue', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.3, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const advance = () => {
      this.composer.stop();
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () => this.scene.start('MenuScene'));
    };

    this.input.keyboard.once('keydown-ENTER', advance);
    this.input.once('pointerdown', advance);
  }
}
