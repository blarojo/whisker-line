import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CinematicScene } from './scenes/CinematicScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { StationConcourseScene } from './scenes/StationConcourseScene.js';
import { PlatformScene } from './scenes/PlatformScene.js';
import { EndOfDemoScene } from './scenes/EndOfDemoScene.js';

// Same 8:5 aspect ratio as the SCUMM-era games this project is inspired by,
// but at double the base resolution (640x400 instead of 320x200) so scene
// art and character sprites can carry more real detail instead of just
// being blown-up big pixels.
const GAME_WIDTH = 640;
const GAME_HEIGHT = 400;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  // Everything in this game is drawn with vector shapes (Graphics circles,
  // ellipses, gradients), not hand-authored pixel-art bitmaps, so nothing
  // here actually benefits from "pixel art" nearest-neighbour scaling —
  // it only made curves look jagged once stretched to fill a real screen.
  // Smooth antialiasing plus a higher internal render resolution (so the
  // canvas has more real pixels to draw with before the browser scales it
  // up to fill the window) is what actually reads as "sharp" here.
  antialias: true,
  antialiasGL: true,
  resolution: Math.max(window.devicePixelRatio || 1, 2),
  backgroundColor: '#000000',
  scale: {
    // FIT scales the game canvas up to fill the browser window (letterboxed
    // to preserve aspect ratio) instead of rendering at native size in a
    // small fixed box, and re-fits automatically on window resize.
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [BootScene, MenuScene, CinematicScene, IntroScene, StationConcourseScene, PlatformScene, EndOfDemoScene],
};

const game = new Phaser.Game(config);

// Exposed for debugging in the browser console (window.__game.scene.getScene('X'))
window.__game = game;
