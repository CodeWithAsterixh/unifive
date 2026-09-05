# Visual Block Scripting Guide

**UNIFIVE** integrates a full Scratch 3.0-grade visual programming engine that enables developers to program game mechanics, physics reactions, sound synthesis, and state changes with zero syntax errors.

---

## 1. Block Categories

| Category | Color | Icon | Purpose |
| :--- | :--- | :--- | :--- |
| **EVENTS** | 🟡 Yellow (`#eab308`) | `ph-flag-banner` | Triggers script execution (Flag clicked, Key pressed, Sprite clicked) |
| **MOTION** | 🔵 Blue (`#3b82f6`) | `ph-arrows-out-cardinal` | Controls coordinate translation ($x, y$), rotation, velocity, and boundary bounce |
| **LOOKS** | 🟣 Purple (`#a855f7`) | `ph-chat-circle-text` | Comic speech bubbles, pose switching, visibility toggles, and size scaling |
| **SOUND** | 🟣 Magenta (`#ec4899`) | `ph-speaker-high` | Realtime Web Audio 8-bit retro sound synthesis (Jump, Laser, Coin, Fanfare) |
| **CONTROL** | 🟠 Orange (`#f97316`) | `ph-git-fork` | Loops (`repeat`, `forever`), wait delays, and dual-mouth `if ... else` E-blocks |
| **VARS** | 🟧 Amber (`#f59e0b`) | `ph-brackets-curly` | Global and local variable tracking with on-stage HUD watchers |

---

## 2. Block Anatomy & Puzzle Geometry

- **Hat Blocks** (Top Arch + Bottom Tab):
  ```
     ╭───────────────╮
    │  when 🚩 clicked │
    ╰───╮       ╭───╯
        ╰───────╯  <-- Bottom Male Tab
  ```
- **Stack Blocks** (Top Notch + Bottom Tab):
  ```
        ╭───────╮
    ╭───╯       ╰───╮ <-- Top Female Notch
    │ move (10) steps │
    ╰───╮       ╭───╯
        ╰───────╯  <-- Bottom Male Tab
  ```
- **Dual-Mouth E-Blocks (`if ... else`)**:
  ```
        ╭───────╮
    ╭───╯       ╰───╮
    │ if <touching edge> then
    │ ╭─── [IF BODY BLOCKS]
    │ ╰───
    │ else
    │ ╭─── [ELSE BODY BLOCKS]
    │ ╰───
    ╰───────────────╯
  ```

---

## 3. Magnetic Snapping Workflow

1. **Grab a Block**: Drag any block from the left **Blocks Palette** into the infinite code canvas.
2. **Bring Close to a Notch**: Move the block within 28 pixels of an existing stack notch.
3. **Target Indicator**: A glowing dashed golden highlight (`.snap-preview-line`) illuminates directly beneath the target block.
4. **Drop**: Release mouse. The block snaps flush into position with an 8-bit snap click tone!
5. **Move Connected Stack**: Grabbing a parent block moves the entire subtree in perfect synchronization.
6. **Detach Subtrees**: Grabbing any child block detaches it and its descendants cleanly from the parent.

---

## 4. Runtime Execution Loop

Clicking the green **RUN** button (or Green Flag) starts execution:
- The button transforms into a pulsing red **STOP** button.
- The active block illuminates with an animated **yellow-green halo glow** (`.executing-halo`) as execution steps through each block.
- `async / await` execution yields frames via `requestAnimationFrame` to ensure high FPS stage rendering even inside `forever` loops.
- Variable watchers update in real-time in the stage HUD.

---

## 5. Scripting Recipes

### A. Arrow Key Character Movement
```
when [right arrow] key pressed
  change x by (15)
  next pose
```

### B. Coin Collection & Score Increment
```
when 🚩 clicked
  forever
    if <touching [Coin_1]> then
      change [score] by (1)
      play sound [coin] until done
      say ["+1 Point!"] for (1) secs
```

### C. Patrol Enemy
```
when 🚩 clicked
  forever
    repeat (10)
      move (5) steps
      wait (0.1) secs
    turn ↻ (180) degrees
```
