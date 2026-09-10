/**
 * UNIFIVE Engine - Async Scene Store Defaults Subsystem
 */
const AsyncSceneStoreDefaults = {
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
  }
};
