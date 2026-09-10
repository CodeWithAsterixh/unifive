/**
 * UNIFIVE World - World Objects Manager
 */
const WorldObjectsManager = {
  items: [],
  selectedId: null,
  imageCache: {},  // Shared image cache — also used by ObjectsAssetLoader (wired after load)
  dragState: { isDragging: false, mode: null, handle: null, startX: 0, startY: 0, startItemX: 0, startItemY: 0, startItemW: 0, startItemH: 0 },
  ghostPreview: { active: false, worldX: 0, worldY: 0, item: null },

  init() {
    this.initCanvasDropListeners();
    if (typeof CropController !== "undefined") CropController.init();
    if (typeof SpritePosesController !== "undefined") SpritePosesController.init();
  },

  initCanvasDropListeners() {
    const container = document.getElementById("canvas-container");
    if (!container || container.dataset.dropBound === "true") return;
    container.dataset.dropBound = "true";

    container.addEventListener("dragenter", (e) => {
      e.preventDefault();
      container.classList.add("drag-hover");
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      container.classList.add("drag-hover");

      const item = typeof CreatePanelController !== "undefined" ? CreatePanelController.draggedItem : null;
      if (!item || typeof mainCanvas === "undefined" || !mainCanvas || typeof WorldConfig === "undefined") return;

      const rect = mainCanvas.elt.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
      const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

      this.ghostPreview.active = true;
      this.ghostPreview.item = item;
      this.ghostPreview.worldX = Math.round(wx);
      this.ghostPreview.worldY = Math.round(wy);
    });

    container.addEventListener("dragleave", (e) => {
      if (e.relatedTarget && container.contains(e.relatedTarget)) return;
      container.classList.remove("drag-hover");
      this.ghostPreview.active = false;
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-hover");
      this.ghostPreview.active = false;

      let item = typeof CreatePanelController !== "undefined" ? CreatePanelController.draggedItem : null;
      if (!item) {
        try {
          const raw = e.dataTransfer && e.dataTransfer.getData("application/json");
          if (raw) item = JSON.parse(raw);
        } catch (err) {
          console.warn("Could not parse dropped item JSON", err);
        }
      }

      if (!item || typeof mainCanvas === "undefined" || !mainCanvas || typeof WorldConfig === "undefined") {
        if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = null;
        return;
      }

      const rect = mainCanvas.elt.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
      const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

      this.addItem(item, wx, wy);
      if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = null;
    });
  },

  selectItem(id) {
    if (typeof MobileControlsManager !== "undefined") {
      MobileControlsManager.clearPartSelection();
    }
    this.selectedId = id;
    if (typeof AppModeController !== "undefined") AppModeController.activeTargetId = id || "global_stage";
    const sel = this.getSelectedItem();
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(sel);
    if (typeof LayersController !== "undefined") LayersController.update();
    if (typeof AppModeController !== "undefined") AppModeController.updateTargetBadge();
    if (sel && sel.poses && typeof SpritePosesController !== "undefined") SpritePosesController.open(sel);
    else if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
    if (typeof BlockPalette !== "undefined" && typeof BlockPalette.renderCategoryBlocks === "function") {
      BlockPalette.renderCategoryBlocks(BlockPalette.activeCategory || "events");
    }
  },

  getSelectedItem() {
    for (const it of this.items) { if (it.id === this.selectedId) return it; }
    return null;
  },

  getItemAt(wx, wy) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.hidden) continue;
      const local = typeof this.worldToLocal === "function"
        ? this.worldToLocal(it, wx, wy)
        : { lx: wx - it.x, ly: wy - it.y };
      if (local.lx >= -(it.w || 40) / 2 && local.lx <= (it.w || 40) / 2 && local.ly >= -(it.h || 40) / 2 && local.ly <= (it.h || 40) / 2) return it;
    }
    return null;
  },

  addItem(assetData, x, y) {
    const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750 };
    const item = typeof ObjectsCrud !== "undefined"
      ? ObjectsCrud.createItem(assetData, x ?? cam.panX - 160, y ?? cam.panY - 90)
      : { id: "item_" + Date.now(), x: x ?? cam.panX - 160, y: y ?? cam.panY - 90, ...assetData };
    this.items.push(item);
    this.selectItem(item.id);
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
    return item;
  },

  addItemFromPalette(assetData) {
    return this.addItem(assetData);
  }
};
