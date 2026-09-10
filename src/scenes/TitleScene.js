// TitleScene.js
//
// The cold open, styled after The Secret of Monkey Island's title card: a
// quiet moonlit scene fading into the game's logo over an original musical
// theme, with a prompt to click/press a key to begin. No actual Monkey
// Island art or music is used — see "On art and audio assets" in
// docs/architecture-guide.md.

import { ChiptuneComposer } from '../audio/ChiptuneComposer.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const { width, height } = this.scale;
    this._starting = false;

    // Night sky
    this.add.rectangle(0, 0, width, height, 0x0b0c1a).setOrigin(0, 0);

    // Twinkling stars
    for (let i = 0; i < 40; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.55);
      const star = this.add.rectangle(
        x,
        y,
        1,
        1,
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 1),
      );
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Moon
    this.add.circle(width - 40, 30, 14, 0xfff6d8);
    this.add.circle(width - 40, 30, 14).setStrokeStyle(1, 0xe4d9a8, 0.4);

    // Distant skyline of the high street
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0a0812, 1);
    let sx = 0;
    while (sx < width) {
      const w = Phaser.Math.Between(18, 34);
      const h = Phaser.Math.Between(20, 46);
      skyline.fillRect(sx, height * 0.55 - h, w, h);
      sx += w + Phaser.Math.Between(0, 4);
    }

    // Foreground ground
    this.add.rectangle(0, height * 0.55, width, height * 0.45, 0x050406).setOrigin(0, 0);

    // A small mouse silhouette scurrying across the foreground — a nod to
    // Guybrush's silhouette walk in the Monkey Island 1 cold open.
    const mouseSil = this.add.ellipse(-10, height * 0.55 + 6, 10, 6, 0x000000);
    this.tweens.add({
      targets: mouseSil,
      x: width + 10,
      duration: 6000,
      delay: 1500,
      repeat: -1,
      onRepeat: () => {
        mouseSil.x = -10;
      },
    });

    // Title text
    const title = this.add
      .text(width / 2, height * 0.28, 'WHISKER LINE', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '26px',
        color: '#f2e6c9',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const subtitle = this.add
      .text(width / 2, height * 0.28 + 22, "LeCheddar's Revenge", {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '12px',
        color: '#c98a3a',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 1800, delay: 400 });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1800, delay: 900 });

    const prompt = this.add
      .text(width / 2, height - 20, 'Click or press any key to begin', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.2, to: 1 },
      duration: 900,
      delay: 1600,
      yoyo: true,
      repeat: -1,
    });

    // Original title theme — see docs/architecture-guide.md for why this
    // is a synthesized score rather than the real Monkey Island music.
    this.composer = new ChiptuneComposer(this.sound.context);
    if (this.sound.context.state === 'running') {
      this.composer.start();
    }

    const beginGame = () => {
      if (this._starting) return;
      this._starting = true;
      if (this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
      this.composer.start();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => {
        this.composer.stop();
        this.scene.start('IntroScene');
      });
    };

    this.input.once('pointerdown', beginGame);
    this.input.keyboard.once('keydown', beginGame);
  }
}
