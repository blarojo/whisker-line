# Development Guide

## What you need

- A modern desktop browser (Chrome, Firefox, or Edge — anything with decent
  Web Audio support).
- A way to serve the folder over `http://`, because browsers block the
  `fetch`/audio calls the game needs when opened directly as a `file://`
  page. Any of these work; pick whichever you already have:
  - **Python 3** (commonly pre-installed): `python -m http.server`
  - **Node.js**: `npx serve .`
  - VS Code's "Live Server" extension, or any other static file server.

There is **no `npm install` step** — Phaser is vendored in the repo under
`vendor/phaser.min.js` and the game code is plain ES modules, so nothing
needs to be built or downloaded to run the game. See
[`architecture-guide.md`](./architecture-guide.md) for why.

## Getting the repo

```sh
git clone git@github.com:blarojo/whisker-line.git
cd whisker-line
git checkout develop
```

## Running the game locally

From the repo root:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

(If you'd rather use Node: `npx serve . -l 8000` does the same job.)

You should see the *Whisker Line: LeCheddar's Revenge* title screen with
music playing. Click anywhere (or press any key) to start Scene 1.

## Controls

- **Click** on the ground to walk Whisker there.
- **Click** on a highlighted object/character to interact with it.
- Dialogue advances automatically; click to skip ahead if you want to move
  faster.

## Project structure

See [`architecture-guide.md`](./architecture-guide.md) for the full layout
and the reasoning behind the tech choices. In short:

- `src/scenes/` — one file per game scene (title screen, Scene 1, etc.)
- `src/entities/` — drawable/animatable characters (currently just `Mouse`)
- `src/ui/` — reusable UI pieces (currently the dialogue box)
- `src/audio/` — the procedural music generator
- `assets/` — real art/audio files go here once we have licensed ones (see
  the "On art and audio assets" section of the architecture guide — the
  current prototype draws everything procedurally instead)

## Adding a new scene

1. Create `src/scenes/YourSceneName.js` exporting a class extending
   `Phaser.Scene`, with a matching scene key (`super('YourSceneName')`).
2. Register it in `src/main.js`'s `scene: [...]` list.
3. Transition into it from wherever it should be reached with
   `this.scene.start('YourSceneName')`.

## Troubleshooting

- **Blank page / console errors about CORS or fetch** — you opened
  `index.html` directly from disk instead of through a local server. Start
  a static server (see above) and use its `http://localhost:...` URL.
- **No sound on first load** — browsers require a user gesture before audio
  can play. The title screen's "click/press any key to start" prompt is
  also what unlocks audio — this is expected and not a bug.
