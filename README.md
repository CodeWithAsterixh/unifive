<div align="center">

# UNIFIVE

### In-Browser 2D & Top-Down Pixel Game Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20Browser-emerald.svg)](https://unifive.web.app/)
[![Format](https://img.shields.io/badge/Project%20Format-.U5%20(GZIP)-blue.svg)](#u5-file-format)
[![Zero Build](https://img.shields.io/badge/Build%20Step-Zero%20Config-crimson.svg)](#getting-started)

**UNIFIVE** is a lightweight, zero-dependency, in-browser game studio for building 2D platformers and 4-directional top-down RPG maps with visual block programming, interactive frame-by-frame animated sprites, and standalone `.U5` project compilation.

[**Launch Studio**](https://unifive.web.app/app/) • [**Explore Features**](#features) • [**Visual Scripting**](#visual-block-programming) • [**Documentation**](docs/)

</div>

---

## Highlights

- 🎮 **Dual Perspective Modes**: Switch instantly between **Side-Facing Platformers** and **4-Directional Top-Down RPGs** with isolated layer stores.
- 🧩 **Infinite Visual Scripting Canvas**: Snap together Scratch-style puzzle blocks (*Events, Motion, Looks, Sound, Control, Variables*) with real-time step execution loops.
- 🏃 **Interactive Character Poses & Autoplay**: Floating sprite poses panel with frame sequence preview on hover, directional animation cycling, and live on-canvas autoplay.
- 📦 **Single-File `.U5` Project Packages**: GZIP-compressed project bundling that serializes all scene transforms, script ASTs, embedded icons, canvas snapshots, and author metadata via a background Web Worker.
- 🎨 **Rich Single-Piece Asset Catalog**: 340+ isolated top-down tiles, country roads, modular buildings, nature props, dungeon items, and animated heroes & wildlife.
- 🔊 **8-Bit Retro Sound Synthesizer**: Built-in Web Audio API sound synthesis for authentic retro game sound effects with zero external audio assets required.
- 📱 **Mobile & Tablet Responsive**: Touch-friendly canvas manipulation, bottom navigation bar, and responsive header drawer.

---

## Architecture Overview

```
UNIFIVE Project Architecture
├── index.html                   # 700vh Sticky Scroll Presentation & Landing Page
├── landing.css                  # Retro dark burgundy pixel stylesheet & responsive queries
├── landing.js                   # Physics spring LERP engine, chapter layers & sound synth
├── app/
│   └── index.html               # Main studio workspace (Canvas + Code split-screen)
├── sketch.js                    # Core studio engine (Canvas, Infinite Code Grid, Interpreter)
├── style.css                    # Studio pixel design system & theme variables
├── assets.json                  # Pre-sliced asset definitions and metadata index
├── assets/                      # Production textures, sprite sheets, backgrounds & tiles
├── docs/                        # Architectural documentation & technical specs
│   ├── ARCHITECTURE.md          # Core engine & state machine documentation
│   ├── U5_SPECIFICATION.md      # Binary & JSON format specification for .U5 files
│   ├── VISUAL_SCRIPTING.md      # Puzzle block catalog & runtime interpreter guide
│   └── ASSETS_GUIDE.md          # Sprite cataloging, slicing, and animation guidelines
├── manifest.json                # PWA Web App Manifest
├── CHANGELOG.md                 # Project version release history
├── CONTRIBUTING.md              # Guidelines for contributing assets & code
└── LICENSE                      # MIT Open Source License
```

---

## Features

### 1. Dual Perspectives
- **Side-Facing Platformer**: Horizontal parallax background layers, platforms, side-scrolling obstacles, and platformer sprite animations (run, jump, attack, hurt, idle).
- **Top-Down RPG**: 4-directional tilemaps, cobble/dirt country roads, medieval structures, nature rocks, and 8-directional hero and animal sprites (front, back, left, right).

### 2. Visual Block Programming
- **Magnetic Puzzle Snapping**: Drag and drop blocks near existing connection tabs with automatic notch alignment and click feedback sound.
- **Connected Stack Dragging**: Grab any parent hat/stack block to smoothly translate entire connected script trees.
- **Dual-Mouth Control E-Blocks**: Nested execution for `if <condition> then` and `else` branches.
- **Live Variables & Watchers**: Create global and sprite-scoped variables (`score`, `coins`, `health`) with on-stage display pill badges.
- **Runtime Step Halo**: Active execution highlight illuminating running blocks step-by-step.

### 3. Interactive Sprite Poses Panel
- **Frame Sequence Cycling**: Live multi-frame animation preview when hovering over any pose card.
- **Autoplay Control**: Live on-canvas animation playback toggle with configurable playback speed chips (`0.6x`, `1.0x`, `1.5x`).
- **Aspect Ratio Preservation**: Natural sprite sheet frame width/height calculations preventing horizontal or vertical distortion.

### 4. Portable `.U5` Project Format
The `.U5` format is an open, self-contained project archive:
- GZIP-compressed binary format generated via a background Web Worker.
- Stores world dimensions, background configuration, placed entity transforms (x, y, scale, rotation, layer index, crop bounds), visual block script AST trees, author metadata, and thumbnail previews.

---

## Getting Started

### Local Setup (Zero Build Steps)

UNIFIVE runs purely with vanilla JavaScript, HTML5, and Canvas. No `npm install`, Node.js bundling, or build tools are required!

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/unifive.git
   cd unifive
   ```

2. **Serve with any HTTP Server**:
   ```bash
   # Using Python 3
   python -m http.server 5500

   # Or using Node http-server / Live Server
   npx serve .
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5500/` for the landing page or `http://localhost:5500/app/` for the studio workspace.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space + Drag` | Pan Canvas Viewport |
| `Mouse Wheel` | Zoom in / Zoom out |
| `V` | Switch Perspective (Side-Facing $\leftrightarrow$ Top-Down) |
| `Ctrl + Z` | Undo Last Placement / Transform |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo Action |
| `Delete` / `Backspace` | Delete Selected Canvas Object |
| `G` | Toggle Coordinate Grid & Snap Guides |
| `Escape` | Deselect Active Object / Close Open Modals |

---

## Documentation

- [**Architecture & Engine Design**](docs/ARCHITECTURE.md)
- [**.U5 File Format Specification**](docs/U5_SPECIFICATION.md)
- [**Visual Block Scripting Guide**](docs/VISUAL_SCRIPTING.md)
- [**Assets & Sprite Poses Guide**](docs/ASSETS_GUIDE.md)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code style, submitting bug reports, and adding new pixel art tiles and sprite sheets.

---

## License

This project is open source and available under the [MIT License](LICENSE).
