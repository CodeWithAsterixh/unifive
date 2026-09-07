const PropertiesController = {
  lockAspect: true,
  isUpdatingUI: false,

  init() {
    // 1. Name & ID
    const nameInput = document.getElementById("prop-name-input");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.name = e.target.value.trim() || "Asset";
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 2. Position Inputs (X, Y)
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");

    if (posX) {
      posX.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.x = parseInt(e.target.value) || 0;
          WorldObjectsManager.saveHistory();
        }
      });
    }

    if (posY) {
      posY.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.y = parseInt(e.target.value) || 0;
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 3. Dimension Inputs (W, H)
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");

    if (sizeW) {
      sizeW.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          const newW = Math.max(10, parseInt(e.target.value) || 10);
          if (this.lockAspect && item.w > 0) {
            const ratio = item.h / item.w;
            item.w = newW;
            item.h = Math.round(newW * ratio);
            if (sizeH) sizeH.value = item.h;
          } else {
            item.w = newW;
          }
          WorldObjectsManager.saveHistory();
        }
      });
    }

    if (sizeH) {
      sizeH.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          const newH = Math.max(10, parseInt(e.target.value) || 10);
          if (this.lockAspect && item.h > 0) {
            const ratio = item.w / item.h;
            item.h = newH;
            item.w = Math.round(newH * ratio);
            if (sizeW) sizeW.value = item.w;
          } else {
            item.h = newH;
          }
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 4. Aspect Ratio Lock Toggle
    const btnLock = document.getElementById("btn-lock-aspect");
    if (btnLock) {
      btnLock.addEventListener("click", () => {
        this.lockAspect = !this.lockAspect;
        btnLock.classList.toggle("active", this.lockAspect);
        btnLock.innerHTML = this.lockAspect 
          ? '<i class="ph ph-lock-simple"></i> LOCK' 
          : '<i class="ph ph-lock-simple-open"></i> FREE';
        SoundEngine.playChiptuneTone(this.lockAspect ? 560 : 380, "square", 0.05, 0.08);
      });
    }

    // Scale Preset Chips
    const scaleChips = document.querySelectorAll(".prop-scale-presets .prop-scale-chip");
    scaleChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const scale = parseFloat(chip.getAttribute("data-scale"));
        const item = WorldObjectsManager.getSelectedItem();
        if (item && scale && item.naturalW && item.naturalH) {
          const refW = item.crop && item.crop.isCropped ? item.crop.w : item.naturalW;
          const refH = item.crop && item.crop.isCropped ? item.crop.h : item.naturalH;
          item.w = Math.round(refW * scale);
          item.h = Math.round(refH * scale);
          this.updateFromSelected(item);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(600, "square", 0.05, 0.08);
        }
      });
    });

    // 5. Rotation Slider & Number Input
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");

    const updateRotation = (val) => {
      const item = WorldObjectsManager.getSelectedItem();
      if (item && !this.isUpdatingUI) {
        let deg = parseInt(val) || 0;
        deg = ((deg % 360) + 360) % 360;
        item.rotation = deg;
        if (rotSlider) rotSlider.value = deg;
        if (rotNum) rotNum.value = deg;
        WorldObjectsManager.saveHistory();
      }
    };

    if (rotSlider) {
      rotSlider.addEventListener("input", (e) => updateRotation(e.target.value));
    }
    if (rotNum) {
      rotNum.addEventListener("input", (e) => updateRotation(e.target.value));
    }

    // Rotation Preset Chips
    const rotChips = document.querySelectorAll(".prop-rotation-presets .prop-rot-chip");
    rotChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const deg = parseInt(chip.getAttribute("data-rot"));
        if (!isNaN(deg)) {
          updateRotation(deg);
          SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
        }
      });
    });

    // Flip H & Flip V
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");

    if (btnFlipH) {
      btnFlipH.addEventListener("click", () => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item) {
          item.flipH = !item.flipH;
          btnFlipH.classList.toggle("active", item.flipH);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    }

    if (btnFlipV) {
      btnFlipV.addEventListener("click", () => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item) {
          item.flipV = !item.flipV;
          btnFlipV.classList.toggle("active", item.flipV);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    }

    // 6. Layer Order Buttons
    const btnFront = document.getElementById("btn-bring-front");
    const btnForward = document.getElementById("btn-bring-forward");
    const btnBackward = document.getElementById("btn-send-backward");
    const btnBack = document.getElementById("btn-send-back");

    if (btnFront) btnFront.addEventListener("click", () => WorldObjectsManager.bringToFront());
    if (btnForward) btnForward.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnBackward) btnBackward.addEventListener("click", () => WorldObjectsManager.sendBackward());
    if (btnBack) btnBack.addEventListener("click", () => WorldObjectsManager.sendToBack());

    // 7. Duplicate & Delete Buttons
    const btnDuplicate = document.getElementById("btn-duplicate-item");
    const btnDelete = document.getElementById("btn-delete-item");

    // 8. Playable Hero & Device Visibility Controls
    const chkPlayable = document.getElementById("prop-is-playable");
    if (chkPlayable) {
      chkPlayable.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.isPlayable = e.target.checked;
          if (item.isPlayable) {
            // Unmark other items so there is a primary designated player
            WorldObjectsManager.items.forEach(it => {
              if (it.id !== item.id) it.isPlayable = false;
            });
          }
          WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
          SoundEngine.playChiptuneTone(item.isPlayable ? 784 : 440, "triangle", 0.05, 0.1);
        }
      });
    }

    const selectDeviceVis = document.getElementById("prop-device-visibility");
    if (selectDeviceVis) {
      selectDeviceVis.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.deviceVisibility = e.target.value || "all";
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(520, "square", 0.04, 0.08);
        }
      });
    }

    const selectCollision = document.getElementById("prop-collision-type");
    if (selectCollision) {
      selectCollision.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.isSolid = (e.target.value === "solid");
          WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          SoundEngine.playChiptuneTone(item.isSolid ? 620 : 440, "square", 0.04, 0.08);
        }
      });
    }

    // Initialize Crop Controller
    CropController.init();
  },

  updateFromSelected(item) {
    const emptyView = document.getElementById("prop-empty-state");
    const formView = document.getElementById("prop-inspector-form");

    if (!item) {
      if (emptyView) emptyView.style.display = "flex";
      if (formView) formView.style.display = "none";
      if (CropController.isActive) CropController.exitCrop(false);
      return;
    }

    if (emptyView) emptyView.style.display = "none";
    if (formView) formView.style.display = "flex";

    this.isUpdatingUI = true;

    const thumbImg = document.getElementById("prop-thumb-img");
    const nameInput = document.getElementById("prop-name-input");
    const idBadge = document.getElementById("prop-id-badge");
    const croppedBadge = document.getElementById("prop-cropped-badge");
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");
    const chkPlayable = document.getElementById("prop-is-playable");
    const selectDeviceVis = document.getElementById("prop-device-visibility");
    const selectCollision = document.getElementById("prop-collision-type");

    const cropX = document.getElementById("prop-crop-x");
    const cropY = document.getElementById("prop-crop-y");
    const cropW = document.getElementById("prop-crop-w");
    const cropH = document.getElementById("prop-crop-h");

    if (thumbImg) thumbImg.src = item.src;
    if (nameInput) nameInput.value = item.name;
    if (idBadge) idBadge.textContent = `ID: ${item.id.substring(0, 14)}`;
    if (croppedBadge) croppedBadge.style.display = (item.crop && item.crop.isCropped) ? "inline-block" : "none";
    if (posX) posX.value = Math.round(item.x);
    if (posY) posY.value = Math.round(item.y);
    if (sizeW) sizeW.value = Math.round(item.w);
    if (sizeH) sizeH.value = Math.round(item.h);
    
    const deg = Math.round(item.rotation || 0);
    if (rotSlider) rotSlider.value = deg;
    if (rotNum) rotNum.value = deg;

    if (btnFlipH) btnFlipH.classList.toggle("active", !!item.flipH);
    if (btnFlipV) btnFlipV.classList.toggle("active", !!item.flipV);
    if (chkPlayable) chkPlayable.checked = !!item.isPlayable;
    if (selectDeviceVis) selectDeviceVis.value = item.deviceVisibility || "all";
    if (selectCollision) selectCollision.value = item.isSolid ? "solid" : "pass_through";

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const c = item.crop || { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    if (cropX) cropX.value = Math.round(c.x);
    if (cropY) cropY.value = Math.round(c.y);
    if (cropW) cropW.value = Math.round(c.w);
    if (cropH) cropH.value = Math.round(c.h);

    CropController.updateUI();

    this.isUpdatingUI = false;
  }
};
