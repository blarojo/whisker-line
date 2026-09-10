// DialogBox.js
//
// A simple SCUMM-style line of dialogue rendered at the bottom of the
// screen: a speaker-colored line of text that holds for a bit then clears,
// with lines queued so scene code can just `await dialogBox.say(...)` in
// order.

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    this.text = scene.add
      .text(scene.scale.width / 2, scene.scale.height - 16, '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: scene.scale.width - 24 },
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
    this.scene.time.delayedCall(holdMs, () => {
      this.text.setText('');
      this._busy = false;
      resolve();
      this._advance();
    });
  }
}
