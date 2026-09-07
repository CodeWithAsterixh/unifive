/**
 * UNIFIVE Engine - Async Scene Store Subsystem
 * In-memory session scene store coordinating perspective switching and state persistence.
 * Delegates scene object manipulation to scene_serializer.js.
 */
const AsyncSceneStore = {
  cachedScenes: {
    sidefacing: null,
    topdown: null
  },

  async init() {
    if (typeof SceneSerializer !== "undefined") {
      this.cachedScenes.sidefacing = SceneSerializer.createDefaultScene("sidefacing");
      this.cachedScenes.topdown = SceneSerializer.createDefaultScene("topdown");
    }

    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        indexedDB.deleteDatabase("UNIFIVE_STUDIO_DB");
      } catch (e) {}
    }
  },

  saveScene(viewId, sceneSnapshot) {
    this.cachedScenes[viewId] = {
      viewId: viewId,
      ...sceneSnapshot,
      lastSaved: Date.now()
    };
  },

  saveCurrentScene() {
    const currentView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
    if (typeof SceneSerializer !== "undefined") {
      const snapshot = SceneSerializer.serializeActiveScene(currentView);
      this.saveScene(currentView, snapshot);
    }
  },

  loadSceneToActive(viewId) {
    let scene = this.cachedScenes[viewId];
    if (!scene && typeof SceneSerializer !== "undefined") {
      scene = SceneSerializer.createDefaultScene(viewId);
      this.cachedScenes[viewId] = scene;
    }

    if (typeof SceneSerializer !== "undefined") {
      SceneSerializer.applySceneToActive(scene);
    }
  }
};