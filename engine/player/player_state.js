/**
 * UNIFIVE Engine - Player Scene State & Snapshot Subsystem
 */
const PlayerState = {
  captureSnapshot(engine) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;
    const itemsClone = WorldObjectsManager.items.map(it => Object.assign({}, it));
    let varsClone = [];
    if (typeof VariableManager !== "undefined" && VariableManager.variables) {
      varsClone = JSON.parse(JSON.stringify(VariableManager.variables));
    }
    engine.sceneSnapshot = {
      items: itemsClone,
      variables: varsClone,
      worldConfig: {
        panX: typeof WorldConfig !== "undefined" ? WorldConfig.panX : 1000,
        panY: typeof WorldConfig !== "undefined" ? WorldConfig.panY : 750,
        zoom: typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0
      }
    };
  },
  restoreSnapshot(engine, clearSnapshot = true) {
    if (!engine.sceneSnapshot) return;
    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.deserialize(engine.sceneSnapshot.items);
    if (typeof VariableManager !== "undefined" && engine.sceneSnapshot.variables) {
      VariableManager.variables = JSON.parse(JSON.stringify(engine.sceneSnapshot.variables));
    }
    if (engine.sceneSnapshot.worldConfig && typeof WorldConfig !== "undefined") {
      WorldConfig.panX = engine.sceneSnapshot.worldConfig.panX;
      WorldConfig.panY = engine.sceneSnapshot.worldConfig.panY;
      WorldConfig.zoom = engine.sceneSnapshot.worldConfig.zoom;
      if (typeof WorldConfig.clampPan === "function") WorldConfig.clampPan();
    }
    if (clearSnapshot) engine.sceneSnapshot = null;
  },
  resolveInitialPlayableCharacter(engine) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;
    const items = WorldObjectsManager.items;
    let hero = null;
    for (const it of items) {
      if (it.isPlayable && !it.hidden) { hero = it; break; }
    }
    if (!hero) {
      for (const it of items) {
        const n = (it.name || "").toLowerCase();
        if ((n.includes("hero") || n.includes("player") || n.includes("archer") || n.includes("swordsman") || n.includes("warrior")) && !it.hidden) {
          hero = it; break;
        }
      }
    }
    if (!hero) {
      for (const it of items) {
        if ((it.type === "sprite" || (it.assetId && it.assetId.startsWith("sprite_")) || it.poses) && !it.hidden) {
          hero = it; break;
        }
      }
    }
    engine.activePlayableId = hero ? hero.id : null;
    engine.activePlayableItem = hero || null;
  }
};
