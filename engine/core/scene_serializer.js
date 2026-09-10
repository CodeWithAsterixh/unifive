/**
 * UNIFIVE Engine - Scene Serializer Subsystem
 */
const SceneSerializer = {
  serialize() {
    return {
      version: 1,
      timestamp: Date.now(),
      view: (typeof ViewController !== "undefined" && ViewController.currentView) || "topdown",
      objects: (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) ? WorldObjectsManager.items.map(it => Object.assign({}, it)) : [],
      variables: (typeof VariableStore !== "undefined") ? VariableStore.getAll() : {},
      camera: (typeof StageCamera !== "undefined") ? { x: StageCamera.x, y: StageCamera.y, zoom: StageCamera.zoom } : { x: 0, y: 0, zoom: 1 }
    };
  },
  deserialize(data) {
    if (!data || typeof data !== "object") return;
    if (data.view && typeof ViewController !== "undefined") ViewController.setView(data.view);
    if (Array.isArray(data.objects) && typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.items = data.objects.map(it => Object.assign({}, it));
      WorldObjectsManager.selectedId = null;
      if (typeof WorldObjectsManager.updateUI === "function") WorldObjectsManager.updateUI();
    }
    if (data.variables && typeof VariableStore !== "undefined") {
      VariableStore.variables = Object.assign({}, data.variables);
      if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
    }
    if (data.camera && typeof StageCamera !== "undefined") {
      StageCamera.x = data.camera.x || 0;
      StageCamera.y = data.camera.y || 0;
      StageCamera.zoom = data.camera.zoom || 1;
    }
  }
};
