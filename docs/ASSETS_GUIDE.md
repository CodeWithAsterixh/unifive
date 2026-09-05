# Asset Management & Sprite Poses Guide

**UNIFIVE** includes a comprehensive catalog of pre-sliced pixel art tiles, props, structures, and animated multi-pose sprites for both Side-Facing Platformers and Top-Down RPGs.

---

## 1. Asset Catalog Categories

### A. Top-Down Categories
1. **Tiles & Roads (342 single items)**:
   - Tropical land base tiles, coastlines, water edges.
   - Cobblestone and dirt country roads (straight paths, 90° curves, 3-way junctions, 4-way intersections).
   - Forest grass tufts, path transitions, and sand patches.
2. **Structures (120+ single items)**:
   - Modular medieval stone and wood houses with separate roofs, chimneys, and wooden verandas.
   - Castle fortress towers, crenellated walls, and archways.
3. **Nature & Rocks (120+ items)**:
   - Isolated boulders, mossy rocks, single trees (Summer Oak, Birch, Willow, Pine), and bushes.
4. **Props & Decor (40+ items)**:
   - Marketplace fruit stalls, tavern tables, wooden chairs, barrels, crates, lanterns, and street signposts.
5. **Dungeon (11 items)**:
   - Treasure chests (open/closed), urns, stone traps, wall torches, and floor spikes.
6. **Animated Sprites (7 Directional Heroes & Animals + 22 Props)**:
   - Male Warrior (Sword) - 32 poses
   - Male Adventurer (Unarmed) - 32 poses
   - Wild Boar - 24 poses
   - Forest Deer - 24 poses
   - Red Fox - 24 poses
   - Field Hare - 24 poses
   - Black Grouse - 24 poses
   - Animated swaying trees, house cats, flying birds, chimney smoke, and torch flames.

### B. Side-Facing Categories
1. **Backgrounds**: Seamless parallax mountain ranges, city skylines, night skies, and dungeon crypts.
2. **Terrain & Platforms**: Grass float platforms, industrial metal girders, and stone blocks.
3. **Animated Sprites**:
   - Archer, Swordsman, Trader, Cyber Police Officers, Countess Vampire, and Medieval Villagers.

---

## 2. Floating Sprite Poses Panel

When any animated sprite is selected on the canvas or clicked in the gallery, the **Floating Poses Panel** opens:

### Features:
- **Hover Preview**: Hovering over any pose card plays a live, smooth frame-by-frame animation cycle directly inside the card preview.
- **Pose Selection**: Clicking any pose card immediately updates the character on the canvas to that pose.
- **Autoplay**:
  - Toggling `AUTOPLAY: ON` plays the selected animation continuously on the stage.
  - Speed chips (`0.6x`, `1.0x`, `1.5x`) control animation frame rates.
- **Proportional Bounds**: The rendering engine dynamically computes frame boundaries to prevent sprite compression or stretching.

---

## 3. Directory Layout

```
assets/
├── backgrounds/                 # Parallax horizontal sky & mountain panoramas
├── top-down-tiles/              # 340+ Sliced individual tiles and roads
├── top-down-sprites/            # Directional heroes & wildlife sprite sheets
├── medieval-buildings/          # Sliced medieval house components & roofs
└── sprite-sheets/               # Side-facing character sequences (Archer, Swordsman)
```
