// ChiptuneComposer.js
//
// A tiny procedural music engine: plays an original, looping chiptune-style
// theme using raw Web Audio oscillators and noise bursts — melody, bass (with
// a bouncy octave-up pulse for drive), a soft pad, and a drum kit with a
// syncopated kick accent, plus a touch of echo for depth. Written to evoke
// the same swashbuckling adventure-game mood as classic LucasArts title
// themes, WITHOUT reproducing any existing melody, arrangement, or
// recording — see "On art and audio assets" in docs/architecture-guide.md
// for why this approach was chosen over shipping real audio files.

const NOTE_FREQUENCIES = {
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, A5: 880.0,
};

const STEP = 0.145; // seconds per step at this composer's tempo — a brisker
// pace than earlier drafts for more forward drive
const STEPS_PER_LOOP = 64; // matches the total length of MELODY/BASS below

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

// Drum grid: one entry per 16th-note step across the 64-step loop. A
// four-on-the-floor kick with a syncopated "and" accent, an off-beat
// hi-hat, and a backbeat snare give the tune real forward motion instead
// of just melody-over-bass.
const KICK_STEPS = new Set([0, 8, 16, 24, 32, 40, 48, 56]);
const KICK_ACCENT_STEPS = new Set([6, 22, 38, 54]); // the syncopated "and"
const SNARE_STEPS = new Set([8, 24, 40, 56]);
const HAT_STEPS = new Set(Array.from({ length: STEPS_PER_LOOP }, (_, i) => i).filter((i) => i % 2 === 1));

function transposeUpOctave(note) {
  const octave = Number(note.slice(-1)) + 1;
  return `${note.slice(0, -1)}${octave}`;
}

export class ChiptuneComposer {
  /** @param {AudioContext} context */
  constructor(context) {
    this.context = context;

    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.18;
    this.masterGain.connect(context.destination);

    // A short, low-feedback echo send gives the melody a bit of room to
    // breathe instead of sounding like a dry, flat beep.
    this.delay = context.createDelay(1.0);
    this.delay.delayTime.value = 0.19;
    this.delayFeedback = context.createGain();
    this.delayFeedback.gain.value = 0.24;
    this.delayWet = context.createGain();
    this.delayWet.gain.value = 0.22;
    this.delay.connect(this.delayFeedback).connect(this.delay);
    this.delay.connect(this.delayWet).connect(this.masterGain);

    // One shared noise buffer, reused for both hi-hat and snare hits.
    const noiseLength = context.sampleRate * 1;
    this.noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    this._loopTimer = null;
    this._playing = false;
  }

  /**
   * Schedule one pass of a melodic line starting ~50ms from now.
   * @returns {number} the total duration of the pattern, in seconds.
   */
  _playLine(pattern, { gain = 0.4, type = 'square', withEcho = false } = {}) {
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
        osc.connect(noteGain);
        noteGain.connect(this.masterGain);
        if (withEcho) noteGain.connect(this.delay);
        osc.start(t);
        osc.stop(t + duration + 0.02);
      }
      t += duration;
    }
    return t - start;
  }

  /** A slow, sustained pad an octave above the bass, for warmth underneath
   * everything else. */
  _playPad(pattern, gain = 0.07) {
    const context = this.context;
    let t = context.currentTime + 0.05;
    for (const [note, steps] of pattern) {
      const duration = steps * STEP;
      if (note) {
        const padNote = transposeUpOctave(note);
        const osc = context.createOscillator();
        const noteGain = context.createGain();
        osc.type = 'sine';
        osc.frequency.value = NOTE_FREQUENCIES[padNote] || NOTE_FREQUENCIES[note];
        const attack = Math.min(0.22, duration * 0.35);
        const release = Math.min(0.28, duration * 0.35);
        noteGain.gain.setValueAtTime(0, t);
        noteGain.gain.linearRampToValueAtTime(gain, t + attack);
        noteGain.gain.setValueAtTime(gain, t + duration - release);
        noteGain.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(noteGain).connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.05);
      }
      t += duration;
    }
  }

  _playKick(t, velocity = 1) {
    const context = this.context;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    gain.gain.setValueAtTime(0.55 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  /** A bouncy "oom-pah" pulse under the bass: a soft octave-up pluck on
   * the off-beat of each bass note, for a driving, danceable feel rather
   * than static held notes. */
  _playBassPulse(pattern, gain = 0.13) {
    const context = this.context;
    let t = context.currentTime + 0.05;
    for (const [note, steps] of pattern) {
      const duration = steps * STEP;
      if (note) {
        const pulseNote = transposeUpOctave(note);
        const pulseTime = t + duration * 0.5;
        const pulseDuration = Math.min(duration * 0.4, STEP * 1.4);
        const osc = context.createOscillator();
        const noteGain = context.createGain();
        osc.type = 'square';
        osc.frequency.value = NOTE_FREQUENCIES[pulseNote] || NOTE_FREQUENCIES[note];
        noteGain.gain.setValueAtTime(0, pulseTime);
        noteGain.gain.linearRampToValueAtTime(gain, pulseTime + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.001, pulseTime + pulseDuration);
        osc.connect(noteGain).connect(this.masterGain);
        osc.start(pulseTime);
        osc.stop(pulseTime + pulseDuration + 0.02);
      }
      t += duration;
    }
  }

  _playHat(t) {
    const context = this.context;
    const src = context.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(filter).connect(gain).connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.06);
  }

  _playSnare(t) {
    const context = this.context;
    const src = context.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1700;
    filter.Q.value = 0.7;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    src.connect(filter).connect(gain).connect(this.masterGain);
    src.start(t);
    src.stop(t + 0.15);
  }

  _playDrums() {
    const start = this.context.currentTime + 0.05;
    for (let i = 0; i < STEPS_PER_LOOP; i += 1) {
      const t = start + i * STEP;
      if (KICK_STEPS.has(i)) this._playKick(t);
      if (KICK_ACCENT_STEPS.has(i)) this._playKick(t, 0.7);
      if (SNARE_STEPS.has(i)) this._playSnare(t);
      if (HAT_STEPS.has(i)) this._playHat(t);
    }
  }

  /** Start looping the theme. Safe to call repeatedly; a second call while
   * already playing is a no-op. */
  start() {
    if (this._playing) return;
    this._playing = true;
    const scheduleLoop = () => {
      if (!this._playing) return;
      const loopLength = this._playLine(MELODY, { gain: 0.46, type: 'square', withEcho: true });
      this._playLine(BASS, { gain: 0.32, type: 'triangle' });
      this._playBassPulse(BASS);
      this._playPad(BASS);
      this._playDrums();
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
