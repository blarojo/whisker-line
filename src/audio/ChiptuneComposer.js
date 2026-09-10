// ChiptuneComposer.js
//
// A tiny procedural music engine: plays an original, looping chiptune-style
// theme using raw Web Audio oscillators. Written to evoke the same
// swashbuckling adventure-game mood as classic LucasArts title themes,
// WITHOUT reproducing any existing melody, arrangement, or recording — see
// "On art and audio assets" in docs/architecture-guide.md for why this
// approach was chosen over shipping real audio files.

const NOTE_FREQUENCIES = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.0,
};

const STEP = 0.16; // seconds per step at this composer's tempo

// Melody: a jaunty minor-key theme phrased in short adventurous runs and
// held "heroic" notes — an original tune, evoking a pirate-adventure
// fanfare in spirit only.
const MELODY = [
  ['C4', 2], ['Eb4', 2], ['G4', 2], ['C5', 2],
  ['Bb4', 2], ['G4', 2], ['Eb4', 2], ['D4', 2],
  ['C4', 2], ['Eb4', 2], ['G4', 2], ['Bb4', 2],
  ['C5', 4], [null, 4],
  ['G4', 2], ['Ab4', 2], ['Bb4', 2], ['C5', 2],
  ['D5', 2], ['C5', 2], ['Bb4', 2], ['G4', 2],
  ['F4', 2], ['Eb4', 2], ['D4', 2], ['C4', 2],
  ['C4', 4], [null, 4],
];

// Bass: a rolling, marching root-note line under the melody.
const BASS = [
  ['C3', 4], ['G3', 4], ['Eb3', 4], ['G3', 4],
  ['C3', 4], ['G3', 4], ['F3', 4], ['G3', 4],
  ['C3', 4], ['G3', 4], ['Ab3', 4], ['Bb3', 4],
  ['C3', 4], ['C3', 4], ['G3', 4], ['G3', 4],
];

export class ChiptuneComposer {
  /** @param {AudioContext} context */
  constructor(context) {
    this.context = context;
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.18;
    this.masterGain.connect(context.destination);
    this._loopTimer = null;
    this._playing = false;
  }

  /**
   * Schedule one pass of a melodic line starting ~50ms from now.
   * @returns {number} the total duration of the pattern, in seconds.
   */
  _playLine(pattern, { gain = 0.4, type = 'square' } = {}) {
    const context = this.context;
    let t = context.currentTime + 0.05;
    const start = t;
    for (const [note, steps] of pattern) {
      const duration = steps * STEP;
      if (note) {
        const osc = context.createOscillator();
        const noteGain = context.createGain();
        osc.type = type;
        osc.frequency.value = NOTE_FREQUENCIES[note];
        noteGain.gain.setValueAtTime(0, t);
        noteGain.gain.linearRampToValueAtTime(gain, t + 0.02);
        noteGain.gain.setValueAtTime(gain, t + duration - 0.04);
        noteGain.gain.linearRampToValueAtTime(0, t + duration - 0.01);
        osc.connect(noteGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.02);
      }
      t += duration;
    }
    return t - start;
  }

  /** Start looping the theme. Safe to call repeatedly; a second call while
   * already playing is a no-op. */
  start() {
    if (this._playing) return;
    this._playing = true;
    const scheduleLoop = () => {
      if (!this._playing) return;
      const loopLength = this._playLine(MELODY, { gain: 0.5, type: 'square' });
      this._playLine(BASS, { gain: 0.32, type: 'triangle' });
      this._loopTimer = setTimeout(scheduleLoop, loopLength * 1000);
    };
    scheduleLoop();
  }

  stop() {
    this._playing = false;
    if (this._loopTimer) {
      clearTimeout(this._loopTimer);
      this._loopTimer = null;
    }
  }
}
