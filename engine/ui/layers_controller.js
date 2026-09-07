/**
 * UNIFIVE Engine - Layers Controller Subsystem
 * Aggregator for Layers panel management: toolbar reordering, item mutations, and event binding.
 * Delegates rendering to layers_tree.js and drag-and-drop to layers_drag.js.
 */
const LayersController = {
  init() {
    // 1. Header Quick Reordering Toolbar Buttons
    const btnTop = document.getElementById("btn-layer-top");
    const btnUp = document.getElementById("btn-layer-up");
    const btnDown = document.getElementById("btn-layer-down");
    const btnBot = document.getElementById("btn-layer-bot");

    if (btnTop) btnTop.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.bringToFront());
    if (btnUp) btnUp.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.bringForward());
    if (btnDown) btnDown.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sendBackward());
    if (btnBot) btnBot.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sendToBack());

    // 2. Floating Action Dock Layer Actions
    const btnDockFront = document.getElementById("btn-dock-move-front");
    const btnDockBack = document.getElementById("btn-dock-move-back");

    if (btnDockFront) btnDockFront.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.bringForward());
    if (btnDockBack) btnDockBack.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sendBackward());

    // 3. Delegate Layer Item Card clicks
    const listEl = document.getElementById("layers-items-list");
    if (listEl) {
      listEl.addEventListener("click", (e) => {
        const card = e.target.closest(".layer-item-card");
        if (!card) return;
        const id = card.getAttribute("data-id");
        if (!id) return;

        const actionBtn = e.target.closest(".layer-btn");
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.getAttribute("data-action");
          switch (action) {
            case "up": this.moveItemUp(id); break;
            case "down": this.moveItemDown(id); break;
            case "toggle-vis": this.toggleVisibility(id); break;
            case "toggle-lock": this.toggleLock(id); break;
            case "delete": this.deleteItem(id); break;
          }
          return;
        }

        if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.selectItem(id);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });

      if (typeof LayersDrag !== "undefined") {
        LayersDrag.init(listEl, (startId, uiIndexFromTop) => {
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
        });
      }
    }
  },

  update() {
    if (typeof LayersTree !== "undefined") {
      LayersTree.renderList();
    }
  },

  moveItemUp(id) {
    if (typeof WorldObjectsManager === "undefined") return;
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx >= 0 && idx < WorldObjectsManager.items.length - 1) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx + 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
    }
  },

  moveItemDown(id) {
    if (typeof WorldObjectsManager === "undefined") return;
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx > 0) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx - 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(420, "square", 0.05, 0.08);
    }
  },

  toggleVisibility(id) {
    if (typeof WorldObjectsManager === "undefined") return;
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.hidden ? 340 : 640, "square", 0.05, 0.08);
  },

  toggleLock(id) {
    if (typeof WorldObjectsManager === "undefined") return;
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.locked = !item.locked;
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.locked ? 300 : 600, "square", 0.05, 0.08);
  },

  deleteItem(id) {
    if (typeof WorldObjectsManager === "undefined") return;
    WorldObjectsManager.items = WorldObjectsManager.items.filter(it => it.id !== id);
    if (WorldObjectsManager.selectedId === id) {
      WorldObjectsManager.selectedId = null;
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
    }
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof AppModeController !== "undefined") {
      AppModeController.renderObjectsList();
      AppModeController.updateTargetBadge();
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(220, "square", 0.08, 0.1);
  }
};