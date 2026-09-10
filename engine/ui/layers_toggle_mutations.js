/**
 * UNIFIVE Engine - Layers Toggle & Delete Mutations Subsystem
 */
const LayersToggleMutations = {
  toggleVisibility(id, controller) {
    if (typeof WorldObjectsManager === "undefined") return;
    for (const item of WorldObjectsManager.items) {
      if (item.id === id) {
        item.hidden = !item.hidden;
        WorldObjectsManager.saveHistory();
        controller.update();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.hidden ? 340 : 640, "square", 0.05, 0.08);
        break;
      }
    }
  },
  toggleLock(id, controller) {
    if (typeof WorldObjectsManager === "undefined") return;
    for (const item of WorldObjectsManager.items) {
      if (item.id === id) {
        item.locked = !item.locked;
        WorldObjectsManager.saveHistory();
        controller.update();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.locked ? 300 : 600, "square", 0.05, 0.08);
        break;
      }
    }
  },
  deleteItem(id, controller) {
    if (typeof WorldObjectsManager === "undefined") return;
    const remaining = [];
    for (const it of WorldObjectsManager.items) {
      if (it.id !== id) remaining.push(it);
    }
    WorldObjectsManager.items = remaining;
    if (WorldObjectsManager.selectedId === id) {
      WorldObjectsManager.selectedId = null;
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
    }
    WorldObjectsManager.saveHistory();
    controller.update();
    if (typeof AppModeController !== "undefined") {
      AppModeController.renderObjectsList();
      AppModeController.updateTargetBadge();
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(220, "square", 0.08, 0.1);
  }
};
