/**
 * UNIFIVE World - World Objects Operations
 */
const WorldObjectsOps = {
  getTransformTarget(item, wx, wy) {
    return typeof ObjectsTransform !== "undefined" ? ObjectsTransform.getTransformTarget(item, wx, wy) : null;
  },
  worldToLocal(item, wx, wy) {
    return typeof ObjectsTransform !== "undefined"
      ? ObjectsTransform.worldToLocal(item, wx, wy)
      : { lx: wx - item.x, ly: wy - item.y };
  },
  saveHistory() {
    if (typeof HistoryManager !== "undefined" && typeof WorldObjectsManager !== "undefined") {
      HistoryManager.pushState({ items: WorldObjectsManager.serialize() });
    }
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
  },
  draw() {
    if (typeof ObjectsRenderer !== "undefined" && typeof WorldObjectsManager !== "undefined") {
      ObjectsRenderer.draw(WorldObjectsManager);
    }
  },
  loadImageAsset(src, cb) {
    if (typeof ObjectsAssetLoader !== "undefined") ObjectsAssetLoader.loadImageAsset(src, cb);
  }
};
if (typeof WorldObjectsManager !== "undefined") {
  Object.assign(WorldObjectsManager, WorldObjectsOps);
}
