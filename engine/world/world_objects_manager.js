/**
 * UNIFIVE World - Objects Manager Aggregator
 * Orchestrates objects storage, transformation gizmos, and p5 canvas drawing.
 */
const WorldObjectsManager = {
  get items() {
    return ObjectsStore.items;
  },
  set items(val) {
    ObjectsStore.items = val;
  },

  get imageCache() {
    return ObjectsStore.imageCache;
  },
  set imageCache(val) {
    ObjectsStore.imageCache = val;
  },

  get selectedId() {
    return ObjectsStore.selectedId;
  },
  set selectedId(val) {
    ObjectsStore.selectedId = val;
  },

  dragState: {
    isDragging: false,
    mode: null,
    handle: null,
    startX: 0,
    startY: 0,
    startItemX: 0,
    startItemY: 0,
    startItemW: 0,
    startItemH: 0,
    startAngle: 0,
    initialAngle: 0,
    anchorX: 0,
    anchorY: 0
  },

  ghostPreview: {
    active: false,
    item: null,
    worldX: 0,
    worldY: 0
  },

  init() {
    this.initCanvasDropListeners();
    this.initKeyboardListeners();
  },

  initCanvasDropListeners() {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    container.addEventListener("dragenter", (e) => {
      e.preventDefault();
      container.classList.add("drag-hover");
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      container.classList.add("drag-hover");

      if (typeof mainCanvas !== "undefined" && mainCanvas && typeof WorldConfig !== "undefined") {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
        const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

        this.ghostPreview.active = true;
        this.ghostPreview.item = typeof CreatePanelController !== "undefined" ? CreatePanelController.draggedItem : null;
        this.ghostPreview.worldX = Math.round(wx);
        this.ghostPreview.worldY = Math.round(wy);
      }
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
          const raw = e.dataTransfer.getData("application/json");
          if (raw) item = JSON.parse(raw);
        } catch (err) {
          console.warn("Could not parse dropped item JSON", err);
        }
      }

      if (item && typeof mainCanvas !== "undefined" && mainCanvas && typeof WorldConfig !== "undefined") {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
        const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

        this.addItem(item, wx, wy);
      }
    });
  },

  initKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && this.selectedId && e.target.tagName !== "INPUT") {
        e.preventDefault();
        this.deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && this.selectedId && e.target.tagName !== "INPUT") {
        e.preventDefault();
        this.duplicateSelected();
      }
    });
  },

  loadImageAsset(src, callback) {
    return ObjectsStore.loadImageAsset(src, callback);
  },

  addItem(assetData, targetX, targetY) {
    return ObjectsStore.addItem(assetData, targetX, targetY);
  },

  selectItem(id) {
    return ObjectsStore.selectItem(id);
  },

  worldToLocal(item, wx, wy) {
    return ObjectsTransform.worldToLocal(item, wx, wy);
  },

  getTransformTarget(item, wx, wy) {
    return ObjectsTransform.getTransformTarget(item, wx, wy);
  },

  getItemAt(worldX, worldY) {
    return ObjectsStore.getItemAt(worldX, worldY);
  },

  getSelectedItem() {
    return ObjectsStore.getSelectedItem();
  },

  bringForward(targetId = null, count = 1) {
    return ObjectsStore.bringForward(targetId, count);
  },

  sendBackward(targetId = null, count = 1) {
    return ObjectsStore.sendBackward(targetId, count);
  },

  bringToFront(targetId = null) {
    return ObjectsStore.bringToFront(targetId);
  },

  sendToBack(targetId = null) {
    return ObjectsStore.sendToBack(targetId);
  },

  moveLayerFront(targetId, count = 1) {
    return ObjectsStore.bringForward(targetId, count);
  },

  moveLayerBack(targetId, count = 1) {
    return ObjectsStore.sendBackward(targetId, count);
  },

  duplicateSelected() {
    return ObjectsStore.duplicateSelected();
  },

  deleteSelected() {
    return ObjectsStore.deleteSelected();
  },

  clearAll() {
    return ObjectsStore.clearAll();
  },

  serialize() {
    return ObjectsStore.serialize();
  },

  deserialize(serializedItems) {
    return ObjectsStore.deserialize(serializedItems);
  },

  saveHistory() {
    return ObjectsStore.saveHistory();
  },

  drawGizmo(item) {
    return ObjectsTransform.drawGizmo(item);
  },

  getSortedRenderList(isPlay = false) {
    return ObjectsRenderer.getSortedRenderList(this.items, isPlay);
  },

  draw() {
    return ObjectsRenderer.draw(this);
  }
};