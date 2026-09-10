// MenuScene.js
//
// The main menu, reached after the mandatory cold-open cinematic
// (CinematicScene). Deliberately minimal, in the spirit of a classic
// adventure-game title card: the logo over a moonlit skyline, and exactly
// one way in — Start Game.

import { ChiptuneComposer } from '../audio/ChiptuneComposer.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;
    this._starting = false;
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Night sky
    this.add.rectangle(0, 0, width, height, 0x0b0c1a).setOrigin(0, 0);

    for (let i = 0; i < 50; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.55);
      const star = this.add.rectangle(x, y, 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Moon
    this.add.circle(width - 80, 60, 28, 0xfff6d8);
    this.add.circle(width - 80, 60, 28).setStrokeStyle(2, 0xe4d9a8, 0.4);

    // Distant skyline of the high street
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0a0812, 1);
    let sx = 0;
    while (sx < width) {
      const w = Phaser.Math.Between(36, 68);
      const h = Phaser.Math.Between(40, 92);
      skyline.fillRect(sx, height * 0.55 - h, w, h);
      sx += w + Phaser.Math.Between(0, 8);
    }

    // Foreground ground
    this.add.rectangle(0, height * 0.55, width, height * 0.45, 0x050406).setOrigin(0, 0);

    // A small mouse silhouette scurrying across the foreground
    const mouseSil = this.add.ellipse(-20, height * 0.55 + 12, 20, 12, 0x000000);
    this.tweens.add({
      targets: mouseSil,
      x: width + 20,
      duration: 6000,
      delay: 1500,
      repeat: -1,
      onRepeat: () => {
        mouseSil.x = -20;
      },
    });

    // Title text
    this.add
      .text(width / 2, height * 0.28, 'WHISKER LINE', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '52px',
        color: '#f2e6c9',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.28 + 44, "LeCheddar's Revenge", {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '24px',
        color: '#c98a3a',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const startOption = this.add
      .text(width / 2, height * 0.72, 'START GAME', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: startOption,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // The cinematic before this scene already unlocked audio with a user
    // gesture, so the score can keep playing straight through into the
    // menu without asking for another click.
    this.composer = new ChiptuneComposer(this.sound.context);
    if (this.sound.context.state === 'running') this.composer.start();

    const beginGame = () => {
      if (this._starting) return;
      this._starting = true;
      if (this.sound.context.state === 'suspended') this.sound.context.resume();
      this.composer.start();
      startOption.setColor('#ffe89a');
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(650, () => {
        this.composer.stop();
        this.scene.start('IntroScene');
      });
    };

    startOption.on('pointerdown', beginGame);
    this.input.keyboard.once('keydown-ENTER', beginGame);
  }
}
