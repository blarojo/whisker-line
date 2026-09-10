import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { StationConcourseScene } from './scenes/StationConcourseScene.js';

// Classic 4:3 low-res canvas, scaled up crisply — same spirit as the
// 320x200 SCUMM-era games this project is inspired by.
const GAME_WIDTH = 320;
const GAME_HEIGHT = 200;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 3,
  },
  scene: [BootScene, TitleScene, IntroScene, StationConcourseScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
