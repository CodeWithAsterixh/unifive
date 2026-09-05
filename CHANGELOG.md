# Changelog

All notable changes to the **UNIFIVE** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-09-05

### Added
- **Infinite Visual Scripting Canvas**:
  - Full-featured Scratch 3.0-grade visual block programming environment.
  - Scratch block categories: **Events** (🟡), **Motion** (🔵), **Looks** (🟣), **Sound** (🟣), **Control** (🟠), and **Variables** (🟧).
  - Dual-mouth `if ... else` E-blocks with independent branched statement nesting.
  - Magnetic puzzle-piece notch snapping with 8-bit snap click sound.
  - Connected stack dragging: moving any hat block smoothly moves the entire connected block tree.
  - Step-by-step runtime block interpreter with active `.executing-halo` glow and Web Audio chiptune synthesizer.
  - Custom variable creation modal (`+ MAKE A VARIABLE`) and live stage watcher pills.

- **Dual Perspectives Engine**:
  - Seamless switching between **Side-Facing Platformer** and **4-Directional Top-Down RPG**.
  - Perspective-isolated in-memory scene state caching with fresh reload lifecycle.

- **Top-Down Asset Ecosystem**:
  - Pre-sliced catalog of 340+ individual top-down assets across 6 categories: *Tiles & Roads*, *Structures*, *Nature & Rocks*, *Props & Decor*, *Dungeon*, and *Sprites*.
  - Sliced single-piece country roads, cobble curves, medieval roofs, walls, and interior items.

- **Interactive Character Poses Panel**:
  - Floating poses inspector supporting 32 directional poses for heroes and 24 poses for wildlife.
  - Live hover sequence animation previewing sprite sheet frames before placement.
  - Canvas Autoplay feature with customizable speed chips (`0.6x`, `1.0x`, `1.5x`) and aspect ratio preservation.

- **Standalone `.U5` Project Compilation**:
  - Background Web Worker packaging that compresses scene layers, transforms, script ASTs, thumbnails, and author metadata into a single `.u5` GZIP binary.
  - Export metadata configuration modal with thumbnail preview, summary badges, and customizable author notes.
  - Full project import and decompression restore engine.

- **Sticky Scroll Presentation Landing Page**:
  - 700vh scroll track with 100dvh sticky viewport modeled after physics spring LERP architecture.
  - 7 continuous 3D tilting chapter layers (Hero, Features, Perspectives, Visual Code, .U5 Format, Assets, Thank You).
  - Responsive mobile header with single-app launch button, Buy Me a Coffee action, and slide-out navigation drawer.
  - Interactive "Buy Me a Coffee" modal with tiered presets, custom USD input, and live PayPal checkout URL compilation.
  - Comprehensive SEO JSON-LD structured schemas (`WebApplication`, `WebSite`, `FAQPage`), OpenGraph, and Twitter Card tags.

---

## [1.5.0] - 2026-08-20

### Added
- Multi-layer canvas ordering with visual z-index management.
- Bounding box transformation handles (translate, resize, rotate, crop bounds).
- Background Web Audio retro synthesizer for UI feedback.
- Canvas snapshot export to PNG.

---

## [1.0.0] - 2026-07-10

### Added
- Initial in-browser 2D level editor canvas with p5.js integration.
- Asset gallery sidebar with basic sprite and tile placement.
- Local storage scene persistence and keyboard pan/zoom controls.
