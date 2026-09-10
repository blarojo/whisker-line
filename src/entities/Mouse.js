// Mouse.js
//
// A small procedurally-drawn mouse (no external art assets — see "On art
// and audio assets" in docs/architecture-guide.md) with basic click-to-walk
// movement and a walk wobble. Used for Whisker, our hero, and — with a
// different `palette` — for other mouse characters like Ratty the
// messenger, so every mouse in the game gets the same level of detail
// (shaded ears, whiskers, an eye highlight, paws) rather than reusing
// Whisker's exact look or falling back to a flat, textureless blob.

const DEFAULT_PALETTE = {
  body: 0x8d8478,
  bodyShade: 0x716a5f,
  belly: 0xe4dccc,
  ear: 0xc9a8a0,
  earInner: 0xa9787a,
  outline: 0x2b2420,
  whisker: 0xd8d0c0,
};

export class Mouse {
  constructor(scene, x, y, options = {}) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.container.setDepth(10);
    this.facing = 1; // 1 = facing right, -1 = facing left
    this._walkTween = null;
    this._bobTween = null;
    this.baseScale = options.scale || 1;
    this.container.setScale(this.baseScale);
    this._draw(options.palette);
  }

  _draw(palette = {}) {
    const { body, bodyShade, belly, ear, earInner, outline, whisker } = {
      ...DEFAULT_PALETTE,
      ...palette,
    };
    const g = this.scene.add.graphics();

    // Tail — a soft curve instead of a couple of straight segments, so it
    // reads as an actual tail rather than a stick.
    g.lineStyle(1.6, outline, 1);
    g.beginPath();
    g.moveTo(-8, -2);
    g.lineTo(-15, 3);
    g.lineTo(-19, 9);
    g.lineTo(-16, 13);
    g.strokePath();

    // Soft contact shadow under the feet
    g.fillStyle(0x000000, 0.18);
    g.fillEllipse(2, 10, 20, 4);

    // Body base + a darker underside for a little volume/shading
    g.fillStyle(bodyShade, 1);
    g.fillEllipse(0, 2, 28, 17);
    g.fillStyle(body, 1);
    g.fillEllipse(0, -0.5, 28, 17);
    g.lineStyle(1.6, outline, 1);
    g.strokeEllipse(0, 0, 28, 18);

    // Belly
    g.fillStyle(belly, 1);
    g.fillEllipse(2, 4, 16, 9);

    // Back legs / haunches (drawn before the head so the head overlaps them)
    g.fillStyle(body, 1);
    g.fillEllipse(-7, 6, 9, 7);
    g.lineStyle(1.2, outline, 0.8);
    g.strokeEllipse(-7, 6, 9, 7);

    // Head
    g.fillStyle(body, 1);
    g.fillCircle(14, -6, 10);
    g.lineStyle(1.6, outline, 1);
    g.strokeCircle(14, -6, 10);

    // Ears, with a shaded inner ear
    g.fillStyle(ear, 1);
    g.fillCircle(8, -14, 5.2);
    g.lineStyle(1.2, outline, 1);
    g.strokeCircle(8, -14, 5.2);
    g.fillStyle(earInner, 1);
    g.fillCircle(8, -14, 2.6);

    g.fillStyle(ear, 1);
    g.fillCircle(18, -14, 5.2);
    g.lineStyle(1.2, outline, 1);
    g.strokeCircle(18, -14, 5.2);
    g.fillStyle(earInner, 1);
    g.fillCircle(18, -14, 2.6);

    // Snout + nose
    g.fillStyle(body, 1);
    g.fillCircle(22, -4, 4.4);
    g.fillStyle(0x3a2c28, 1);
    g.fillCircle(26, -4, 1.8);
    g.fillStyle(0x6a5850, 1);
    g.fillCircle(25.4, -4.6, 0.6); // tiny nose highlight

    // Eye, with a little shine so it doesn't read as a flat dot
    g.fillStyle(0x1a1512, 1);
    g.fillCircle(16, -8, 1.8);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(16.6, -8.6, 0.6);

    // Whiskers
    g.lineStyle(0.8, whisker, 0.8);
    g.lineBetween(23, -3, 34, -6);
    g.lineBetween(23, -1, 34, -1);
    g.lineBetween(23, 1, 33, 4);

    // Front paws
    g.fillStyle(outline, 1);
    g.fillRoundedRect(-6, 8, 5, 6, 1.5);
    g.fillRoundedRect(6, 8, 5, 6, 1.5);

    this.container.add(g);
    this.graphics = g;
  }

  setFlip(facing) {
    this.facing = facing;
    this.container.setScale(facing * this.baseScale, this.baseScale);
  }

  get x() {
    return this.container.x;
  }

  set x(value) {
    this.container.x = value;
  }

  get y() {
    return this.container.y;
  }

  set y(value) {
    this.container.y = value;
  }

  /** Walk to a target position. Resolves once the walk finishes. */
  walkTo(targetX, targetY, speed = 110) {
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
