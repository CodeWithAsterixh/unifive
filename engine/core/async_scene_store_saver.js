/**
 * UNIFIVE Engine - Async Scene Store Saver Subsystem
 */
const AsyncSceneStoreSaver = {
  saveScene(store, viewId, sceneSnapshot) {
    store.cachedScenes[viewId] = {
      viewId: viewId,
      ...sceneSnapshot,
      lastSaved: Date.now()
    };
  },

  saveCurrentScene(store) {
    const currentView = typeof ViewController !== "undefined" && ViewController.currentView ? ViewController.currentView : "sidefacing";
    const snapshot = {
      viewId: currentView,
      worldConfig: typeof WorldConfig !== "undefined" ? {
        bgColor: WorldConfig.bgColor,
        worldWidth: WorldConfig.worldWidth,
        worldHeight: WorldConfig.worldHeight,
        panX: WorldConfig.panX,
        panY: WorldConfig.panY,
        zoom: WorldConfig.zoom,
        responsiveLayering: WorldConfig.responsiveLayering !== false,
        autoGoAround: WorldConfig.autoGoAround !== false
      } : {},
      items: typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.serialize() : [],
      undoStack: typeof HistoryManager !== "undefined" ? HistoryManager.undoStack.slice() : [],
      redoStack: typeof HistoryManager !== "undefined" ? HistoryManager.redoStack.slice() : [],
      activeCategoryId: typeof CreatePanelController !== "undefined" ? CreatePanelController.activeCategoryId : null
    };
    this.saveScene(store, currentView, snapshot);
  }
};
