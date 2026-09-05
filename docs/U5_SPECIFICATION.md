# .U5 File Format Specification (v1.0.0)

This document defines the binary format, schema structure, and serialization guidelines for the **`.U5`** project package format used in **UNIFIVE**.

---

## 1. Overview

The `.U5` format is an open, self-contained, and compressed project archive. It packages an entire 2D platformer or top-down RPG scene into a single portable file that can be shared, versioned, or loaded in UNIFIVE with zero external asset dependencies.

- **File Extension**: `.u5`
- **MIME Type**: `application/x-unifive-package`
- **Compression**: Standard GZIP (`application/gzip`)
- **Encoding**: UTF-8 JSON inside GZIP envelope

---

## 2. Package Schema Structure

Once decompressed, the root payload is a JSON object with the following top-level keys:

```json
{
  "format": "UNIFIVE_PROJECT",
  "version": "1.0.0",
  "meta": {
    "title": "Archer_Forest_Quest",
    "author": "PixelArtist",
    "version": "1.0.0",
    "description": "An epic top-down forest journey with visual block scripts.",
    "perspective": "topdown",
    "generator": "UNIFIVE Studio v2.0",
    "timestamp": 1788609000000,
    "exportedAt": "2026-09-05T12:00:00.000Z",
    "icon": "data:image/png;base64,...",
    "thumbnail": "data:image/png;base64,..."
  },
  "world": {
    "worldWidth": 2000,
    "worldHeight": 1500,
    "bgColor": "#1a0b12",
    "panX": 0,
    "panY": 0,
    "zoom": 1.0
  },
  "layers": [
    {
      "id": "layer_archer_1",
      "assetId": "topdown_warrior_sword",
      "type": "sprite",
      "title": "Male Warrior (Sword)",
      "x": 450,
      "y": 320,
      "width": 64,
      "height": 64,
      "scaleX": 1.0,
      "scaleY": 1.0,
      "rotation": 0,
      "zIndex": 10,
      "isLocked": false,
      "currentPose": "attack_front",
      "crop": {
        "x": 0,
        "y": 0,
        "w": 64,
        "h": 64
      }
    }
  ],
  "scripts": {
    "layer_archer_1": [
      {
        "id": "block_event_flag_1",
        "category": "events",
        "type": "when_flag_clicked",
        "x": 120,
        "y": 80,
        "next": "block_motion_move_1"
      },
      {
        "id": "block_motion_move_1",
        "category": "motion",
        "type": "move_steps",
        "params": {
          "steps": 20
        },
        "next": "block_looks_say_1"
      },
      {
        "id": "block_looks_say_1",
        "category": "looks",
        "type": "say_for_secs",
        "params": {
          "text": "Adventure awaits!",
          "secs": 2
        },
        "next": null
      }
    ]
  },
  "variables": [
    {
      "name": "score",
      "value": 0,
      "scope": "global",
      "isWatcherVisible": true
    }
  ]
}
```

---

## 3. Section Definitions

### A. `meta` (Project Metadata)
- `title` (*string*): Project name displayed in header and exports.
- `author` (*string*): Creator handle or username.
- `perspective` (*enum*): `"sidefacing"` or `"topdown"`.
- `icon` (*string*): Base64 PNG snapshot of the main object icon.
- `thumbnail` (*string*): Base64 PNG snapshot of the live canvas at compilation time.

### B. `world` (Stage Configuration)
- `worldWidth` (*integer*): Canvas boundary width in stage pixels.
- `worldHeight` (*integer*): Canvas boundary height in stage pixels.
- `bgColor` (*string*): Hex color string of the scene backdrop.
- `panX`, `panY`, `zoom` (*float*): Viewport camera offsets.

### C. `layers` (Placed Entities)
Array of all placed stamps, tiles, structures, and character sprites ordered by render stacking:
- `zIndex` (*integer*): Stacking order.
- `crop` (*object*): Sub-region clipping bounds if cropped with the Canvas Crop Tool.
- `currentPose` (*string*): Active pose animation key.

### D. `scripts` (Visual Block Code AST)
Dictionary keyed by `layerId`, mapping to an array of block nodes:
- `category` (*string*): Block family (`events`, `motion`, `looks`, `sound`, `control`, `vars`).
- `params` (*object*): User-configurable numbers, text strings, or booleans.
- `next` (*string|null*): Pointer to the connected child block ID.
- `branchIf`, `branchElse` (*array|null*): Nested statement children for dual-mouth E-blocks.

### E. `variables` (State & Watchers)
Array of custom created game variables:
- `scope`: `"global"` (available across all sprites) or `"local"` (attached to parent entity).
- `isWatcherVisible`: Boolean indicating if the on-stage HUD pill badge is rendered.

---

## 4. Decompression & Validation Pipeline

1. **Header Check**: Read first 2 bytes to confirm GZIP magic bytes (`0x1F`, `0x8B`).
2. **Decompress**: Pass Uint8Array to `DecompressionStream('gzip')` or `pako.inflate()`.
3. **JSON Parse**: Parse UTF-8 string into JavaScript Object.
4. **Validation**: Assert `format === "UNIFIVE_PROJECT"` and valid `version`.
5. **Stage Hydration**: Rebuild objects into `WorldObjectsManager` and populate block AST into `CodeWorkspaceController`.
