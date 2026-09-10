// BootScene.js
//
// Nothing to preload yet — every visual and sound in this prototype is
// generated procedurally in code (see docs/architecture-guide.md) — so
// Boot just hands straight off to the menu. Kept as its own scene so real
// asset preloading has an obvious home once we add any.

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
