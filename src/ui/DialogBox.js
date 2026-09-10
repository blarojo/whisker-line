// DialogBox.js
//
// A simple SCUMM-style line of dialogue rendered at the bottom of the
// screen: a speaker-colored line of text that holds for a bit then clears,
// with lines queued so scene code can just `await dialogBox.say(...)` in
// order. Sits on its own dark bar rather than directly over the scene, so
// light-colored dialogue text stays readable no matter what's behind it in
// a given scene (a bright sky, pale tiles, etc.) — text-over-background
// contrast can't be guaranteed otherwise.

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    const width = scene.scale.width;
    const height = scene.scale.height;
    const barHeight = 52;
    const barY = height - barHeight / 2 - 6;

    this.background = scene.add
      .rectangle(width / 2, barY, width, barHeight, 0x000000, 0.6)
      .setDepth(999)
      .setAlpha(0);

    this.text = scene.add
      .text(width / 2, barY, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: width - 48 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(1000);
    this._queue = [];
    this._busy = false;
  }

  /**
   * Queue a line of dialogue.
   * @param {string} speaker
   * @param {string} line
   * @param {string} color hex color for this speaker's text
   * @param {number} holdMs how long the line stays on screen
   * @returns {Promise<void>} resolves once the line has been shown and cleared
   */
  say(speaker, line, color = '#ffffff', holdMs = 2200) {
    return new Promise((resolve) => {
      this._queue.push({ speaker, line, color, holdMs, resolve });
      this._advance();
    });
  }

  _advance() {
    if (this._busy || this._queue.length === 0) return;
    this._busy = true;
    const { line, color, holdMs, resolve } = this._queue.shift();
    this.text.setColor(color);
    this.text.setText(line);
    this.background.setAlpha(1);
    this.scene.time.delayedCall(holdMs, () => {
      this.text.setText('');
      this.background.setAlpha(0);
      this._busy = false;
      resolve();
      this._advance();
    });
  }
}
