/**
 * UNIFIVE Engine - Layers Reorder Mutations Subsystem
 */
const LayersReorderMutations = {
  moveItemUp(id, controller) {
    if (typeof WorldObjectsManager === "undefined") return;
    const items = WorldObjectsManager.items;
    const idx = items.findIndex(it => it.id === id);
    if (idx >= 0 && idx < items.length - 1) {
      const item = items.splice(idx, 1)[0];
      items.splice(idx + 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      controller.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
    }
  },
  moveItemDown(id, controller) {
    if (typeof WorldObjectsManager === "undefined") return;
    const items = WorldObjectsManager.items;
    const idx = items.findIndex(it => it.id === id);
    if (idx > 0) {
      const item = items.splice(idx, 1)[0];
      items.splice(idx - 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      controller.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(420, "square", 0.05, 0.08);
    }
  }
};
