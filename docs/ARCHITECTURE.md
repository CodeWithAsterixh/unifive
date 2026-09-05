# UNIFIVE Architecture & Engine Design

This document details the architectural principles, subsystems, and runtime state machines powering **UNIFIVE**.

---

## 1. System Overview

UNIFIVE is designed around a zero-dependency, high-performance web architecture combining HTML5 Canvas, Web Audio API, and Background Web Workers.

```
+-------------------------------------------------------------------------+
|                              UNIFIVE STUDIO                             |
+------------------------------------+------------------------------------+
|            CANVAS ENGINE           |      VISUAL SCRIPTING ENGINE       |
|  - World Transforms & Viewport     |  - Infinite Dotted Code Grid       |
|  - Multi-Layer Render Pipeline     |  - Magnetic Puzzle Block Snapping  |
|  - Object Bounds & Crop Tool       |  - Connected Stack Dragging        |
|  - Sprite Sheet Frame Cycler       |  - Step-by-Step Runtime Executor   |
+------------------------------------+------------------------------------+
|                             CORE SERVICES                               |
|  - In-Memory Perspective Store (Side-Facing vs Top-Down Isolation)      |
|  - Web Audio 8-Bit Retro Synthesizer (Zero Audio File Footprint)        |
|  - Background Web Worker .U5 GZIP Compilation & Decompression           |
|  - Unified Asset Catalog & Poses Metadata Inspector                     |
+-------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### A. Perspective & Scene Store (`AsyncSceneStore`)
UNIFIVE provides two distinct game perspective modes:
1. **Side-Facing Platformer**: Optimized for gravity, horizontal parallax, and side-scrolling platformer mechanics.
2. **Top-Down RPG**: Optimized for 4-directional tilemaps, country road curves, nature rocks, and directional hero/wildlife sprites.

Each perspective maintains its own isolated world configuration, placed layers, and script block ASTs:
- Switching perspectives (`V` key or topbar switch) serializes the active scene into memory and instantly restores the target perspective's scene graph without page reloading.
- Every browser refresh initializes with a clean, in-memory session.

### B. Canvas Render Pipeline (`WorldObjectsManager`)
The canvas renderer executes in `p5.js` / HTML5 Canvas with the following order:
1. **Background Layer**: Dynamic grid, clear color, and world boundary bounds (`2000 × 1500`).
2. **Placed Entity Layers (Sorted by Z-Index)**:
   - Base Tiles & Roads (bottom layer)
   - Structures & Buildings
   - Props & Nature Decor
   - Dynamic Animated Sprites & Heroes (top layers)
3. **Interactive Overlays**:
   - Object Selection Bounding Box (locked in Code Mode, transformable in Canvas Mode)
   - Real-time Crop Marquee Box (Crop Tool)
   - Coordinate Snapping Guidelines

### C. Visual Scripting Engine (`CodeWorkspaceController`)
The visual programming workspace provides an infinite, pannable 2D workspace:
- **Block Representation**: Structured DOM puzzle elements styled with authentic Scratch geometry (hat arches, notch indents, tabs, and dual-mouth E-blocks).
- **Magnetic Snapping Engine**: Computes Euclidean proximity between dragged block notches and existing blocks, rendering a dashed golden target indicator when within the 28px snap threshold.
- **Hierarchical Stack Traversal**: Moving a root hat block automatically queries all nested child elements and translates the entire tree synchronously.

### D. Step-by-Step Interpreter (`ScriptInterpreter`)
When scripts are triggered (Green Flag, Spacebar, Object Click, or `RUN`):
- Converts the block DOM tree into an executable Abstract Syntax Tree (AST).
- Evaluates statements sequentially using `async / await` and yields control via `requestAnimationFrame` to ensure zero UI thread freezing during loops (`repeat`, `forever`).
- Applies a pulsing `.executing-halo` yellow-green outline to the currently active statement.
- Dispatches realtime effects (speech bubbles, coordinate movement, rotation, frame cycling, variable score increments, audio chiptune tones).

### E. Background Web Worker Compilation (`WorkerCompiler`)
Project export avoids main-thread latency by leveraging a dedicated background Web Worker:
- Serializes world state, placed entities, script trees, canvas snapshot thumbnail, and metadata.
- Applies standard GZIP stream compression (`pako` / `CompressionStream`).
- Outputs the downloadable `.u5` file directly to the user.

---

## 3. Keyboard & Mouse Input State Machine

```
               [ Mouse Down ]
                    |
      +-------------+-------------+
      |                           |
[ On Canvas Object ]       [ On Empty Stage ]
      |                           |
[ Drag / Transform ]         [ Pan World View ]
      |                           |
[ Mouse Up -> History Push ] [ Mouse Up -> Idle ]
```

---

## 4. Performance & Optimization

- **Zero Heavy Bundles**: No Webpack/Vite runtime overhead; loads instantaneously.
- **Pixel-Art Crispness**: Uses `image-rendering: pixelated` and integer coordinate rounding to prevent subpixel blur.
- **Audio Context Recycling**: Automatically initializes and resumes Web Audio API contexts on first user gesture.
