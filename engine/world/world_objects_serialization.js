/**
 * UNIFIVE World - World Objects Serialization
 */
const WorldObjectsSerialization = {
  serialize() {
    const res = [];
    const items = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) ? WorldObjectsManager.items : [];
    for (const it of items) { res.push(Object.assign({}, it)); }
    return res;
  },
  deserialize(arr) {
    if (typeof WorldObjectsManager === "undefined") return;
    WorldObjectsManager.items = [];
    if (Array.isArray(arr)) {
      for (const it of arr) { WorldObjectsManager.items.push(Object.assign({}, it)); }
    }
    WorldObjectsManager.selectedId = null;
    for (const it of WorldObjectsManager.items) {
      if (it.src && typeof ObjectsAssetLoader !== "undefined") {
        ObjectsAssetLoader.loadImageAsset(it.src, function(c) { if (c.loaded && c.img) it.p5Img = c.img; });
      }
    }
  },
  bringToFront() { if (typeof ObjectsZOrder !== "undefined" && typeof WorldObjectsManager !== "undefined") { ObjectsZOrder.bringToFront(WorldObjectsManager.items, WorldObjectsManager.selectedId); if (WorldObjectsManager.saveHistory) WorldObjectsManager.saveHistory(); if (typeof LayersController !== "undefined") LayersController.update(); } },
  bringForward() { if (typeof ObjectsZOrder !== "undefined" && typeof WorldObjectsManager !== "undefined") { ObjectsZOrder.bringForward(WorldObjectsManager.items, WorldObjectsManager.selectedId); if (WorldObjectsManager.saveHistory) WorldObjectsManager.saveHistory(); if (typeof LayersController !== "undefined") LayersController.update(); } }
};
if (typeof WorldObjectsManager !== "undefined") {
  Object.assign(WorldObjectsManager, WorldObjectsSerialization);
}
