// StationConcourseScene.js
//
// Placeholder for Scene 2 (see docs/argument.md — "Station Concourse").
// Whisker has just gone down into the tube; the ticket hall itself isn't
// built yet, so this scene exists to close the loop on Scene 1 and give
// something to look at, rather than a hard stop or a blank screen.

export class StationConcourseScene extends Phaser.Scene {
  constructor() {
    super('StationConcourseScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(900, 0, 0, 0);

    this.add.rectangle(0, 0, width, height, 0x08090c).setOrigin(0, 0);

    // A few receding half-lit tile frames, suggesting a tunnel disappearing
    // into the dark ahead of Whisker.
    const tiles = this.add.graphics();
    for (let i = 0; i < 6; i += 1) {
      const t = i / 5;
      const scale = 1 - i * 0.13;
      const w = 320 * scale;
      const h = 180 * scale;
      const shade = Math.floor(20 + t * 15);
      tiles.fillStyle(Phaser.Display.Color.GetColor(shade, shade + 4, shade + 6), 1);
      tiles.fillRect(width / 2 - w / 2, height / 2 - h / 2, w, h);
    }

    this.add
      .text(width / 2, height * 0.3, 'THE WHISKER LINE', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#e8dcc0',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.44, 'Ticket Hall — beyond this point,\nthe tunnels are still being dug.', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9aa0a8',
        align: 'center',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height - 40, 'Press any key to return to the menu', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#666666',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.3, to: 0.9 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () => this.scene.start('MenuScene'));
    });
  }
}
