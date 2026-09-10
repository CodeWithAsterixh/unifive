/**
 * UNIFIVE Engine - Layers Toolbar Buttons Subsystem
 */
const LayersToolbarButtons = {
  bindToolbar() {
    document.addEventListener("click", (e) => {
      if (typeof WorldObjectsManager === "undefined") return;
      const target = e.target.closest("#btn-layer-top, #btn-layer-up, #btn-layer-down, #btn-layer-bot, #btn-dock-move-front, #btn-dock-move-back");
      if (!target) return;
      const id = target.id;
      if (typeof MobileControlsManager !== "undefined" && MobileControlsManager.selectedGroup && MobileControlsManager.selectedPart) {
        if (id === "btn-layer-top" || id === "btn-layer-up" || id === "btn-dock-move-front") MobileControlsManager.movePart(MobileControlsManager.selectedGroup, MobileControlsManager.selectedPart, 1);
        else if (id === "btn-layer-down" || id === "btn-layer-bot" || id === "btn-dock-move-back") MobileControlsManager.movePart(MobileControlsManager.selectedGroup, MobileControlsManager.selectedPart, -1);
        return;
      }
      if (id === "btn-layer-top") WorldObjectsManager.bringToFront();
      else if (id === "btn-layer-up" || id === "btn-dock-move-front") WorldObjectsManager.bringForward();
      else if (id === "btn-layer-down" || id === "btn-dock-move-back") WorldObjectsManager.sendBackward();
      else if (id === "btn-layer-bot") WorldObjectsManager.sendToBack();
    });
  }
};
