// Mouse.js
//
// Whisker, our hero: a small procedurally-drawn mouse (no external art
// assets — see "On art and audio assets" in docs/architecture-guide.md)
// with basic click-to-walk movement and a walk wobble.

export class Mouse {
  constructor(scene, x, y) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.container.setDepth(10);
    this.facing = 1; // 1 = facing right, -1 = facing left
    this._walkTween = null;
    this._bobTween = null;
    this._draw();
  }

  _draw() {
    const g = this.scene.add.graphics();
    const body = 0x8d8478;
    const belly = 0xd8cfc0;
    const ear = 0xc9a8a0;
    const outline = 0x2b2420;

    // Tail
    g.lineStyle(1, outline, 1);
    g.beginPath();
    g.moveTo(-4, -1);
    g.lineTo(-9, 3);
    g.lineTo(-7, 6);
    g.strokePath();

    // Body
    g.fillStyle(body, 1);
    g.fillEllipse(0, 0, 14, 9);
    g.lineStyle(1, outline, 1);
    g.strokeEllipse(0, 0, 14, 9);

    // Belly
    g.fillStyle(belly, 1);
    g.fillEllipse(1, 2, 8, 5);

    // Head
    g.fillStyle(body, 1);
    g.fillCircle(7, -3, 5);
    g.strokeCircle(7, -3, 5);

    // Ears
    g.fillStyle(ear, 1);
    g.fillCircle(4, -7, 2.6);
    g.strokeCircle(4, -7, 2.6);
    g.fillCircle(9, -7, 2.6);
    g.strokeCircle(9, -7, 2.6);

    // Snout + nose
    g.fillStyle(body, 1);
    g.fillCircle(11, -2, 2.2);
    g.fillStyle(0x3a2c28, 1);
    g.fillCircle(13, -2, 0.9);

    // Eye
    g.fillStyle(0x1a1512, 1);
    g.fillCircle(8, -4, 0.9);

    // Legs (simple stubs)
    g.fillStyle(outline, 1);
    g.fillRect(-3, 4, 2, 3);
    g.fillRect(3, 4, 2, 3);

    this.container.add(g);
    this.graphics = g;
  }

  setFlip(facing) {
    this.facing = facing;
    this.container.setScale(facing, 1);
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }

  /** Walk to a target position. Resolves once the walk finishes. */
  walkTo(targetX, targetY, speed = 55) {
    return new Promise((resolve) => {
      if (this._walkTween) this._walkTween.stop();
      if (this._bobTween) this._bobTween.stop();

      const dx = targetX - this.container.x;
      if (Math.abs(dx) > 1) this.setFlip(dx > 0 ? 1 : -1);

      const dist = Phaser.Math.Distance.Between(
        this.container.x,
        this.container.y,
        targetX,
        targetY,
      );
      const duration = Math.max((dist / speed) * 1000, 1);

      this._bobTween = this.scene.tweens.add({
        targets: this.container,
        angle: { from: -3, to: 3 },
        duration: 130,
        yoyo: true,
        repeat: -1,
      });

      this._walkTween = this.scene.tweens.add({
        targets: this.container,
        x: targetX,
        y: targetY,
        duration,
        ease: 'Linear',
        onComplete: () => {
          if (this._bobTween) {
            this._bobTween.stop();
            this._bobTween = null;
          }
          this.container.angle = 0;
          resolve();
        },
      });
    });
  }
}
