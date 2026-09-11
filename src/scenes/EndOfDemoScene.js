// EndOfDemoScene.js
//
// Where the currently-built story stops: Whisker has just stepped through
// the grate into LeCheddar's tunnels. Acts 2 and 3 (see docs/argument.md)
// aren't built yet, so this closes the loop with a proper cliffhanger card
// instead of a hard stop or a blank screen — the same role
// StationConcourseScene used to play before Scene 2 was built.

export class EndOfDemoScene extends Phaser.Scene {
  constructor() {
    super('EndOfDemoScene');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(1200, 0, 0, 0);

    this.add.rectangle(0, 0, width, height, 0x03040a).setOrigin(0, 0);

    // A faint receding tunnel, echoing the tube-tunnel motif used elsewhere
    const tiles = this.add.graphics();
    for (let i = 0; i < 6; i += 1) {
      const t = i / 5;
      const scale = 1 - i * 0.13;
      const w = 320 * scale;
      const h = 180 * scale;
      const shade = Math.floor(10 + t * 12);
      tiles.fillStyle(Phaser.Display.Color.GetColor(shade, shade + 2, shade + 5), 1);
      tiles.fillRect(width / 2 - w / 2, height * 0.42 - h / 2, w, h);
    }

    this.add
      .text(width / 2, height * 0.32, 'Whisker steps into the dark.', {
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontStyle: 'italic',
        color: '#e8dcc0',
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.32 + 30, 'Somewhere ahead, the tunnels belong to LeCheddar now.', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#9aa0a8',
        align: 'center',
      })
      .setOrigin(0.5);

    const toBeContinued = this.add
      .text(width / 2, height * 0.62, 'TO BE CONTINUED...', {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#f2e6c9',
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.tweens.add({ targets: toBeContinued, alpha: 1, duration: 1200, delay: 800 });

    const prompt = this.add
      .text(width / 2, height - 32, 'Press any key to return to the menu', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#666666',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: prompt,
      alpha: { from: 0.3, to: 0.9 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      delay: 2000,
    });

    this.input.keyboard.once('keydown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(550, () => this.scene.start('MenuScene'));
    });
  }
}
