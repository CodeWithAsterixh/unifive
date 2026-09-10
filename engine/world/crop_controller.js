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
    this.updateUI();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
  },

  updateUI() {
    const btnToggle = document.getElementById("btn-toggle-crop");
    const floatBar = document.getElementById("floating-crop-bar");
    if (btnToggle) btnToggle.classList.toggle("active", this.isActive);
    if (floatBar) floatBar.style.display = this.isActive ? "flex" : "none";
  }
};
