/**
 * UNIFIVE World - World Objects Z-Order Proxy
 */
const WorldObjectsZOrderProxy = {
  sendBackward() { if (typeof ObjectsZOrder !== "undefined" && typeof WorldObjectsManager !== "undefined") { ObjectsZOrder.sendBackward(WorldObjectsManager.items, WorldObjectsManager.selectedId); if (WorldObjectsManager.saveHistory) WorldObjectsManager.saveHistory(); if (typeof LayersController !== "undefined") LayersController.update(); } },
  sendToBack() { if (typeof ObjectsZOrder !== "undefined" && typeof WorldObjectsManager !== "undefined") { ObjectsZOrder.sendToBack(WorldObjectsManager.items, WorldObjectsManager.selectedId); if (WorldObjectsManager.saveHistory) WorldObjectsManager.saveHistory(); if (typeof LayersController !== "undefined") LayersController.update(); } }
};
if (typeof WorldObjectsManager !== "undefined") {
  Object.assign(WorldObjectsManager, WorldObjectsZOrderProxy);
}
