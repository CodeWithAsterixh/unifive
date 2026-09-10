/**
 * UNIFIVE Engine - Layers Controller Subsystem
 */
const LayersController = {
  init() {
    if (typeof LayersToolbarButtons !== "undefined") LayersToolbarButtons.bindToolbar();
    const listEl = document.getElementById("layers-items-list");
    if (!listEl) return;

    listEl.addEventListener("click", (e) => {
      const card = e.target.closest(".layer-item-card");
      if (!card) return;
      const vGroup = card.getAttribute("data-vcontrol-group");
      const vPart = card.getAttribute("data-vcontrol-part");
      if (vGroup && vPart && typeof MobileControlsManager !== "undefined") {
        const actionBtn = e.target.closest(".layer-btn");
        if (actionBtn) {
          const action = actionBtn.getAttribute("data-action");
          if (action === "up") MobileControlsManager.movePart(vGroup, vPart, 1);
          else if (action === "down") MobileControlsManager.movePart(vGroup, vPart, -1);
          else if (action === "toggle-vis") MobileControlsManager.togglePartVisibility(vGroup, vPart);
          return;
        }
        MobileControlsManager.selectPart(vGroup, vPart);
        return;
      }
      const id = card.getAttribute("data-id");
      if (!id) return;

      const actionBtn = e.target.closest(".layer-btn");
      if (actionBtn) {
        e.stopPropagation();
        const action = actionBtn.getAttribute("data-action");
        if (typeof LayersMutations !== "undefined") {
          if (action === "up") LayersMutations.moveItemUp(id, this);
          else if (action === "down") LayersMutations.moveItemDown(id, this);
          else if (action === "toggle-vis") LayersMutations.toggleVisibility(id, this);
          else if (action === "toggle-lock") LayersMutations.toggleLock(id, this);
          else if (action === "delete") LayersMutations.deleteItem(id, this);
        }
        return;
      }

      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.selectItem(id);
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
    });

    if (typeof LayersDrag !== "undefined") {
      LayersDrag.init(listEl, this.handleDropReorder.bind(this));
    }
  },
  handleDropReorder(startId, uiIndexFromTop) {
    if (typeof WorldObjectsManager === "undefined") return;
    const items = WorldObjectsManager.items;
    const totalItems = items.length;
    const newArrayIndex = totalItems - 1 - uiIndexFromTop;
    const fromIdx = items.findIndex(it => it.id === startId);

    if (fromIdx >= 0 && fromIdx !== newArrayIndex && newArrayIndex >= 0 && newArrayIndex < totalItems) {
      const [draggedItem] = items.splice(fromIdx, 1);
      const clampedIdx = Math.max(0, Math.min(items.length, newArrayIndex));
      items.splice(clampedIdx, 0, draggedItem);
      WorldObjectsManager.selectedId = startId;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(620, "square", 0.06, 0.1);
    }
  },
  update() {
    if (typeof LayersTree !== "undefined") {
      LayersTree.renderList();
    }
  }
};
