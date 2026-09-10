// CinematicScene.js
//
// The mandatory cold open, in the spirit of The Secret of Monkey Island's
// famous title sequence: a painterly establishing shot the player has to
// sit through before reaching the menu, drifting cartoon clouds included,
// an old-timer telling a story by firelight on a high perch, and a runner
// darting through the scene below. Ours swaps MI1's Mêlée Island dock for
// a moonlit skyline of London — the London Eye, the Gherkin, the Shard —
// and Guybrush's silhouette for Whisker's; the old sea captain spinning
// ghost stories becomes an old mouse spinning tunnel legends from atop the
// Gherkin's rooftop lookout. The palette (deep blue night, warm firelight
// glow, soft cloud shading, twinkling points of light) takes its cue from
// that same mood, built from scratch as our own composition and our own
// original mouse character design rather than any traced image.
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

    // The cinematic's visuals start playing immediately — no "click to
    // begin" gate. Audio is a separate story: every major browser refuses
    // to play sound at all until the page has had some user interaction
    // (a hard platform rule, not something a game can opt out of), so
    // there's no way to guarantee music at the literal instant the window
    // loads. What we *can* do is make sure it starts the moment that
    // interaction happens, playing from the very beginning of the loop
    // rather than silently missing its first few bars — so try right away
    // (some browsers do allow it immediately, e.g. after a page reload),
    // and otherwise start on the very first click/key the player makes for
    // any reason.
    this.composer = new ChiptuneComposer(this.sound.context);
    let audioStarted = false;
    const tryStartAudio = () => {
      if (audioStarted) return;
      if (this.sound.context.state === 'running') {
        audioStarted = true;
        this.composer.start();
      } else if (this.sound.context.state === 'suspended') {
        this.sound.context.resume().then(() => {
          if (!audioStarted) {
            audioStarted = true;
            this.composer.start();
          }
        });
      }
    };
    tryStartAudio();
    this.input.on('pointerdown', tryStartAudio);
    this.input.keyboard.on('keydown', tryStartAudio);

    this._playCinematic(width, height);
  }

  _playCinematic(width, height) {
    const horizonY = height * 0.72;

    // Deep midnight-blue sky in three bands, darkest overhead and softening
    // toward the horizon, for a smoother painterly gradient than a single
    // two-stop fill can give.
    const sky = this.add.graphics().setDepth(1);
    sky.fillGradientStyle(0x030410, 0x030410, 0x0c2038, 0x0c2038, 1);
    sky.fillRect(0, 0, width, horizonY * 0.55);
    sky.fillGradientStyle(0x0c2038, 0x0c2038, 0x1f4468, 0x1f4468, 1);
    sky.fillRect(0, horizonY * 0.55, width, horizonY * 0.45);
    // A faint band of atmospheric haze right at the horizon.
    const haze = this.add.graphics().setDepth(1);
    haze.fillGradientStyle(0x4a86ae, 0x4a86ae, 0x4a86ae, 0x4a86ae, 0, 0, 0.4, 0.4);
    haze.fillRect(0, horizonY - height * 0.18, width, height * 0.18);

    this._drawMoon(width * 0.24, height * 0.14, 26);
    this._drawStars(width, horizonY);

    // Riverside ground band
    this.add.rectangle(0, horizonY, width, height * 0.28, 0x05060d).setOrigin(0, 0).setDepth(1);
    const river = this.add.graphics().setDepth(1);
    river.fillStyle(0x14213a, 1);
    river.fillRect(0, height * 0.74, width, height * 0.1);
    for (let x = 0; x < width; x += 34) {
      river.fillStyle(0x4a7aa8, Phaser.Math.FloatBetween(0.15, 0.4));
      river.fillRect(x, height * 0.75 + Phaser.Math.Between(-3, 4), 20, 2);
    }

    // A low, distant building line along the whole width so the skyline
    // doesn't read as three landmarks floating in empty space.
    this._drawDistantSkyline(width, horizonY);

    // Drifting cartoon clouds — two parallax layers with a bit of painterly
    // shading rather than flat blobs.
    this._addClouds(width, height, 3, 20000, 0.8);
    this._addClouds(width, height, 2, 30000, 0.5);

    // The London skyline, kept to the left half of the frame...
    this._drawLondonEye(width * 0.14, horizonY, 54);
    this._drawGherkin(width * 0.28, horizonY, 36, 130);
    this._drawShard(width * 0.4, horizonY, 46, 190);

    // ...and, on the right, an original night-mountain silhouette — the
    // clearest visual nod to Monkey Island's own title sequence — with the
    // old mouse's campfire at its summit.
    const peak = this._drawMountain(width * 0.78, horizonY, 150, 250);
    this._drawStoneArch(peak.peakX + 26, peak.peakY + 6);
    const fireY = peak.peakY - 4;
    for (let i = 4; i >= 1; i -= 1) {
      const glow = this.add.circle(peak.peakX, fireY, 8 + i * 11, 0xffae3d, 0.1 * i).setDepth(3);
      this.tweens.add({
        targets: glow,
        alpha: 0.1 * i + 0.09,
        duration: 420 + i * 60,
        yoyo: true,
        repeat: -1,
      });
    }
    this._drawFirePit(peak.peakX, peak.peakY + 6);
    this._drawStoryteller(peak.peakX, fireY, peak.peakY + 6);

    // Whisker's silhouette, dashing around the riverside street below.
    this._runMouseAround(width, height);

    // Film-style narration captions, then a close-up cut to the storyteller
    // (echoing Monkey Island 1's own cut to the old man at the fire — the
    // detail is too fine to read as a tiny rooftop silhouette in the wide
    // shot, so it gets its own dedicated close-up beat), then hand control
    // to the player.
    this._playCaptions(width, height, () => {
      this._playStorytellerCloseup(width, height, () => this._showContinuePrompt(width, height));
    });
  }

  /**
   * A dedicated close-up shot of the old mouse and his fire, drawn much
   * bigger than the tiny rooftop version in the wide establishing shot —
   * the same drawing code, just at a larger scale, so the "clear Monkey
   * Island reference" beat the storyteller is built for actually reads.
   */
  _playStorytellerCloseup(width, height, onDone) {
    const container = this.add.container(0, 0).setDepth(55).setAlpha(0);

    const backdrop = this.add.rectangle(0, 0, width, height, 0x02030a, 0.92).setOrigin(0, 0);
    container.add(backdrop);

    const cx = width * 0.42;
    const deckY = height * 0.72;
    const fireY = deckY - 50;
    const scale = 3.6;

    for (let i = 4; i >= 1; i -= 1) {
      const glow = this.add.circle(cx, fireY, (8 + i * 11) * scale * 0.55, 0xffae3d, 0.08 * i);
      container.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: 0.08 * i + 0.07,
        duration: 420 + i * 60,
        yoyo: true,
        repeat: -1,
      });
    }

    container.add(this._drawStoneArch(cx + 150, deckY, scale, 56));
    container.add(this._drawFirePit(cx, deckY, scale, 56.5));
    this._drawStoryteller(cx, fireY, deckY, scale, 57).forEach((o) => container.add(o));

    const label = this.add
      .text(width / 2, height - 56, 'They say he still remembers every tunnel beneath the city.', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        fontStyle: 'italic',
        color: '#f2ead6',
        align: 'center',
        wordWrap: { width: width - 160 },
      })
      .setOrigin(0.5);
    container.add(label);

    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 700,
      onComplete: () => {
        this.time.delayedCall(3400, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            duration: 700,
            onComplete: () => {
              container.destroy(true);
              onDone();
            },
          });
        });
      },
    });
  }

  _drawMoon(cx, cy, radius) {
    // Soft layered halo, largest and dimmest outward, so the moon actually
    // looks like it's casting light rather than sitting in front of the sky.
    for (let i = 3; i >= 1; i -= 1) {
      this.add.circle(cx, cy, radius * (1 + i * 0.55), 0xdce8ff, 0.05 * i).setDepth(1);
    }
    this.add.circle(cx, cy, radius, 0xf3ecd0, 1).setDepth(1);
    const shading = this.add.graphics().setDepth(1);
    shading.fillStyle(0xd8cfa8, 0.5);
    shading.fillCircle(cx - radius * 0.28, cy + radius * 0.22, radius * 0.22);
    shading.fillCircle(cx + radius * 0.3, cy - radius * 0.1, radius * 0.14);
    shading.fillCircle(cx + radius * 0.05, cy + radius * 0.35, radius * 0.12);
  }

  _drawStars(width, horizonY) {
    // Small twinkling points...
    for (let i = 0; i < 90; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, horizonY * 0.9);
      const size = Phaser.Math.FloatBetween(1, 2);
      const star = this.add
        .rectangle(x, y, size, size, 0xdfeeff, Phaser.Math.FloatBetween(0.35, 0.95))
        .setDepth(1);
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        duration: Phaser.Math.Between(1200, 3400),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // ...plus a handful of bright four-point "sparkle" stars for accent.
    for (let i = 0; i < 7; i += 1) {
      const x = Phaser.Math.Between(width * 0.05, width * 0.95);
      const y = Phaser.Math.Between(10, horizonY * 0.55);
      const sparkle = this._makeSparkle(x, y, Phaser.Math.FloatBetween(4, 7));
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.4, to: 1 },
        scale: { from: 0.8, to: 1.25 },
        duration: Phaser.Math.Between(1400, 2200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500),
      });
    }
  }

  _makeSparkle(x, y, size) {
    const g = this.add.graphics({ x, y }).setDepth(1);
    g.fillStyle(0xffffff, 1);
    g.fillRect(-size * 0.08, -size, size * 0.16, size * 2);
    g.fillRect(-size, -size * 0.08, size * 2, size * 0.16);
    g.fillRect(-size * 0.45, -size * 0.45, size * 0.9, size * 0.9);
    return g;
  }

  _drawDistantSkyline(width, horizonY) {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x0a1424, 1);
    let x = 0;
    const lights = [];
    while (x < width) {
      const w = Phaser.Math.Between(20, 40);
      const h = Phaser.Math.Between(10, 34);
      g.fillRect(x, horizonY - h, w, h);
      // A faint moonlit edge on each rooftop so the low skyline has some
      // shape instead of reading as a single flat band.
      g.fillStyle(0x1c3552, 0.6);
      g.fillRect(x, horizonY - h, w, 1.5);
      g.fillStyle(0x0a1424, 1);
      if (Math.random() < 0.7) {
        lights.push({
          x: x + Phaser.Math.Between(4, Math.max(5, w - 4)),
          y: horizonY - Phaser.Math.Between(2, Math.max(3, h - 2)),
        });
      }
      x += w + Phaser.Math.Between(0, 3);
    }

    // Tiny twinkling windows — the same trick as the glowing settlement
    // lights that make a painted night skyline feel inhabited.
    lights.forEach(({ x: lx, y: ly }) => {
      const light = this.add.circle(lx, ly, 1, 0xffd88a, Phaser.Math.FloatBetween(0.5, 0.9)).setDepth(1.5);
      this.tweens.add({
        targets: light,
        alpha: 0.15,
        duration: Phaser.Math.Between(1500, 4000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
      });
    });
  }

  _addClouds(width, height, count, baseDuration, alpha) {
    for (let i = 0; i < count; i += 1) {
      const cloud = this.add.container(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(20, height * 0.32),
      );
      const g = this.add.graphics();
      const puffs = 4 + Math.floor(Math.random() * 2);
      // Darkest undertone first...
      g.fillStyle(0x262e52, alpha * 0.75);
      for (let p = 0; p < puffs; p += 1) {
        g.fillEllipse(p * 26 - puffs * 12, 6 + Phaser.Math.Between(-3, 3), 44, 24);
      }
      // ...a mid-tone body...
      g.fillStyle(0x3f4a78, alpha * 0.9);
      for (let p = 0; p < puffs; p += 1) {
        g.fillEllipse(p * 26 - puffs * 12, Phaser.Math.Between(-1, 3), 40, 20);
      }
      // ...then a lighter, moonlit highlight on top, offset upward, so the
      // cloud reads as lit from above rather than a flat silhouette.
      g.fillStyle(0xd3ddf2, alpha);
      for (let p = 0; p < puffs; p += 1) {
        g.fillEllipse(p * 26 - puffs * 12, Phaser.Math.Between(-7, -2), 32, 16);
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
    const g = this.add.graphics().setDepth(3);
    g.lineStyle(3, 0x0a1020, 0.95);
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
    g.lineStyle(4, 0x0a1020, 0.95);
    g.lineBetween(cx, groundY, cx, groundY - radius * 2 + 8);
    g.lineBetween(cx - radius * 0.5, groundY, cx + radius * 0.5, groundY);
    // A thin moonlit rim on the upper-right edge of the wheel for a touch
    // of dimensionality against the flat silhouette.
    g.lineStyle(1.5, 0x6a8ebc, 0.6);
    g.beginPath();
    g.arc(cx, groundY - radius, radius, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(20));
    g.strokePath();
  }

  _drawShard(cx, groundY, halfWidth, spireHeight) {
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x0a1020, 1);
    g.beginPath();
    g.moveTo(cx - halfWidth, groundY);
    g.lineTo(cx - halfWidth * 0.15, groundY - spireHeight);
    g.lineTo(cx + halfWidth * 0.1, groundY - spireHeight * 0.94);
    g.lineTo(cx + halfWidth, groundY);
    g.closePath();
    g.fillPath();

    // Moonlit facet along one side of the spire, plus a couple of thinner
    // facet lines below it so the tower reads as faceted glass rather than
    // a flat triangle.
    g.fillStyle(0x2c4d72, 0.55);
    g.beginPath();
    g.moveTo(cx - halfWidth * 0.15, groundY - spireHeight);
    g.lineTo(cx + halfWidth * 0.1, groundY - spireHeight * 0.94);
    g.lineTo(cx + halfWidth * 0.35, groundY);
    g.lineTo(cx + halfWidth * 0.05, groundY);
    g.closePath();
    g.fillPath();

    g.lineStyle(1, 0x3a5c82, 0.5);
    for (let f = 1; f <= 4; f += 1) {
      const t = f / 5;
      g.lineBetween(
        Phaser.Math.Linear(cx - halfWidth * 0.15, cx - halfWidth, t),
        Phaser.Math.Linear(groundY - spireHeight, groundY, t),
        Phaser.Math.Linear(cx + halfWidth * 0.1, cx + halfWidth, t),
        Phaser.Math.Linear(groundY - spireHeight * 0.94, groundY, t),
      );
    }
  }

  _drawGherkin(cx, groundY, halfWidth, towerHeight) {
    const bodyTop = groundY - towerHeight * 0.72;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x0a1020, 1);
    g.fillRect(cx - halfWidth, bodyTop, halfWidth * 2, towerHeight * 0.72);
    g.fillEllipse(cx, bodyTop, halfWidth * 2, halfWidth * 1.3);

    // Moonlit rim down the right-hand side of the tower...
    g.fillStyle(0x2c4d72, 0.4);
    g.fillRect(cx + halfWidth * 0.55, bodyTop, halfWidth * 0.45, towerHeight * 0.72);
    // ...and a few faint horizontal band-lines suggesting the Gherkin's
    // real lattice of windows, so the tower reads as built, not just a
    // smooth silhouette.
    g.lineStyle(1, 0x1c3552, 0.5);
    for (let b = 1; b <= 6; b += 1) {
      const by = bodyTop + (towerHeight * 0.72 * b) / 7;
      const bw = halfWidth * 2 * (0.75 + 0.25 * Math.sin((b / 7) * Math.PI));
      g.lineBetween(cx - bw / 2, by, cx + bw / 2, by);
    }

    g.fillStyle(0x0a1020, 1);
    g.fillTriangle(
      cx - halfWidth * 0.85,
      groundY - towerHeight * 0.78,
      cx + halfWidth * 0.85,
      groundY - towerHeight * 0.78,
      cx,
      groundY - towerHeight,
    );
  }

  /**
   * An original night-mountain silhouette beside the London skyline — the
   * clearest visual nod to Monkey Island's own title sequence: a tall dark
   * peak, a switchback path climbing it, a cluster of lights nestled at
   * its foot, and (drawn on top afterwards) the old mouse's campfire at
   * the summit. Built entirely from our own shapes; not traced from any
   * reference image.
   *
   * @returns {{peakX: number, peakY: number}} where the summit perch is,
   *   so the campfire/storyteller can be placed on it.
   */
  _drawMountain(cx, groundY, halfWidth, peakHeight) {
    const g = this.add.graphics().setDepth(2.5);

    // A smaller, darker secondary ridge behind the main peak for depth.
    g.fillStyle(0x080d1c, 1);
    g.fillTriangle(
      cx + halfWidth * 0.35,
      groundY,
      cx + halfWidth * 1.3,
      groundY,
      cx + halfWidth * 0.75,
      groundY - peakHeight * 0.55,
    );

    // The main peak: an irregular, hand-placed ridge line on each side
    // (not a smooth triangle) so it reads as rock rather than geometry.
    const top = groundY - peakHeight;
    const leftSide = [
      [0, 0], [-0.08, 0.09], [-0.22, 0.22], [-0.18, 0.34], [-0.4, 0.48],
      [-0.55, 0.58], [-0.48, 0.68], [-0.72, 0.8], [-0.85, 0.9], [-1, 1],
    ];
    const rightSide = [
      [0.07, 0.04], [0.18, 0.16], [0.14, 0.27], [0.34, 0.4], [0.3, 0.5],
      [0.52, 0.62], [0.46, 0.72], [0.68, 0.84], [0.8, 0.92], [1, 1],
    ];
    const toPoint = ([fx, fy]) => [cx + fx * halfWidth, top + fy * peakHeight];

    g.fillStyle(0x0a1424, 1);
    g.beginPath();
    g.moveTo(cx, top);
    leftSide.forEach(([fx, fy]) => {
      const [x, y] = toPoint([fx, fy]);
      g.lineTo(x, y);
    });
    g.lineTo(cx + halfWidth, groundY);
    [...rightSide].reverse().forEach(([fx, fy]) => {
      const [x, y] = toPoint([fx, fy]);
      g.lineTo(x, y);
    });
    g.closePath();
    g.fillPath();

    // Moonlit facets catching the light along the upper-right ridge.
    g.fillStyle(0x24456c, 0.35);
    g.beginPath();
    g.moveTo(cx, top);
    [[0.07, 0.04], [0.18, 0.16], [0.14, 0.27], [0.34, 0.4]].forEach(([fx, fy]) => {
      const [x, y] = toPoint([fx, fy]);
      g.lineTo(x, y);
    });
    g.lineTo(cx + halfWidth * 0.2, top + peakHeight * 0.4);
    g.closePath();
    g.fillPath();

    // A switchback path zigzagging from the foot of the mountain up to
    // the summit — the same idea as a winding mountain trail, drawn as
    // our own simple line rather than tracing any specific artwork.
    g.lineStyle(1.5, 0x5b7aa8, 0.55);
    const switches = 8;
    let side = -1;
    g.beginPath();
    g.moveTo(cx - halfWidth * 0.1, groundY - 2);
    for (let i = 1; i <= switches; i += 1) {
      const t = i / switches;
      const y = groundY - peakHeight * 0.94 * t;
      const spread = (1 - t) * halfWidth * 0.5 + halfWidth * 0.05;
      const x = cx + side * spread;
      g.lineTo(x, y);
      side *= -1;
    }
    g.lineTo(cx, top + peakHeight * 0.06);
    g.strokePath();

    // A cluster of small twinkling lights nestled at the mountain's foot —
    // a little settlement, echoing the glowing lights at the base of that
    // kind of painted night mountain without copying its specific art.
    for (let i = 0; i < 16; i += 1) {
      const lx = cx - halfWidth * 0.75 + Math.random() * halfWidth * 0.9;
      const ly = groundY - Math.random() * peakHeight * 0.06;
      const light = this.add
        .circle(lx, ly, Phaser.Math.FloatBetween(1, 1.8), 0xffe1a0, Phaser.Math.FloatBetween(0.5, 0.95))
        .setDepth(2.6);
      this.tweens.add({
        targets: light,
        alpha: 0.15,
        duration: Phaser.Math.Between(1200, 3200),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2500),
      });
    }

    return { peakX: cx, peakY: top };
  }

  _drawStoneArch(ax, groundY, scale = 1, depth = 3.2) {
    // Two short stone legs and a voussoir-block arch on top — built as
    // individual wedge/rectangle "stones" with mortar gaps between them,
    // our own simple original shape rather than any specific reference art.
    const g = this.add.graphics().setDepth(depth);
    const legW = 5 * scale;
    const legH = 16 * scale;
    const gap = 14 * scale;
    const stoneColor = 0x1c2b44;
    const archCx = ax + gap / 2 - legW / 2;
    const archCy = groundY - legH;
    const archOuterR = gap / 2 + legW;
    const archInnerR = gap / 2;

    [ax - gap / 2 - legW, ax + gap / 2].forEach((legX) => {
      for (let s = 0; s < 4; s += 1) {
        g.fillStyle(stoneColor, 1);
        g.fillRect(legX, groundY - (s + 1) * (legH / 4), legW, legH / 4 - 1);
      }
    });

    // The arch itself: a fan of wedge-shaped stones from one leg, over the
    // top, to the other.
    const segments = 6;
    for (let s = 0; s < segments; s += 1) {
      const a0 = Phaser.Math.DegToRad(180 + (s / segments) * 180);
      const a1 = Phaser.Math.DegToRad(180 + ((s + 0.9) / segments) * 180);
      g.fillStyle(stoneColor, 1);
      g.beginPath();
      g.moveTo(archCx + Math.cos(a0) * archInnerR, archCy + Math.sin(a0) * archInnerR);
      g.lineTo(archCx + Math.cos(a0) * archOuterR, archCy + Math.sin(a0) * archOuterR);
      g.lineTo(archCx + Math.cos(a1) * archOuterR, archCy + Math.sin(a1) * archOuterR);
      g.lineTo(archCx + Math.cos(a1) * archInnerR, archCy + Math.sin(a1) * archInnerR);
      g.closePath();
      g.fillPath();
    }

    // A faint moonlit highlight along the outer curve.
    g.lineStyle(Math.max(1, scale), 0x5b7aa8, 0.4);
    g.beginPath();
    g.arc(archCx, archCy, archOuterR, Phaser.Math.DegToRad(190), Phaser.Math.DegToRad(260));
    g.strokePath();
    return g;
  }

  _drawFirePit(cx, groundY, scale = 1, depth = 3.5) {
    // A ring of small rounded stones around the base of the fire, instead
    // of flames just sitting on bare deck.
    const g = this.add.graphics().setDepth(depth);
    const stones = 10;
    for (let i = 0; i < stones; i += 1) {
      const a = (i / stones) * Math.PI * 2;
      const rx = 11 * scale;
      const ry = 4.5 * scale;
      const px = cx + Math.cos(a) * rx;
      const py = groundY + Math.sin(a) * ry;
      g.fillStyle(0x1c2b44, 1);
      g.fillCircle(px, py, 2.4 * scale);
      g.fillStyle(0x3a5c82, 0.5);
      g.fillCircle(px - 0.5 * scale, py - 0.5 * scale, 1 * scale);
    }
    return g;
  }

  /**
   * The old mouse storyteller: a big, unmistakable silhouette — hooded
   * cloak, round ears, a curled tail, and a cane he leans on while he
   * talks, seated just left of the fire so the warm light rims his
   * outline. `scale` lets the same drawing serve both the tiny rooftop
   * detail in the wide shot and the full-size close-up.
   */
  _drawStoryteller(cx, fireY, deckY, scale = 1, depth = 4) {
    const s = (n) => n * scale;
    const objects = [];

    // The fire itself, bright core through soft outer flame.
    const fire = this.add.graphics().setDepth(depth);
    fire.fillStyle(0xc44a1e, 1);
    fire.fillTriangle(cx + s(6), deckY, cx + s(16), deckY, cx + s(11), fireY - s(10));
    fire.fillStyle(0xff8c2e, 1);
    fire.fillTriangle(cx + s(7), deckY, cx + s(15), deckY, cx + s(11), fireY - s(4));
    fire.fillStyle(0xffd35c, 1);
    fire.fillTriangle(cx + s(8.5), deckY, cx + s(13.5), deckY, cx + s(11), fireY + s(2));
    fire.fillStyle(0xfff2c4, 1);
    fire.fillCircle(cx + s(11), deckY - s(2), s(1.6));
    objects.push(fire);

    // The old mouse: seated just left of the fire.
    const bx = cx - s(12); // seat position
    const by = deckY; // ground level on the deck

    const fg = this.add.graphics().setDepth(depth);
    fg.fillStyle(0x05060c, 1);

    // Cloak/robe, wide at the base like someone sitting cross-legged.
    fg.fillEllipse(bx, by - s(3), s(26), s(16));
    fg.fillRect(bx - s(13), by - s(16), s(26), s(14));

    // Hunched shoulders / upper back curve.
    fg.fillCircle(bx + s(6), by - s(15), s(8));

    // A short cloak collar behind the neck, low enough that it never
    // competes with the ears for silhouette space.
    fg.fillCircle(bx + s(3), by - s(19), s(6));

    // Head, tilted slightly toward the fire.
    const headX = bx + s(13);
    const headY = by - s(22);
    fg.fillCircle(headX, headY, s(7));

    // Ears FIRST, poking well clear above the head's own silhouette — the
    // single clearest "this is a mouse" cue, so nothing else is allowed to
    // paint over them.
    fg.fillCircle(headX - s(4), headY - s(10), s(4.6));
    fg.fillCircle(headX + s(5), headY - s(10.5), s(4.6));
    // Inner-ear shading for a touch of depth, still original character
    // design rather than any existing one.
    fg.fillStyle(0x1c1420, 1);
    fg.fillCircle(headX - s(4), headY - s(10), s(2.2));
    fg.fillCircle(headX + s(5), headY - s(10.5), s(2.2));
    fg.fillStyle(0x05060c, 1);

    // Snout, just a small bump — enough to read as a mouse, not a person —
    // drawn after the ears so it stays on top of the head outline.
    fg.fillCircle(headX + s(6), headY + s(2), s(3));

    // Cane, planted in front of him, one paw resting on its handle.
    fg.lineStyle(s(2), 0x05060c, 1);
    fg.lineBetween(bx - s(14), by - s(14), bx - s(20), by + s(1));
    fg.fillCircle(bx - s(14), by - s(14), s(2.2));

    // A curled tail flicking out from under the cloak — the other
    // unmistakably-a-mouse cue.
    fg.lineStyle(s(2), 0x05060c, 1);
    fg.beginPath();
    fg.moveTo(bx + s(12), by - s(2));
    fg.lineTo(bx + s(20), by - s(6));
    fg.lineTo(bx + s(18), by - s(13));
    fg.lineTo(bx + s(12), by - s(11));
    fg.strokePath();

    // A thin warm rim-light down the fire-facing edge of the silhouette so
    // he doesn't just read as a flat black cutout against the glow.
    fg.lineStyle(Math.max(1, s(1.2)), 0xffb35a, 0.55);
    fg.beginPath();
    fg.arc(headX, headY, s(7), Phaser.Math.DegToRad(-40), Phaser.Math.DegToRad(70));
    fg.strokePath();
    fg.beginPath();
    fg.moveTo(bx + s(12), by - s(10));
    fg.lineTo(bx + s(13), by - s(2));
    fg.strokePath();
    objects.push(fg);

    for (let i = 0; i < 3; i += 1) {
      const smoke = this.add.circle(cx + s(11), fireY - s(6) - i * s(6), s(2 + i), 0xcccccc, 0.15).setDepth(depth);
      this.tweens.add({
        targets: smoke,
        y: smoke.y - s(22),
        alpha: 0,
        duration: 3000 + i * 400,
        repeat: -1,
        delay: i * 600,
      });
      objects.push(smoke);
    }

    return objects;
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
