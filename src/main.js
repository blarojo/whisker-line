import { BootScene } from './scenes/BootScene.js';
import { CinematicScene } from './scenes/CinematicScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { StationConcourseScene } from './scenes/StationConcourseScene.js';

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
  pixelArt: true,
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
  scene: [BootScene, CinematicScene, MenuScene, IntroScene, StationConcourseScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
