// Items.js
//
// Shared inventory item definitions: an id, a display name, flavor text for
// a "look at" response, and a small procedural icon-drawing function (kept
// in the same hand-drawn vector style as everything else — see "On art and
// audio assets" in docs/architecture-guide.md).

export const ITEMS = {
  bottleCap: {
    id: 'bottleCap',
    name: 'Bottle Cap',
    description: "A dented bottle cap. Shiny enough to pass for a coin, if the turnstile doesn't look too closely.",
    draw(scene, container, size) {
      const g = scene.add.graphics();
      g.fillStyle(0xc0c8cc, 1);
      g.fillCircle(0, 0, size / 2);
      g.lineStyle(1.5, 0x6a7278, 1);
      g.strokeCircle(0, 0, size / 2);
      g.lineStyle(1, 0x8a9298, 0.8);
      for (let a = 0; a < 360; a += 45) {
        const rad = Phaser.Math.DegToRad(a);
        g.lineBetween(0, 0, Math.cos(rad) * size * 0.4, Math.sin(rad) * size * 0.4);
      }
      g.fillStyle(0xe8eef0, 0.7);
      g.fillCircle(-size * 0.15, -size * 0.15, size * 0.12);
      container.add(g);
    },
  },
  matchstick: {
    id: 'matchstick',
    name: 'Matchstick',
    description: 'A single unlit matchstick. Sturdy enough to wedge something open.',
    draw(scene, container, size) {
      const g = scene.add.graphics();
      g.lineStyle(2.4, 0xcfa96a, 1);
      g.lineBetween(0, size * 0.35, 0, -size * 0.2);
      g.fillStyle(0xaa3020, 1);
      g.fillCircle(0, -size * 0.28, 4);
      g.fillStyle(0xd8654a, 0.8);
      g.fillCircle(-1, -size * 0.32, 1.6);
      container.add(g);
    },
  },
};
