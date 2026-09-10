# UNIFIVE — Complete Application Guide

> **In-Browser 2D & Top-Down Pixel Game Studio**  
> Version: 2.0.0 | Author: Paul Peter (@asterixh) | License: MIT

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Architecture](#2-core-architecture)
3. [Dual Perspective Modes](#3-dual-perspective-modes)
4. [Studio Workspace UI](#4-studio-workspace-ui)
5. [Canvas Editor Features](#5-canvas-editor-features)
6. [Visual Block Programming Engine](#6-visual-block-programming-engine)
7. [Sprite & Pose Animation System](#7-sprite--pose-animation-system)
8. [Audio Synthesis Engine](#8-audio-synthesis-engine)
9. [The .U5 Project Format](#9-the-u5-project-format)
10. [Play Mode & Mobile Controls](#10-play-mode--mobile-controls)
11. [Asset Ecosystem](#11-asset-ecosystem)
12. [Pre-Built World Presets](#12-pre-built-world-presets)
13. [Landing Page & Marketing Site](#13-landing-page--marketing-site)
14. [Codebase Organization & Modularization](#14-codebase-organization--modularization)
15. [Output Folder Analysis Reference](#15-output-folder-analysis-reference)
16. [Keyboard Shortcuts](#16-keyboard-shortcuts)
17. [Technology Stack](#17-technology-stack)
18. [Getting Started](#18-getting-started)

---

## 1. Project Overview

**UNIFIVE** is a zero-dependency, in-browser pixel game studio built entirely with vanilla JavaScript, HTML5 Canvas, and the p5.js library. It enables non-technical creators to build two distinct game genres without writing code:

- **Side-Facing Platformers** — think Mario-style side-scrollers with parallax backgrounds, platforms, jump mechanics, and combat animations.
- **4-Directional Top-Down RPGs** — classic Zelda-style maps with cobblestone roads, medieval structures, wildlife, and 8-directional hero movement.

The heart of UNIFIVE is its **visual block programming canvas** (Scratch 3.0-grade puzzle snapping) that lets creators wire up character behavior, game logic, sound triggers, and variable tracking with drag-and-drop blocks. Every project compiles to a portable, GZIP-compressed `.U5` file that can be shared, imported, and replayed in any modern browser.

---

## 2. Core Architecture

### Directory Structure

```
UNIFIVE Root
├── index.html                   # 700vh sticky-scroll landing/Marketing page
├── landing.css                  # Retro dark burgundy pixel stylesheet
├── landing.js                   # Physics spring LERP + chapter layers + sound synth
├── app/
│   └── index.html               # Main studio workspace (Canvas + Code split-screen)
├── app.js                       # Legacy / root engine script (wires p5 globals)
├── player.js                    # Play-mode entry script (GamePlayerEngine bootstrap)
├── sketch.js                    # CORE monolithic studio engine (~8500 lines)
├── style.css                    # Studio pixel design system & CSS variables
├── assets.json                  # Master asset catalog (side-facing + top-down items)
├── engine/                      # Modular engine (in-progress modularization)
│   ├── audio/                   # 8-bit Web Audio synth, sound effects, melodies
│   ├── config/                  # World dimensions, camera, view config
│   ├── core/                    # Scene storage, history, variables, serialization
│   ├── lifecycle*.js            # setup/draw/windowResized hooks
│   ├── player/                  # Play-game loop, mobile controls, input manager
│   ├── scripting/               # Visual blocks runtime, compiler, presets, U5
│   └── ui/                      # Tabs, layers, properties, panels, shortcuts
│   └── world/                   # Object manager, z-order, crop, poses, rendering
├── assets/                      # All production image/audio data
│   ├── presets/                 # Pre-built world JSON files + thumbnails
│   ├── sprites/                 # Side-facing + top-down character sheets
│   └── top-down-assets/         # Tiles, roads, dungeon pieces, sliced animations
├── manifest.json                # PWA install manifest
└── output/                      # Codebase audit & analysis reports
```

### Runtime Lifecycle (p5.js)

| Hook | Responsibility | Primary Location |
| :--- | :--- | :--- |
| `preload()` | Fetch assets.json, warm image cache | [sketch.js](file:///C:/Users/peter/Documents/p5/code/sketch.js) |
| `setup()` | Create canvas, mount DOM panels, init all engine modules, load scene | [sketch.js](file:///C:/Users/peter/Documents/p5/code/sketch.js#L7840-L8311) (472 LOC) |
| `draw()` | Render background → sorted layers → selection gizmo → HUD → code watchers | [sketch.js](file:///C:/Users/peter/Documents/p5/code/sketch.js#L3357-L3543) (187 LOC) |
| `windowResized()` | Recompute stage dimensions, re-center camera | engine/lifecycle.js |

---

## 3. Dual Perspective Modes

A defining feature is the instant switch between two completely isolated rendering modes. Each perspective has its own scene state, asset catalog, and sprite pose definitions (cached per-view in `AsyncSceneStore`).

### Side-Facing Platformer View (`sidefacing`)

- **World:** Horizontal parallax background layers (5 cities, 4 desert variants, forests, beaches).
- **Sprites:** 10+ character archetypes with poses: `Idle`, `Idle 2`, `Walk`, `Run`, `Jump`, `Attack 1–4`, `Hurt`, `Dead`, plus niche `Shot` / `Arrow` poses for ranged units.
- **Physics model (play mode):** Gravity + jump velocity + platform collision detection.
- **Examples of side-facing categories in [assets.json](file:///C:/Users/peter/Documents/p5/code/assets.json):** City, Desert, Forest, Beach, Industry, Platforms, Trash, Props, City Props.

### Top-Down RPG View (`topdown`)

- **World:** 4-directional cobblestone/dirt roads, medieval guild halls, home interiors, dungeon trap rooms, forests, country paths.
- **Sprites:** Hero (sword/unarmed) with 32 directional poses (Idle/Walk/Run × Front/Back/Left/Right) plus 4 wildlife species (Boar, Deer, Fox, Hare, Black Grouse) with Attack/Death/Hurt/Walk/Run/Idle animations.
- **Depth sorting:** Automatic feet-position-based layering so characters appear behind trees and in front of walls correctly.
- **Categories in assets.json:** Roads, Buildings, Nature, Dungeon, Props, Sprites, Animals.

The perspective switcher button lives in the header (SIDE ⇄ TOP) and is bound to the `V` keyboard shortcut. State for the *previous* view is saved to a scene snapshot before swapping, so you can toggle back and forth without losing work.

---

## 4. Studio Workspace UI

The [app/index.html](file:///C:/Users/peter/Documents/p5/code/app/index.html) defines a 3-pane resizable split layout that adapts responsively.

### Top Header Bar

| Control | Purpose |
| :--- | :--- |
| **Brand Icon** | Return to landing site |
| **View Switcher (SIDE / TOP)** | Toggle perspective mode |
| **Mode Switcher (CANVAS / CODE / PLAY)** | Switch editor mode |
| **Undo / Redo** | History traversal (Ctrl+Z / Ctrl+Y) |
| **FILE Menu** | Save project `.U5`, export PNG, load preset, open `.U5` |
| **Sound Toggle** | Mute 8-bit UI sounds |
| **Fullscreen** | Fullscreen canvas (F key) |

### Left Panel (Workspace Controls)

Has a 4-tab navigation at the top:

1. **CREATE Tab** — Split into *Categories sidebar* (City, Desert, Buildings, etc.) + *Items gallery grid*. Click an item to drag-drop onto canvas; double-click to add at center.
2. **LAYERS Tab** — Scrollable list of every canvas object. Quick-reorder toolbar (Top/Up/Down/Bottom). Each row has: eye icon (visibility toggle), lock icon (freeze position), drag handle (manual reorder). Shows count badge.
3. **PROPS Tab** — Inspector for the selected canvas item:
   - Thumbnail + rename input + ID badge
   - 🎮 Playable hero checkbox
   - Device visibility (all / mobile only / desktop only)
   - Collision type (pass-through / solid)
   - Position X/Y
   - Dimensions W/H + 50/100/150/200% presets + Aspect Lock
   - Rotation slider (0–360°) + 0/90/180/270 snaps + Flip H/V
   - **Crop Controls:** Aspect presets (free / 1:1 / 4:3 / 16:9 / original), numeric crop box (CX/CY/CW/CH), "CROP ON CANVAS" button (enters interactive crop mode), apply/reset.
   - Layer action buttons (TOP/UP/DOWN/BOT), duplicate (Ctrl+D), DELETE (Del).
4. **CONFIG Tab** — Global world settings:
   - Background color (picker + text hex + 8 swatches)
   - World size (width/height inputs + 1200×800 / 2000×1500 / 3200×2400 / 4800×3200 presets)
   - Responsive gameplay layering toggle (auto depth)
   - Auto go-around obstacles toggle
   - .U5 compilation stats + Export/Import/Browse Presets buttons.

### Center Pane (Canvas Stage)

- Resizable splitter between left controls and right canvas.
- Infinite panning (Space + Drag) and zoom (mouse wheel or +/- buttons).
- Selection gizmo with 8 resize handles + rotation handle.
- Crop-mode overlay with 4 corner handles + floating apply/cancel bar.

### Right-Floating Sprite Poses Panel

- Appears only when a sprite-type asset is selected.
- Grid of animated pose cards — hover to preview the sheet sequence, click to apply that pose to the canvas.
- Toolbar: **AUTOPLAY toggle** (live animation on canvas) + **SPEED chips** (1x / 1.5x / 0.6x).
- Count badge (e.g. "32 POSES"), minimize/close buttons.

---

## 5. Canvas Editor Features

### Object Manipulation

- **Drag-and-Drop placement:** Items from the CREATE gallery are draggable onto canvas; snapping to 16px grid (toggle with `G`).
- **Bounding Box Gizmo:** `drawGizmo()` renders 8 resize corners + a rotation handle plus center cross. 79 LOC matching exactly between sketch.js and the modular [objects_transform.js](file:///C:/Users/peter/Documents/p5/code/engine/world/objects_transform.js#L80-L158).
- **Transform Math:** `getTransformTarget()` detects which handle is grabbed by hit-testing cursor distance, then applies translate/scale/rotate with aspect-ratio lock support.
- **Crop Mode:** `startCrop()` stores backup dims, then draws a crop rectangle with corner handles. `applyCrop()` permanently mutates `item.crop` and resizes the rendered frame.

### Layer Stacking & Z-Order

Four reorder operations with identical signatures in both sketch.js and modular files:

| Function | Effect |
| :--- | :--- |
| `bringToFront(targetId)` | Moves item to end of array (renders last → on top) |
| `bringForward(targetId, n=1)` | Shifts n positions toward the front |
| `sendBackward(targetId, n=1)` | Shifts n positions toward the back |
| `sendToBack(targetId)` | Moves item to start of array (renders first → behind everything) |

Rendering uses `getSortedRenderList(isPlay)` which runs z-index sort; in play mode it additionally applies **responsive gameplay depth sorting** by Y-position of an item's bottom edge.

### History (Undo / Redo)

- `HistoryManager` stores snapshots of serialized items + variable state.
- `pushState()` runs before any destructive mutation.
- `undo()` / `redo()` restore snapshots and trigger UI refresh + chiptune confirm sounds.
- Shortcut bound: Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z for redo).

### Serialization

```js
serialize()      // -> array of plain object clones (strips p5 image handles)
deserialize(arr) // -> reconstructs items, restores images via loadImageAsset,
                 //    refreshes LayersController, PropertiesController
```

Each layer record in a serialized scene contains: id, assetId, name, src, type, theme, defaultPose/currentPose, autoplay, animSpeed, locked/hidden booleans, isSolid, isPlayable, x/y/w/h, naturalW/naturalH, rotation, flipH/flipV, and crop (x/y/w/h/isCropped). This is exactly the shape shown in the preset JSON [example](file:///C:/Users/peter/Documents/p5/code/assets/presets/sidefacing_desert_oasis_expanse.json).

### Image Export

`btn-file-export-png` triggers `canvas-to-blob` conversion; the draw() snapshot is captured at current zoom/pan. PNG is auto-downloaded with timestamp filename.

---

## 6. Visual Block Programming Engine

The crown jewel of UNIFIVE 2.0 is a full Scratch-compatible visual scripting environment. Activated by the **CODE** editor-mode toggle.

### Code Mode Workspace Layout (3 Sections)

1. **Section 1 (Left — Code Workspace):** Infinite grid background, zoom +/-/center buttons, RUN/CLEAR controls, drop zone for blocks. "SPRITE: X" target badge at top shows which canvas object the script belongs to.
2. **Section 2 (Top-Right — Stage Preview):** Mini live canvas (shrunken), with a virtual-controls toggle and minimize/expand caret.
3. **Section 3 (Bottom-Right — Objects List):** All canvas items listed as selectable cards. Select one to switch the script editor target to that sprite.

### Block Categories (8 Categories, 40+ Blocks)

| Category | Color | Contents |
| :--- | :---: | :--- |
| **Events** 🟡 | Amber | `when ⚑ clicked`, `when [sprite] clicked`, `when I receive [msg]`, `when key pressed`, `broadcast [msg]`, `when start as clone` |
| **Motion** 🔵 | Blue | `move X steps`, `turn ◁ / ▷`, `go to x:y`, `glide X secs to x:y`, `change x / y by`, `point in direction`, `if on edge bounce` |
| **Looks** 🟣 | Purple | `say [x] for Y secs`, `think [x]`, `switch costume to`, `next costume`, `change size by`, `show / hide`, `go to front / back X layers` |
| **Sound** 🟣 | Pink | `play sound [jump] until done`, `start sound [coin]`, `stop all sounds`, `play tone X Hz for Y beats`, `set volume to`, `change volume by` |
| **Control** 🟠 | Green | `wait X secs`, `repeat X`, `forever`, `if <> then`, `if <> then / else`, `repeat until <>`, `stop all`, `stop this script`, `when I start as clone` |
| **Sensing** 🔵 | Steel | `touching [sprite]?`, `touching color?`, `distance to`, `ask [q] and wait`, `answer`, `key X pressed?`, `mouse x / y`, `loudness` |
| **Operators** 🟢 | Emerald | `+ - × /`, `pick random`, `> < =`, `and / or / not`, `join words`, `letter X of Y`, `length of`, `mod`, `round`, `abs / sqrt / sin / cos / tan / ln / log / e^ / 10^` |
| **Variables** 🟧 | Orange | `make a variable…`, `set [var] to`, `change [var] by`, `show variable`, `hide variable` |

### Block Shape System

Blocks are DOM-based elements (not canvas-drawn) using CSS notches:

- **Hat blocks** (top, curved lip — only one per script stack): `when ⚑ clicked`, event triggers.
- **Stack blocks** (top notch + bottom lip): Most command blocks (motion, looks, control).
- **Reporter blocks** (rounded pill, output a value): Operators, sensing values, variable reads.
- **Boolean blocks** (6-pointed hexagon): Condition inputs for if/loop blocks.
- **C/E blocks** (dual-mouth — Control category): `if … then` (one mouth) and `if … then / else` (two mouths) — each mouth holds a nested stack.

### Runtime Interpreter

The visual script engine is step-executing with a live **execution halo** (`.executing-halo` CSS glow) on the running block so you can see logic flow visually.

Entry points:

```
start(trigger="when_flag", arg=null)     // Triggers all matching hat blocks
triggerEvent(triggerType, eventArg, id) // Fires event-type hat blocks
launchThread(rootBlock, target, tgtId)   // Spawns new async thread per script
executeBlock(block, targetItem)          // 396-LOC dispatcher → switch on opcode
evaluateCondition(str, item)             // 186-LOC string-based condition engine
evaluateReporterBlock(repBlock, item)    // Reduces reporters to values
resolveValue(identifier, item)           // Variable lookups + sprite props
```

Each block's interpreter switch has cases for every motion opcode (move, go to, glide, point), looks (say, costume, size, visibility), sound (play sfx, tone, volume), control (wait, repeat, forever, if/else, stop), sensing, operators, and variables. Audio actions call the built-in `SoundEngine.playSoundEffect(soundName)` for retro jump / coin / powerup / laser / hit effects.

### Variable System

Global & sprite-scoped variables created via a `+ MAKE A VARIABLE` modal; stored in `VariableStore` and rendered as **watcher pills** on the stage canvas (small badge overlays showing current value). Watchers are draggable on-canvas and have toggle visibility.

### Magnetic Snap

Blocks drag with pointer events; when a dragged block's edge is within 20px of a compatible mouth/notch, it snaps and plays a `playChiptuneTone(540, "square", 0.04, 0.08)` click confirmation. Connected stacks translate together when the parent hat block is dragged.

---

## 7. Sprite & Pose Animation System

### Side-Facing Pose Previews

Located in [assets/sprites/pose-previews/](file:///C:/Users/peter/Documents/p5/code/assets/sprites/pose-previews/): 10 character archetypes × 8–10 poses each.

Characters:

| Archetype | Poses Available |
| :--- | :--- |
| **Archer** | Idle ×2, Walk, Run, Jump, Attack (Arrow/Shot 1/2), Hurt, Dead |
| **Raider 1–3** | Idle, Walk, Run, Jump, Hurt, Shot (R1 only), Dead (R1/R2) |
| **Police 1–3** | Idle, Walk, Run, Jump, Hurt |
| **Wizard** | Idle ×2, Walk, Run, Jump, Hurt, Dead |
| **Trader 1–3** | Idle only |
| **Swordsman / Soldiers 1–3** | Run only |
| **Gangsters / Homeless / Vampire Girl** | Single frames |

### Top-Down Sprite Sheets (Fully Animated)

Cataloged in [assets/sprites/topdown/manifest.json](file:///C:/Users/peter/Documents/p5/code/assets/sprites/topdown/manifest.json). Each entry lists every pose with `sheet` (sprite sheet path), `preview` (single frame), `frameCount`, `frameWidth`, `frameHeight`.

**Hero: Male Swordsman** — 32 directional poses (Idle × 4 dirs, Walk × 4, Run × 4, Hurt Front/Back/Left, Death Back/Left, Attack Back/Left/Front/Right).

**Wildlife (4 species)** — Boar, Deer, Fox, Hare each have 24 poses: Idle/Walk/Run × 4 directions + Attack × 4 + Hurt × 4 + Death × 4. Every pose is a 6–12 frame sheet with uniform 64×64 tiles.

### Pose Panel Behavior

```js
renderPoseCards(item, poses)        // Builds DOM grid of cards + hover listeners
selectPose(item, poseName, data)   // Switches item.currentPose + resets frame index
preloadImage(src)                  // Warms cache via hidden new Image().onload
PoseAnimator                       // Handles hover-preview interval + canvas autoplay
```

Hovering a pose card: `setInterval` cycles the sheet frames at `animSpeed` ms per frame into a hidden mini canvas. Canvas autoplay does the same *on the live stage canvas* for the selected item (0.6x/1.0x/1.5x speed chips mutate `animSpeed` between 60/100/160 ms).

---

## 8. Audio Synthesis Engine

Everything is synthesized on the fly — **zero external audio files**. The engine is a layered abstraction:

```
SynthCore
  ├── init()              // Lazy-creates AudioContext on first user gesture
  └── playChiptuneTone(freq, type="square", duration=0.08, volume=0.1)  // raw oscillator

SoundEngine (Facade)
  ├── init()                         // SynthCore.init()
  ├── playChiptuneTone(...)          // Delegates
  ├── playAction("undo"|"redo"|"save"|"toggle_on"|"select"|"delete")
  ├── playSoundEffect("jump"|"laser"|"coin"|"powerup"|"hit")
  └── toggle()                       // Sound on/off + UI sync

SoundEffects (Preset library)
  ├── ActionHistorySounds  (undo/redo two-note descents)
  ├── ActionSaveSound      (save: E→G→C arpeggio)
  ├── ActionToggleSound    (toggle on/off two-tone confirm/reject)
  ├── PresetSynthSounds    (jump: chirp, laser: sweep, hit: thud)
  └── PresetMelodySounds   (coin: ding, powerup: ascending arpeggio)

SoundIndicator.update()   // Animates header speaker icon pulse when sound plays
```

### Waveform Types

- `square` — 90% of UI clicks (classic 8-bit chip sound).
- `triangle` — Musical notes (coin, powerup).
- `sine` — Soft ambient toggles.

### Call Volume

Per the [all_functions_report.txt](file:///C:/Users/peter/Documents/p5/code/output/all_functions_report.txt), `playChiptuneTone` is the **most-invoked function** in the entire codebase at **155 call sites** across both sketch.js and every engine module. Literally every user action (tab switch, layer reorder, block snap, pose select, color pick, crop apply, undo, save, play start) triggers 1–3 tones chained via `setTimeout`.

---

## 9. The .U5 Project Format

The `.U5` extension is UNIFIVE's custom GZIP-compressed single-file project archive. Generated/consumed by `U5Compiler` using a background Web Worker so the UI never freezes on large scenes.

### Layout of a `.U5` File (after decompression → JSON)

```jsonc
{
  "format": "UNIFIVE_U5",
  "version": "1.0.0",
  "metadata": {
    "id": "sidefacing_desert_oasis_expanse",
    "title": "The Great Desert Oasis Expanse",
    "perspective": "sidefacing",
    "author": "Paul Peter (@asterixh)",
    "description": "...",
    "createdAt": "2026-09-05T20:20:53Z",
    "itemCount": 21,
    "scriptBlockCount": 81
  },
  "worldConfig": { perspective, worldWidth, worldHeight, bgColor, panX, panY, zoom },
  "layers": [ /* array of serialized item objects */ ],
  "variables": [ { id, name, scope, value, showWatcher, watcherPos } ],
  "scripts": {
    "<spriteId>": [ /* array of block AST trees rooted at hat blocks */ ]
  },
  "assetsUsed": [ "src1", "src2" ],  // list so importer can validate
  "thumbnail": "data:image/png;base64,..."  // embedded canvas preview
}
```

### Compilation Pipeline (Save)

1. Gather active perspective's serialized layers.
2. Collect current variables state + their watcher UI positions.
3. Walk every sprite's script workspace → serialize AST (block type, inputs, children, mouths, next-block link).
4. Enumerate all asset `src`s actually referenced → dedupe list.
5. Capture canvas as PNG → base64 thumbnail.
6. Wrap into the JSON structure above.
7. **Web Worker step:** convert to Uint8Array → CompressionStream "gzip" → wrap with 4-byte magic header "U5\0\0" + 4-byte version + 4-byte JSON length → Blob.
8. `URL.createObjectURL(blob)` → auto-download `project_<timestamp>.u5`.

### Decompression Pipeline (Load)

`decompressAndLoad(fileOrBlob)` attempts two strategies:
- Primary: Read as binary → strip header → DecompressionStream "gzip" → parse JSON.
- Fallback: If GZIP fails, attempt direct JSON.parse (for legacy uncompressed exports).

Then: restore `WorldConfig`, repopulate items via `deserialize()`, re-register variables, hydrate script AST back into workspace blocks, update stats pill.

### File Menu Integration

The FILE dropdown hosts:

- **SAVE PROJECT (.U5)** — triggers compile flow.
- **EXPORT IMAGE (PNG)** — canvas snapshot.
- **LOAD FROM PRESETS** — opens the presets browser modal.
- **LOAD FROM FILE** — hidden `<input type=file id=input-load-u5 accept=".u5,.json">`.

---

## 10. Play Mode & Mobile Controls

Triggered by the **PLAY** editor-mode toggle (or `P` key). Enters `GamePlayerEngine` which takes over the draw/render loop and re-interprets canvas items as live game entities.

### Play-Mode Game Loop

```
updateGameLoop()
  ├── Read input (keyboard + virtual gamepad)
  ├── Apply to PLAYABLE hero item (walk/run/jump/attack)
  ├── For each script with "when ⚑ clicked" or "when flag clicked" hat → fire
  ├── For each forever / repeat / wait timer block → step
  ├── Physics: gravity, platform/solid collisions
  ├── Auto-go-around: if hero walks into solid corner, slide tangent to edge
  ├── Depth-sort render
  └── Draw variable watchers on top
```

### Mobile Virtual Gamepad (PSP Style)

Only visible in play mode on touch devices. Located in DOM at `#mobile-virtual-gamepad` and consists of 6 independent control groups (each individually resizable via drag handles):

| Group | Layout | Outputs |
| :--- | :--- | :--- |
| **D-Pad** (left) | Diamond 4-way + center | dpad_up/down/left/right → movement direction |
| **Analog Stick** (bottom-left) | Circular base + draggable knob | Normalized X/Y vector → smooth movement |
| **Shoulders L/R** (top) | Two rectangular buttons | l_shoulder, r_shoulder |
| **System** (bottom-center) | SELECT / START | Menu/debug triggers |
| **Action Buttons** (right) | Triangle / Circle / Cross / Square | triangle / attack(circle) / jump(cross) / square |

Resize handles appear on touch-hover at the corner of each group. `VControlResize` module persists group scale percentages.

### Input Manager

```
PlayerInputManager
  ├── init()     Registers keydown/keyup (WASD + arrows + space + z/x/c)
  ├── isDown()   True if key OR virtual button pressed
  └── axis()     Returns {x, y} normalized vector combining D-pad + stick
```

### Gameplay Events (Visual Scripts)

Once in play mode, your EVENT-category hat blocks actually fire:

- `when ⚑ clicked` → engine start.
- `when [key] pressed` → e.g. "when space pressed → jump".
- `when this sprite clicked` → pointer/tap target.
- `when I receive [message]` → from broadcast blocks.
- `touching [sprite]?` + `touching color [hex]?` → collision sensing.

---

## 11. Asset Ecosystem

### Asset Catalog: [assets.json](file:///C:/Users/peter/Documents/p5/code/assets.json)

The master registry that drives the CREATE tab. Top-level keys: `"sidefacing"` (array of categories) and `"topdown"` (array of categories). Each category:

```
{ id, name, icon (phosphor css class), description, folder, items: [...] }
```

Each item: `{ id, name, src }` — all path strings relative to project root.

### Side-Facing Asset Categories

1. **City** — 8 skyline variations × 5 parallax layers each = ~40 images (layer1 sky → layer5 foreground).
2. **Desert** — Oasis scenes with palm/waterfall layers.
3. **Forest / Beach / Industry / Platforms / Trash / City Props** — themed backgrounds + prop placement items.
4. **Sprites** — 15+ single-frame sprites for gangs, traders, police, raiders, wizards, archers.

### Top-Down Asset Categories

Under [assets/top-down-assets/](file:///C:/Users/peter/Documents/p5/code/assets/top-down-assets/):

- **dungeon/** — Walls + floors sheet, fire animation (12 sliced frames), trap animation (12 sliced frames), objects sheet, COUPON.pdf license.
- **guild-hall/** — Exterior building, 4 mages + guildmaster sprites, readers, street walls, fire animation sheet, 59 sliced guild props (banners, tables, flags, candles, castle walls × 37 variants).
- **home/** — Exterior, interior, walls/floors, cat animation, tree sway animation, smoke animation sheet, plus sliced house details.
- **path-and-road/** — 5 road variations + Roads.tmx (Tiled map file).
- **sliced/** — Bird/cat sprite animations, dungeon traps (×12), wall cracks (×9), flags, fire, 59 guild props.

### Asset Loading

`loadImageAsset(src, callback)` implements a two-level cache:
- Check `imageCache[src]` → if `loaded` invoke callback immediately.
- Otherwise, call p5 `loadImage()` and store `{ img, p5Img, naturalW, naturalH, loaded:false }`.
- On `img.onload` → record dimensions, mark loaded → callback.
- Fallback size: 320px width if detection fails.

The asset thumbnails in the CREATE gallery use `<img>` tags directly (not p5 images) so they render instantly without preload.

---

## 12. Pre-Built World Presets

Registry: [assets/presets/index.json](file:///C:/Users/peter/Documents/p5/code/assets/presets/index.json).

### Preset 1: The Great Desert Oasis Expanse (`sidefacing`)

> 5760×1080 panoramic desert world. 21 assets placed, 81 script blocks.

- **Files:**
  - Scene data → [sidefacing_desert_oasis_expanse.json](file:///C:/Users/peter/Documents/p5/code/assets/presets/sidefacing_desert_oasis_expanse.json) (full `UNIFIVE_U5` format but uncompressed so you can read it).
  - Preview images → `desert_oasis_preview.png`, `desert_oasis_3panel_preview.png`, `desert_oasis_repeat_preview.png`.
- **Contents:** 3 tiled sky repeats × 5 desert parallax layers each (locked backgrounds) + nomad trader sprites × 3 + dune raiders (armed) + palm oases props + mountain springs.
- **Scripts (81 blocks):** When-flag clicked → pan camera sweep; trader idle sway; raider patrol loops; on-click-hero jump; coin pickup detection; health variable watcher.

The "LOAD FROM PRESETS" button opens a gallery modal where each preset card shows thumbnail, name, perspective badge, author, asset count, and description. `loadPresetFile(path)` fetches the JSON, runs `deserialize` on layers, restores scripts.

### Preset 2: Metropolis Quest (`sidefacing_metropolis_quest.json`)

Referenced in file listing but no further info in the index yet — placeholder/wip scene.

---

## 13. Landing Page & Marketing Site

Located at project root: [index.html](file:///C:/Users/peter/Documents/p5/code/index.html) driven by [landing.js](file:///C:/Users/peter/Documents/p5/code/landing.js). It's a **700vh sticky-scroll presentation** modeled after physics spring LERP.

### 7 Chapter Layers (Each ≈ 100dvh)

1. **Hero** — Huge UNIFIVE logo, tagline, floating pixel "LAUNCH STUDIO" button, 3D parallax tilt.
2. **Features** — 8 feature cards (Dual Perspective, Visual Scripting, etc.) with icons; scroll animates cards in with staggered LERP reveal.
3. **Perspectives** — Side-by-side screen mockups of side-facing vs top-down views.
4. **Visual Code** — Annotated screenshot of block programming workspace.
5. **U5 Format** — Diagram showing the GZIP pipeline and .U5 archive structure.
6. **Assets** — Thumbnail gallery of 340+ pixel assets.
7. **Thank You** — Author credit, Buy Me a Coffee, socials.

### Landing.js Internals (12 functions, 221 LOC)

| Function | Purpose |
| :--- | :--- |
| `getAudioContext()` | Singleton lazy AudioContext for retro sounds |
| `playRetroSound(type)` | Jump / coin / click chiptune generators |
| `lerp(a, b, t)` | Linear interpolation (physics spring core) |
| `clamp(val, min, max)` | Bounds-keep for parallax math |
| `onScroll()` → `renderFrame()` | requestAnimationFrame loop: scroll progress → chapter index → LERP each layer's translateZ/rotateX/opacity |
| `jumpToChapter(idx)` | Programmatically scrollTo a chapter |
| `openCoffeeModal()` / `closeCoffeeModal()` | Buy Me a Coffee tiered-donation dialog |
| `updatePayPalUrl(amount)` | Compiles live PayPal checkout URL from preset tiers ($3 / $5 / $10 / custom) |
| `openMobileSidebar()` / `closeMobileSidebar()` | Slide-out nav drawer |

### SEO

Landing page includes JSON-LD structured schemas (`WebApplication`, `WebSite`, `FAQPage`), OpenGraph tags, Twitter cards, and a PWA manifest for install-to-homescreen.

---

## 14. Codebase Organization & Modularization

Per the [sketch_vs_other_functions.md](file:///C:/Users/peter/Documents/p5/code/output/sketch_vs_other_functions.md) report in the output folder, UNIFIVE is mid-refactor from a monolithic `sketch.js` (~8500 lines, 330 unique function names) toward modular files under `engine/`.

### Key Stats

| Metric | Value |
| :--- | :--- |
| **Total files** | 149 |
| **Total functions** | 610 |
| **Total function LOC** | 15,114 |
| **Unique function names** | 330 |
| **Shared (sketch.js + modules)** | 121 |
| **Only in sketch.js** | 63 |
| **Only in modular files** | 146 |

### Top 10 Largest Functions

| LOC | Function | Notes |
| :--- | :--- | :--- |
| 472 | `setup()` | sketch.js:7840 — canvas, panels, engine init |
| 435 | `init()` | sketch.js:4837 — UI controller initialization |
| 402 | `createBlockElement()` | Builds single DOM block with all notches/mouths |
| 396 | `executeBlock()` | Visual script opcode dispatcher |
| 235 | `init()` | sketch.js:1547 — panels/form controls binding |
| 187 | `draw()` | Main render loop |
| 186 | `evaluateCondition()` | Condition-string parser |
| 184 | `init()` | sketch.js:1026 — panels bootstrap |
| 182 | `draw()` (modular) | objects_renderer.js:43 |
| 182 | `selectCategory()` | Asset tab switcher in CREATE panel |

### Modular Engine Tree (`engine/`)

```
engine/
├── audio/
│   ├── action_history_sounds.js
│   ├── action_save_sound.js
│   ├── action_toggle_sound.js
│   ├── preset_melody_sounds.js     (coin + powerup)
│   ├── preset_synth_sounds.js      (jump + laser + hit)
│   ├── sound_effects.js            (playAction + playSoundEffect dispatch)
│   ├── sound_engine.js             (facade)
│   ├── sound_indicator.js          (icon pulse)
│   └── synth_core.js               (Web Audio oscillator core)
├── config/
│   ├── stage_camera.js             (getCamera + getFitZoom + reset)
│   ├── world_config.js             (pan/zoom/size/bg)
│   └── world_config_mutations.js   (setWorldSize/setBgColor/setResponsive…)
├── core/
│   ├── async_scene_store.js        (per-view save/getScene)
│   ├── async_scene_store_default.js
│   ├── async_scene_store_loader.js
│   ├── async_scene_store_saver.js
│   ├── canvas_dimensions.js        (getStageDimensions + resizeStageCanvas)
│   ├── history_manager.js          (pushState / undo / redo / clear)
│   ├── scene_serializer.js         (serialize / deserialize)
│   ├── variable_crud.js            (createVariable / deleteVariable)
│   ├── variable_manager.js         (getVariable + drawWatchers)
│   ├── variable_store.js           (backing array)
│   ├── variable_watchers.js        (stage badge init)
│   ├── watcher_interaction.js      (watchers drag-drop-click)
│   └── watcher_renderer.js         (drawWatchers with inputs)
├── lifecycle*.js                   (setup/draw/HUD/windowResized/mouseEvents)
├── player/
│   ├── game_player_engine.js       (init + updateGameLoop)
│   ├── mobile_controls.js          (gamepad groups + event wiring)
│   ├── player_input.js             (keyboard + gamepad unified API)
│   ├── player_menu.js
│   ├── vcontrol_customizer.js
│   ├── vcontrol_dom.js
│   ├── vcontrol_resize.js
│   └── vcontrol_touch.js
├── scripting/
│   ├── app_mode_controller.js      (canvas/code/play setMode + getters)
│   ├── app_mode_target.js          (target sprite badge + renderObjectsList)
│   ├── block_drag_snap.js          (magnetic snap init)
│   ├── block_palette.js            (blocks catalog + createBlockElement)
│   ├── builtin_extended.js
│   ├── code_runtime_engine.js      (sleep/toggleRun/start/stopAll/triggerE…
│   ├── compiler_loader.js
│   ├── compiler_presets.js         (open/close/load preset modal)
│   ├── eval_conditions.js
│   ├── eval_reporters.js
│   ├── mode_switcher.js
│   ├── runtime_builtins.js
│   ├── runtime_evaluator.js
│   ├── runtime_events.js
│   ├── runtime_threads.js
│   └── u5_compiler.js              (init / save / decompressAndLoad / toggleFileMenu)
├── ui/
│   ├── bottom_nav.js
│   ├── cfg_color_picker.js
│   ├── cfg_toggles.js
│   ├── config_controller.js        (syncUIFromWorldConfig)
│   ├── config_modal.js
│   ├── create_card_builder.js
│   ├── create_cat_button.js
│   ├── create_fallback_data.js     (getFallbackAssetsData — 117 LOC safety net)
│   ├── create_items.js             (renderGallery)
│   ├── create_palette.js           (loadAssetsData / renderCategories)
│   ├── create_panel_controller.js
│   ├── dock_controller.js
│   ├── dock_pointer_move_end.js    (onMove — dock drag indicator)
│   ├── drawer_navigation.js        (open/close drawer)
│   ├── drawer_toggle_buttons.js
│   ├── header_actions.js
│   ├── header_sound_fullscreen.js
│   ├── keyboard_shortcuts.js       (40-LOC binds all hotkeys)
│   ├── layers_controller.js
│   ├── layers_drag.js              (35-LOC reorder via drag-drop)
│   ├── layers_mutations.js         (moveUp / moveDown / toggleVis / toggleLock / delete)
│   ├── layers_reorder_mutations.js
│   ├── layers_toggle_mutations.js
│   ├── layers_tree.js
│   ├── mobile_navigation_controller.js
│   ├── mouse_tool_controller.js    (setTool / toggleGrid + cursor)
│   ├── mouse_tools.js
│   ├── properties_controller.js
│   ├── properties_inspector.js     (updateFromSelected 70 LOC)
│   ├── prop_name_position.js
│   ├── splitter_controller.js      (45 LOC drag-resize panes)
│   ├── stage_limits.js
│   ├── tab_controller.js           (CREATE/LAYERS/PROPS/CONFIG)
│   ├── ui_listeners.js
│   └── view_controller.js          (setView / toggleView)
└── world/
    ├── crop_controller.js          (startCrop + UI updates)
    ├── crop_events.js
    ├── crop_math.js                (applyAspectPreset + getCropTransformTarget)
    ├── crop_mutations.js           (applyCrop + resetCrop)
    ├── crop_ops.js                 (stub passthroughs)
    ├── crop_renderer.js            (drawCropOverlay 81 LOC)
    ├── objects_renderer.js         (getSortedRenderList + draw 182 LOC)
    ├── objects_store.js            (addItem / getItemAt / getSelectedItem)
    ├── objects_transform.js        (getTransformTarget + drawGizmo)
    ├── objects_zorder.js           (bringToFront / bringForward / send*)
    ├── objects_zorder_proxy.js
    ├── objects_asset_loader.js
    ├── pose_animator.js            (preload + autoplay stop)
    ├── pose_cards.js               (renderPoseCards + selectPose)
    ├── sprite_poses_controller.js  (show/hide panel)
    ├── world_objects_manager.js    (Facade: init + selectItem / addItem / …)
    ├── world_objects_ops.js
    ├── world_objects_serialization.js  (serialize / deserialize / saveHistory)
    └── world_objects_zorder_proxy.js
```

### Biggest Divergences (sketch vs modular — per audit)

| Function | sketch LOC | modular LOC | Gap | Why |
| :--- | :---: | :---: | :---: | :--- |
| `setup()` | 472 | 46 | +426 | sketch wires *everything* directly; modular just bootstraps modules |
| `executeBlock()` | 396 | 20 | +376 | sketch has opcode inline switch; modular has thin dispatcher per-block modules |
| `createBlockElement()` | 402 | 37 | +365 | sketch constructs full notch/mouth/event DOM inline; modular is a templating subset |
| `evaluateCondition()` | 186 | 3 | +183 | sketch full parser; modular proxy to eval_conditions.js |
| `decompressAndLoad()` | 159 | 56 | +103 | sketch inline full UI progress; modular only the unzip |

The modular `sketch.js → engine/` extraction is ~60% complete. ~63 functions are still sketch-only and would benefit from further extraction.

---

## 15. Output Folder Analysis Reference

The [output/](file:///C:/Users/peter/Documents/p5/code/output/) directory contains 4 files generated by automated audit scripts that catalog every function in the codebase:

### 1. `sketch_vs_other_functions.md`

The most valuable analysis. 3-section report comparing 330 unique function names across sketch.js and the engine modules.

- **Section 1 (121 shared functions):** Side-by-side table — each row compares sketch.js LOC + line numbers to engine modular LOC, noting parameter mismatches and LOC differences. Highlights the functions where modular versions are *more complete* (e.g., `createVariable`: 25 sketch → 37 modular) vs where sketch still contains the working logic (e.g., `draw`: 187 sketch → 5 lifecycle.js + 182 objects_renderer.js).
- **Section 2 (63 sketch-only):** Functions not yet moved to engine (e.g., `selectCategory`, `addBlockToWorkspace`, `layoutConnectedStacks`, `evaluateConditionBlock`). These are the candidates for next modularization pass.
- **Section 3 (146 modular-only):** New abstractions introduced during the refactor (facades, controllers, action-sound modules, mutation helpers, resize/touch/snap modules).

### 2. `audit_discrepancies.json`

Machine-readable array of ~188 discrepancy records, structured:

```jsonc
{
  "name": "setup",
  "engineFile": "engine/lifecycle.js",
  "sketchLoc": 472,
  "engineLoc": 46,
  "sketchParams": "",
  "engineParams": "",
  "locDiff": 426,
  "missingTokens": ["canvasEl", "DoubleClick", "Crop Mode", "addEventListener", "dblclick"]
}
```

Useful for automated refactor tools: `missingTokens` is a list of strings found in sketch.js's copy that don't appear in the modular file's copy — indicating which logic branches the module is missing.

### 3. `all_functions_report.txt`

Massive line-by-line complete report:

- **Stats header:** 149 files, 610 functions, 15,114 function-LOC.
- **Top 10 largest functions:** Lists setup, init variants, executeBlock, createBlockElement.
- **Top 10 most-referenced functions:** `playChiptuneTone` (155 calls), `init` (103+ calls), etc.
- **File-by-file detail:** For every of the 149 files it lists each function with: name, start/end lines, body LOC, full header, + **every call site** across the codebase (DEF + CALL notation with line numbers). Example: shows `playChiptuneTone` appearing 156 times total from module and sketch origins.

### 4. `file_functions_report.txt`

Targeted report on 4 specific files: app.js (0 functions), landing.js (12 functions, 221 LOC), player.js (0 functions), engine/ui/view_controller.js (3 functions). Confirms the 4-entry summary that app.js and player.js are just bootstrap/wiring.

---

## 16. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space + Drag` | Pan canvas viewport (any tool) |
| `Mouse Wheel` | Zoom in / out (pinch-zoom equivalent) |
| `V` | Switch perspective: Side-Facing ⇄ Top-Down |
| `1 / 2 / P` | Switch editor mode: CANVAS / CODE / PLAY |
| `Ctrl + Z` | Undo last placement / transform / block edit |
| `Ctrl + Y` or `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected canvas object (or selected blocks in Code mode) |
| `Ctrl + D` | Duplicate selected |
| `G` | Toggle coordinate grid + snap guides |
| `F` | Toggle fullscreen |
| `M` | Toggle sound |
| `Escape` | Deselect active object / close modals / exit crop mode |

All bindings registered in [engine/ui/keyboard_shortcuts.js](file:///C:/Users/peter/Documents/p5/code/engine/ui/keyboard_shortcuts.js) (40 LOC).

---

## 17. Technology Stack

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| **Core Rendering** | p5.js 1.10 / 2D Canvas API | Simplifies pixel-perfect image, camera, text drawing. No WebGL needed. |
| **UI / DOM** | Vanilla HTML5 + CSS3 | Pixel borders via layered `box-shadow` steps, `image-rendering: pixelated`. |
| **Iconography** | Phosphor Icons (unpkg CDN) | Consistent `ph-*` class system throughout the app. |
| **Typography** | Google Fonts: Pixelify Sans + Press Start 2P | Authentic retro pixel look. |
| **Audio** | Web Audio API (OscillatorNode + GainNode) | Zero audio files on disk — everything synthesized. |
| **Compression** | `CompressionStream` / `DecompressionStream` (browser-native GZIP) | No zlib library needed. Web Worker runs it off-main-thread. |
| **Storage** | IndexedDB via AsyncSceneStore + Blob URLs for .u5 | Persists scene snapshots; downloads use createObjectURL. |
| **Build Tool** | **NONE.** Zero config. | Open in any static server. No npm/node/rollup/vite. |
| **Installable** | PWA (manifest.json + service-worker-ready) | Install-to-homescreen on mobile and Chromebooks. |

---

## 18. Getting Started

### Local Setup (Zero Build Steps)

```bash
cd C:\Users\peter\Documents\p5\code

# Option A: Python 3
python -m http.server 5500

# Option B: Node (no install needed if you have npx)
npx serve .
```

Then open:
- `http://localhost:5500/` → sticky-scroll landing/marketing site
- `http://localhost:5500/app/` → studio workspace (main editor)

### Opening Pre-Built Worlds

1. In Studio → click **FILE → LOAD FROM PRESETS**.
2. Click "The Great Desert Oasis Expanse" → wait for load (21 layers, 81 blocks).
3. Switch to **CODE** mode to inspect scripts, or **PLAY** to run.

### Saving Your Own Project

1. Build a scene in CREATE tab with any assets.
2. (Optional) Add scripts in CODE mode.
3. Click **FILE → SAVE PROJECT (.U5)** → auto-downloads `project_<timestamp>.u5`.
4. Later reload with **FILE → LOAD FROM FILE** and select that `.u5`.

---

*Document generated from codebase analysis on 2026-09-10. References project root at `C:\Users\peter\Documents\p5\code`.*
