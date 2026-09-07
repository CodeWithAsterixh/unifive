/**
 * UNIFIVE World - Crop & Slice Controller
 * Aggregator for interactive item cropping, aspect ratios, handles, and canvas overlays.
 */
const CropController = {
  isActive: false,
  targetItemId: null,
  activeAspect: "free",
  savedCropBackup: null,
  savedItemDims: null,

  cropDragState: {
    isDragging: false,
    handle: null,
    startX: 0,
    startY: 0,
    startLx: 0,
    startLy: 0,
    startCrop: { x: 0, y: 0, w: 0, h: 0 }
  },

  init() {
    const btnToggle = document.getElementById("btn-toggle-crop");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (!item) return;
        if (this.isActive) {
          this.exitCrop(true);
        } else {
          this.startCrop(item.id);
        }
      });
    }

    const btnReset = document.getElementById("btn-reset-crop");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        this.resetCrop();
      });
    }

    const cropChips = document.querySelectorAll(".prop-crop-presets .prop-crop-chip");
    cropChips.forEach(chip => {
      chip.addEventListener("click", () => {
        cropChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.activeAspect = chip.getAttribute("data-aspect");
        this.applyAspectPreset(this.activeAspect);
      });
    });

    const cropX = document.getElementById("prop-crop-x");
    const cropY = document.getElementById("prop-crop-y");
    const cropW = document.getElementById("prop-crop-w");
    const cropH = document.getElementById("prop-crop-h");

    const onNumericCropChange = () => {
      const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (!item || (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI)) return;
      if (!item.crop) {
        item.crop = { x: 0, y: 0, w: item.naturalW || item.w, h: item.naturalH || item.h, isCropped: false };
      }
      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;

      let cx = Math.max(0, Math.min(nw - 4, parseInt(cropX ? cropX.value : 0) || 0));
      let cy = Math.max(0, Math.min(nh - 4, parseInt(cropY ? cropY.value : 0) || 0));
      let cw = Math.max(4, Math.min(nw - cx, parseInt(cropW ? cropW.value : nw) || nw));
      let ch = Math.max(4, Math.min(nh - cy, parseInt(cropH ? cropH.value : nh) || nh));

      item.crop.x = cx;
      item.crop.y = cy;
      item.crop.w = cw;
      item.crop.h = ch;
      item.crop.isCropped = (cx > 0 || cy > 0 || cw < nw || ch < nh);
      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    };

    [cropX, cropY, cropW, cropH].forEach(input => {
      if (input) input.addEventListener("input", onNumericCropChange);
    });

    const btnApply = document.getElementById("btn-apply-crop");
    if (btnApply) {
      btnApply.addEventListener("click", () => {
        this.applyCrop();
      });
    }

    const btnCanvasApply = document.getElementById("btn-canvas-apply-crop");
    const btnCanvasCancel = document.getElementById("btn-canvas-cancel-crop");

    if (btnCanvasApply) btnCanvasApply.addEventListener("click", () => this.applyCrop());
    if (btnCanvasCancel) btnCanvasCancel.addEventListener("click", () => this.exitCrop(false));
  },

  startCrop(itemId) {
    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.items.find(it => it.id === itemId) : null;
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

  applyCrop() {
    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!item) {
      this.exitCrop(false);
      return;
    }

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const isActuallyCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
    item.crop.isCropped = isActuallyCropped;

    if (isActuallyCropped) {
      const oldW = item.w;
      const oldH = item.h;
      const cx = item.x + oldW / 2;
      const cy = item.y + oldH / 2;

      const scaleX = oldW / nw;
      const scaleY = oldH / nh;
      const scale = (scaleX + scaleY) / 2;

      item.w = Math.max(20, Math.round(item.crop.w * scale));
      item.h = Math.max(20, Math.round(item.crop.h * scale));
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }

    this.exitCrop(true);
    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(680, "square", 0.08, 0.12);
  },

  resetCrop() {
    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!item) return;

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;

    item.crop = {
      x: 0,
      y: 0,
      w: nw,
      h: nh,
      isCropped: false
    };

    const ratio = nw / nh;
    if (item.w / item.h !== ratio) {
      item.h = Math.round(item.w / ratio);
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }

    if (this.isActive) {
      this.exitCrop(true);
    }

    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(420, "square", 0.08, 0.1);
  },

  exitCrop(keepChanges = true) {
    if (!keepChanges && this.savedCropBackup && this.targetItemId && typeof WorldObjectsManager !== "undefined") {
      const item = WorldObjectsManager.items.find(it => it.id === this.targetItemId);
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

    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (item && typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
  },

  applyAspectPreset(aspect) {
    return CropMath.applyAspectPreset(aspect);
  },

  getCropTransformTarget(item, wx, wy) {
    return CropMath.getCropTransformTarget(item, wx, wy);
  },

  drawCropOverlay(item) {
    return CropRenderer.drawCropOverlay(item);
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