/**
 * UNIFIVE Engine - Scene Serializer Subsystem
 * Scene object serialization, defaults factory, and deserialization into live studio controllers.
 */
const SceneSerializer = {
  createDefaultScene(viewId) {
    return {
      viewId: viewId,
      worldConfig: {
        bgColor: "#ffffff",
        worldWidth: 2000,
        worldHeight: 1500,
        panX: 1000,
        panY: 750,
        zoom: 1.0,
        responsiveLayering: true,
        autoGoAround: true
      },
      items: [],
      undoStack: [],
      redoStack: [],
      activeCategoryId: viewId === "sidefacing" ? "city" : "tiles"
    };
  },

  serializeActiveScene(currentView) {
    return {
      viewId: currentView,
      worldConfig: {
        bgColor: typeof WorldConfig !== "undefined" ? WorldConfig.bgColor : "#ffffff",
        worldWidth: typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000,
        worldHeight: typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500,
        panX: typeof WorldConfig !== "undefined" ? WorldConfig.panX : 1000,
        panY: typeof WorldConfig !== "undefined" ? WorldConfig.panY : 750,
        zoom: typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0,
        responsiveLayering: typeof WorldConfig !== "undefined" ? (WorldConfig.responsiveLayering !== false) : true,
        autoGoAround: typeof WorldConfig !== "undefined" ? (WorldConfig.autoGoAround !== false) : true
      },
      items: typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.serialize() : [],
      undoStack: typeof HistoryManager !== "undefined" ? HistoryManager.undoStack.slice() : [],
      redoStack: typeof HistoryManager !== "undefined" ? HistoryManager.redoStack.slice() : [],
      activeCategoryId: typeof CreatePanelController !== "undefined" ? CreatePanelController.activeCategoryId : null
    };
  },

  applySceneToActive(scene) {
    if (!scene) return;

    // 1. Restore World Configuration
    if (scene.worldConfig && typeof WorldConfig !== "undefined") {
      WorldConfig.bgColor = scene.worldConfig.bgColor || "#ffffff";
      WorldConfig.worldWidth = scene.worldConfig.worldWidth || 2000;
      WorldConfig.worldHeight = scene.worldConfig.worldHeight || 1500;
      WorldConfig.panX = typeof scene.worldConfig.panX === "number" ? scene.worldConfig.panX : Math.round(WorldConfig.worldWidth / 2);
      WorldConfig.panY = typeof scene.worldConfig.panY === "number" ? scene.worldConfig.panY : Math.round(WorldConfig.worldHeight / 2);
      WorldConfig.zoom = scene.worldConfig.zoom || 1.0;
      WorldConfig.responsiveLayering = scene.worldConfig.responsiveLayering !== false;
      WorldConfig.autoGoAround = scene.worldConfig.autoGoAround !== false;
      WorldConfig.clampPan();
    }

    // 2. Sync CONFIG Panel UI Controls
    if (typeof ConfigController !== "undefined" && ConfigController.syncUIFromWorldConfig) {
      ConfigController.syncUIFromWorldConfig();
    }

    // 3. Restore Placed World Objects
    if (typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.deserialize(scene.items || []);
    }

    // 4. Restore Undo/Redo History Stacks
    if (typeof HistoryManager !== "undefined") {
      HistoryManager.undoStack = (scene.undoStack || []).slice();
      HistoryManager.redoStack = (scene.redoStack || []).slice();
      HistoryManager.updateUI();
    }

    // 5. Restore CREATE Panel Categories & Selection
    if (typeof CreatePanelController !== "undefined") {
      CreatePanelController.activeCategoryId = scene.activeCategoryId || null;
      if (typeof CreatePalette !== "undefined") CreatePalette.renderCategories(CreatePanelController);
    }

    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }
  }
};
