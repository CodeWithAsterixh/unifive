/**
 * UNIFIVE Engine - Async Scene Store Loader Subsystem
 */
const AsyncSceneStoreLoader = {
  loadSceneToActive(store, viewId) {
    let scene = store.cachedScenes[viewId];
    if (!scene) {
      scene = typeof AsyncSceneStoreDefaults !== "undefined" ? AsyncSceneStoreDefaults.createDefaultScene(viewId) : { viewId };
      store.cachedScenes[viewId] = scene;
    }

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

    if (typeof ConfigController !== "undefined" && ConfigController.syncUIFromWorldConfig) {
      ConfigController.syncUIFromWorldConfig();
    }
    if (typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.deserialize(scene.items || []);
    }
    if (typeof HistoryManager !== "undefined") {
      HistoryManager.undoStack = (scene.undoStack || []).slice();
      HistoryManager.redoStack = (scene.redoStack || []).slice();
      HistoryManager.updateUI();
    }
    if (typeof CreatePanelController !== "undefined" && typeof CreatePanelController.renderCategories === "function") {
      CreatePanelController.activeCategoryId = scene.activeCategoryId || null;
      CreatePanelController.renderCategories();
    }
    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }
  }
};
