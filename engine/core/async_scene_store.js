/**
 * UNIFIVE - Pixelated Burgundy Workspace
 * Top-Down vs Side-Facing Isolated Scene Store (Non-blocking IndexedDB Backend)
 * + CREATE / CONFIG Tabs + World & Pan System + Floating Mouse/Grid Action Dock + Drag & Drop.
 */

// ============================================================================
// 1. SESSION SCENE STORE (In-Memory Session Storage - Fresh on Reload)
// ============================================================================
const AsyncSceneStore = {
  // In-memory cache for fast zero-latency perspective switching during the active session
  cachedScenes: {
    sidefacing: null,
    topdown: null
  },

  async init() {
    // Fresh session on every page load
    this.cachedScenes.sidefacing = this.createDefaultScene("sidefacing");
    this.cachedScenes.topdown = this.createDefaultScene("topdown");

    // Clear any previous persistent IndexedDB records to guarantee fresh reload
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
    const currentView = typeof ViewController !== "undefined" && ViewController.currentView ? ViewController.currentView : "sidefacing";
    const snapshot = {
      viewId: currentView,
      worldConfig: {
        bgColor: WorldConfig.bgColor,
        worldWidth: WorldConfig.worldWidth,
        worldHeight: WorldConfig.worldHeight,
        panX: WorldConfig.panX,
        panY: WorldConfig.panY,
        zoom: WorldConfig.zoom,
        responsiveLayering: WorldConfig.responsiveLayering !== false,
        autoGoAround: WorldConfig.autoGoAround !== false
      },
      items: typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.serialize() : [],
      undoStack: typeof HistoryManager !== "undefined" ? HistoryManager.undoStack.slice() : [],
      redoStack: typeof HistoryManager !== "undefined" ? HistoryManager.redoStack.slice() : [],
      activeCategoryId: typeof CreatePanelController !== "undefined" ? CreatePanelController.activeCategoryId : null
    };
    this.saveScene(currentView, snapshot);
  },

  getScene(viewId) {
    return this.cachedScenes[viewId] || null;
  },

  loadSceneToActive(viewId) {
    let scene = this.getScene(viewId);
    if (!scene) {
      scene = this.createDefaultScene(viewId);
      this.cachedScenes[viewId] = scene;
    }

    // 1. Restore World Configuration
    if (scene.worldConfig) {
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
      CreatePanelController.renderCategories();
    }

    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }
  },

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

// ============================================================================
// 2. WORLD STATE & PAN SYSTEM
// ============================================================================