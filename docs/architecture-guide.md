# Architecture Guide

## What this game is

*Whisker Line: LeCheddar's Revenge* is a 2D point-and-click adventure game in
the style of early-90s LucasArts SCUMM games (*The Secret of Monkey Island*,
*Monkey Island 2: LeChuck's Revenge*): fixed-camera scenes, a
click-to-move/click-to-interact protagonist, narrative delivered through text
dialogue boxes, and scene-to-scene story progression rather than an open world.

## Tech stack

| Concern            | Choice                                   | Why |
|---------------------|-------------------------------------------|-----|
| Game engine          | [Phaser 3](https://phaser.io/) (v3.70)    | Purpose-built 2D engine with scene management, tweens, input, and Web Audio support baked in. Battle-tested for exactly this kind of game. |
| Language             | Vanilla JavaScript (ES modules)            | No compiler/transpiler needed. Keeps the barrier to running the game at "open a browser" instead of "install a toolchain". TypeScript can be introduced later if the codebase grows enough to want it. |
| Build step           | **None** — Phaser is vendored locally under `vendor/phaser.min.js` and loaded with a plain `<script>` tag; game code loads as native ES modules (`<script type="module">`). | The dev machine this project started on doesn't have Node.js installed. A no-build setup means anyone can clone the repo and run the game with nothing more than a browser and a static file server. If the project outgrows this (bundling, TypeScript, tests), migrating to Vite is the natural next step — see "Future evolution" below. |
| Local dev server     | Any static file server. `python -m http.server` is the documented default since Python 3 is commonly available; `npx serve` works too if Node is present. | Browsers block `fetch`/audio-decoding from `file://` pages, so a trivial static server is required — but nothing fancier than that. |
| Rendering / art      | Phaser's `Graphics` API drawing procedural vector scenes and sprites at runtime (circles, gradients, ellipses — not bitmap sprites), organized as one draw function per background/character. `pixelArt` is deliberately left **off**: nothing here is a low-res pixel-art texture, so smooth antialiasing looks better than nearest-neighbour scaling, and the game config bumps the render `resolution` (to at least 2x, or the display's own device pixel ratio) so curves stay crisp once the canvas is stretched to fill a real screen. | See "On art and audio assets" below. |
| Audio                | Web Audio API oscillators and noise bursts, driven through Phaser's sound manager: melody, bass, a soft pad, a small drum kit, and a short echo send, generating an original chiptune-style score at runtime (no audio files shipped for the prototype). | See "On art and audio assets" below. |
| Persistence          | None yet. Planned: `localStorage` for save games and settings once there's more than one scene of progress to save. | Not needed for the current prototype slice. |

## On art and audio assets

This prototype does **not** contain any actual *Monkey Island* music, art, or
LucasArts/Disney IP, and it does not embed real photographs of Seven Sisters
station. Both are copyrighted (game assets by Disney/LucasArts; a specific
photograph by its photographer), so instead:

- **Visuals**: scenes are original vector-drawn art, built procedurally in
  code (`src/scenes/*`), *inspired by* real landmarks (Seven Sisters
  station's roundel signage and brick-and-glass ticket hall frontage; the
  London Eye, the Gherkin, and the Shard on the skyline) rather than
  tracing a photo.
- **Music**: the title screen and scene music are original short chiptune
  loops synthesized at runtime via the Web Audio API
  (`src/audio/ChiptuneComposer.js`), written to evoke the same
  swashbuckling/adventurous mood as the *Monkey Island* main theme without
  reproducing its melody, arrangement, or recordings.

If the team later licenses real artwork, photography, or a commissioned
score, drop the files into `assets/images` / `assets/audio` and swap the
relevant scene's procedural draw/audio calls for `this.load.image(...)` /
`this.load.audio(...)` calls — the scene structure doesn't need to change.

## Project layout

```
whisker-line/
├── index.html              Entry point: loads Phaser, then src/main.js as a module
├── vendor/
│   └── phaser.min.js        Vendored Phaser 3 library (no npm install required)
├── src/
│   ├── main.js               Phaser game config + scene registration
│   ├── scenes/
│   │   ├── BootScene.js       Minimal setup scene, hands off to CinematicScene
│   │   ├── CinematicScene.js  Mandatory cold-open cutscene (Monkey-Island-style) + music
│   │   ├── MenuScene.js       Title card + "Start Game", reached after the cinematic
│   │   ├── IntroScene.js      Scene 1: Seven Sisters high street at night
│   │   └── StationConcourseScene.js  Placeholder "to be continued" scene reached
│   │                                  after entering the tube — next slice of work
│   ├── entities/
│   │   └── Mouse.js           The player character: drawing, walk animation, movement
│   ├── ui/
│   │   └── DialogBox.js       SCUMM-style bottom-of-screen text box for dialogue
│   └── audio/
│       └── ChiptuneComposer.js Procedural music generator (Web Audio API oscillators)
├── assets/
│   ├── images/                (empty for now — see "On art and audio assets")
│   └── audio/                 (empty for now — see "On art and audio assets")
└── docs/
    ├── architecture-guide.md  This file
    ├── argument.md            Story bible / running script of the game's plot
    └── development-guide.md   How to set up and run the game locally
```

## Conventions

- One Phaser Scene per `src/scenes/*.js` file; scene keys match the class name
  (e.g. `IntroScene`).
- Scenes transition with `this.scene.start('NextSceneKey')`; shared state that
  must survive a transition (inventory, flags) will live in Phaser's registry
  (`this.registry`) once there's state worth carrying — not needed yet.
- Keep drawing code for a given visual (a character, a background) in its own
  function/module rather than inline in a scene's `create()`, so scenes stay
  readable as "what happens" rather than "how it's drawn".

## Future evolution

Reasonable next steps as the game grows, in rough order of likely need:
1. Add a simple inventory + verb system (Look/Use/Talk) once puzzles need it.
2. Introduce `localStorage` save/load once there's more than one scene of
   progress worth persisting.
3. Move from procedural art/audio to real hand-drawn sprite sheets and a
   commissioned or licensed music track.
4. If the vanilla-JS/no-build setup starts to hurt (many files, want
   TypeScript, want tests), migrate to Vite — it's a drop-in fit for a Phaser
   project and doesn't require restructuring `src/`.
