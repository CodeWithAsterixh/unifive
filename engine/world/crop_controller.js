const CropController = {
  isActive: false,
  targetItemId: null,
  activeAspect: "free",
  savedCropBackup: null,
  savedItemDims: null,

  cropDragState: {
    isDragging: false,
    handle: null, // "nw", "n", "ne", "e", "se", "s", "sw", "w", "body"
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
        const item = WorldObjectsManager.getSelectedItem();
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
      const item = WorldObjectsManager.getSelectedItem();
      if (!item || PropertiesController.isUpdatingUI) return;
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
      WorldObjectsManager.saveHistory();
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
    const item = WorldObjectsManager.items.find(it => it.id === itemId);
    if (!item) return;

    this.isActive = true;
    this.targetItemId = itemId;
    WorldObjectsManager.selectItem(itemId);

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
    SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
  },

  applyCrop() {
    const item = WorldObjectsManager.getSelectedItem();
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
    WorldObjectsManager.saveHistory();
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(680, "square", 0.08, 0.12);
  },

  resetCrop() {
    const item = WorldObjectsManager.getSelectedItem();
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

    WorldObjectsManager.saveHistory();
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(420, "square", 0.08, 0.1);
  },

  exitCrop(keepChanges = true) {
    if (!keepChanges && this.savedCropBackup && this.targetItemId) {
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

    const item = WorldObjectsManager.getSelectedItem();
    if (item) PropertiesController.updateFromSelected(item);
  },

  applyAspectPreset(aspect) {
    const item = WorldObjectsManager.getSelectedItem();
    if (!item) return;
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    if (!item.crop) {
      item.crop = { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    }

    if (aspect === "orig") {
      item.crop.x = 0;
      item.crop.y = 0;
      item.crop.w = nw;
      item.crop.h = nh;
    } else if (aspect === "1:1") {
      const size = Math.min(nw, nh);
      item.crop.w = size;
      item.crop.h = size;
      item.crop.x = Math.round((nw - size) / 2);
      item.crop.y = Math.round((nh - size) / 2);
    } else if (aspect === "4:3") {
      let w = nw;
      let h = Math.round(w * 3 / 4);
      if (h > nh) {
        h = nh;
        w = Math.round(h * 4 / 3);
      }
      item.crop.w = w;
      item.crop.h = h;
      item.crop.x = Math.round((nw - w) / 2);
      item.crop.y = Math.round((nh - h) / 2);
    } else if (aspect === "16:9") {
      let w = nw;
      let h = Math.round(w * 9 / 16);
      if (h > nh) {
        h = nh;
        w = Math.round(h * 16 / 9);
      }
      item.crop.w = w;
      item.crop.h = h;
      item.crop.x = Math.round((nw - w) / 2);
      item.crop.y = Math.round((nh - h) / 2);
    }

    item.crop.isCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
  },

  getCropTransformTarget(item, wx, wy) {
    if (!item || !item.crop) return null;
    const { lx, ly } = WorldObjectsManager.worldToLocal(item, wx, wy);
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const cx1 = -item.w / 2 + (item.crop.x / nw) * item.w;
    const cy1 = -item.h / 2 + (item.crop.y / nh) * item.h;
    const cw1 = (item.crop.w / nw) * item.w;
    const ch1 = (item.crop.h / nh) * item.h;

    const handleHitDist = 14 / WorldConfig.zoom;

    const handles = {
      nw: [cx1, cy1],
      n:  [cx1 + cw1 / 2, cy1],
      ne: [cx1 + cw1, cy1],
      e:  [cx1 + cw1, cy1 + ch1 / 2],
      se: [cx1 + cw1, cy1 + ch1],
      s:  [cx1 + cw1 / 2, cy1 + ch1],
      sw: [cx1, cy1 + ch1],
      w:  [cx1, cy1 + ch1 / 2]
    };

    for (const [key, [hx, hy]] of Object.entries(handles)) {
      if (Math.hypot(lx - hx, ly - hy) <= handleHitDist) {
        return { mode: "crop", handle: key, lx, ly };
      }
    }

    if (lx >= cx1 && lx <= cx1 + cw1 && ly >= cy1 && ly <= cy1 + ch1) {
      return { mode: "crop", handle: "body", lx, ly };
    }

    return null;
  },

  drawCropOverlay(item) {
    push();
    translate(item.x + item.w / 2, item.y + item.h / 2);
    rotate(radians(item.rotation || 0));
    scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const w = item.w;
    const h = item.h;

    const c = item.crop || { x: 0, y: 0, w: nw, h: nh };
    const cx1 = -w / 2 + (c.x / nw) * w;
    const cy1 = -h / 2 + (c.y / nh) * h;
    const cw1 = (c.w / nw) * w;
    const ch1 = (c.h / nh) * h;

    // 1. Darkened outer shroud
    fill(0, 0, 0, 160);
    noStroke();
    // Top strip
    rect(-w / 2, -h / 2, w, cy1 - (-h / 2));
    // Bottom strip
    rect(-w / 2, cy1 + ch1, w, (h / 2) - (cy1 + ch1));
    // Left strip
    rect(-w / 2, cy1, cx1 - (-w / 2), ch1);
    // Right strip
    rect(cx1 + cw1, cy1, (w / 2) - (cx1 + cw1), ch1);

    // 2. Rule of thirds grid
    stroke(255, 255, 255, 70);
    strokeWeight(1);
    line(cx1 + cw1 / 3, cy1, cx1 + cw1 / 3, cy1 + ch1);
    line(cx1 + (cw1 * 2) / 3, cy1, cx1 + (cw1 * 2) / 3, cy1 + ch1);
    line(cx1, cy1 + ch1 / 3, cx1 + cw1, cy1 + ch1 / 3);
    line(cx1, cy1 + (ch1 * 2) / 3, cx1 + cw1, cy1 + (ch1 * 2) / 3);

    // 3. Crop box border
    stroke(121, 247, 167);
    strokeWeight(2);
    noFill();
    rect(cx1, cy1, cw1, ch1);

    // 4. 8 Heavy Corner & Edge Brackets
    stroke(254, 204, 27);
    strokeWeight(3.5);
    strokeCap(SQUARE);
    const bLen = Math.min(16, Math.min(cw1, ch1) / 3);

    // NW
    line(cx1, cy1, cx1 + bLen, cy1);
    line(cx1, cy1, cx1, cy1 + bLen);
    // NE
    line(cx1 + cw1, cy1, cx1 + cw1 - bLen, cy1);
    line(cx1 + cw1, cy1, cx1 + cw1, cy1 + bLen);
    // SE
    line(cx1 + cw1, cy1 + ch1, cx1 + cw1 - bLen, cy1 + ch1);
    line(cx1 + cw1, cy1 + ch1, cx1 + cw1, cy1 + ch1 - bLen);
    // SW
    line(cx1, cy1 + ch1, cx1 + bLen, cy1 + ch1);
    line(cx1, cy1 + ch1, cx1, cy1 + ch1 - bLen);

    // Edges
    line(cx1 + cw1 / 2 - bLen / 2, cy1, cx1 + cw1 / 2 + bLen / 2, cy1);
    line(cx1 + cw1 / 2 - bLen / 2, cy1 + ch1, cx1 + cw1 / 2 + bLen / 2, cy1 + ch1);
    line(cx1, cy1 + ch1 / 2 - bLen / 2, cx1, cy1 + ch1 / 2 + bLen / 2);
    line(cx1 + cw1, cy1 + ch1 / 2 - bLen / 2, cx1 + cw1, cy1 + ch1 / 2 + bLen / 2);

    // 5. Crop Size Tag Badge
    const cropTag = `CROP: ${Math.round(c.w)}x${Math.round(c.h)} PX`;
    textSize(9);
    const tagW = textWidth(cropTag) + 12;
    fill(13, 2, 5, 230);
    stroke(121, 247, 167);
    strokeWeight(1);
    rect(cx1 + cw1 / 2 - tagW / 2, cy1 - 22, tagW, 16);

    fill(121, 247, 167);
    noStroke();
    textAlign(CENTER, CENTER);
    text(cropTag, cx1 + cw1 / 2, cy1 - 14);

    pop();
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

// ============================================================================
// SPRITE POSES CONTROLLER (Floating Animated Poses Drawer)
// ============================================================================