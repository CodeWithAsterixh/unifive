/**
 * UNIFIVE Engine - Asynchronous Scene Store Subsystem
 */
const AsyncSceneStore = {
  cachedScenes: { sidefacing: null, topdown: null },

  async init() {
    this.cachedScenes.sidefacing = typeof AsyncSceneStoreDefaults !== "undefined" ? AsyncSceneStoreDefaults.createDefaultScene("sidefacing") : null;
    this.cachedScenes.topdown = typeof AsyncSceneStoreDefaults !== "undefined" ? AsyncSceneStoreDefaults.createDefaultScene("topdown") : null;
    if (typeof window !== "undefined" && window.indexedDB) {
      try { indexedDB.deleteDatabase("UNIFIVE_STUDIO_DB"); } catch (e) {}
    }
  },

  saveScene(viewId, sceneSnapshot) {
    if (typeof AsyncSceneStoreSaver !== "undefined") AsyncSceneStoreSaver.saveScene(this, viewId, sceneSnapshot);
  },

  saveCurrentScene() {
    if (typeof AsyncSceneStoreSaver !== "undefined") AsyncSceneStoreSaver.saveCurrentScene(this);
  },

  getScene(viewId) {
    return this.cachedScenes[viewId] || null;
  },

  loadSceneToActive(viewId) {
    if (typeof AsyncSceneStoreLoader !== "undefined") AsyncSceneStoreLoader.loadSceneToActive(this, viewId);
  }
};
