/**
 * UNIFIVE World - Crop & Slice Controller
 */
const CropController = {
  isActive: false,
  targetItemId: null,
  activeAspect: "free",
  savedCropBackup: null,
  savedItemDims: null,
  cropDragState: { isDragging: false, handle: null, startX: 0, startY: 0, startLx: 0, startLy: 0, startCrop: { x: 0, y: 0, w: 0, h: 0 } },

  init() {
    if (typeof CropEvents !== "undefined") CropEvents.bindEvents(this);
  },

  startCrop(itemId) {
    let item = null;
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      for (const it of WorldObjectsManager.items) { if (it.id === itemId) { item = it; break; } }
    }
    if (!item) return;

    this.isActive = true;
    this.targetItemId = itemId;

    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.selectItem(itemId);

    if (!item.crop) {
      item.crop = {
        x: 0,
        y: 0,
        w: item.naturalW || item.w,
        h: item.naturalH || item.h,
        isCropped: false
      };
    }

    this.savedCropBackup = { ...item.crop };
    this.savedItemDims = { w: item.w, h: item.h, x: item.x, y: item.y };

    this.updateUI();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
  },

  exitCrop(keepChanges = true) {
    if (!keepChanges && this.savedCropBackup && this.targetItemId) {
      let item = null;
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
        for (const it of WorldObjectsManager.items) { if (it.id === this.targetItemId) { item = it; break; } }
      }
      if (item) {
        item.crop = { ...this.savedCropBackup };
        if (this.savedItemDims) {
          item.w = this.savedItemDims.w;
          item.h = this.savedItemDims.h;
          item.x = this.savedItemDims.x;
          item.y = this.savedItemDims.y;
        }
      }
    }

    this.isActive = false;
    this.targetItemId = null;
    this.cropDragState.isDragging = false;
    this.updateUI();

    const selected = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (selected && typeof PropertiesController !== "undefined") {
      PropertiesController.updateFromSelected(selected);
    }
  },

  updateUI() {
    const btnToggle = document.getElementById("btn-toggle-crop");
    const labelToggle = document.getElementById("btn-toggle-crop-label");
    const floatBar = document.getElementById("floating-crop-bar");

    if (btnToggle) {
      btnToggle.classList.toggle("active", this.isActive);
      if (labelToggle) {
        labelToggle.textContent = this.isActive ? "EXIT CROP" : "CROP ON CANVAS";
      }
    }

    if (floatBar) {
      floatBar.style.display = this.isActive ? "flex" : "none";
    }
  }
};
