/**
 * UNIFIVE Engine - Properties Bindings Subsystem
 * Event listener bindings for properties inspector inputs: dimensions, position, rotation, flip, and collisions.
 */
const PropertiesBindings = {
  bindAll(controller) {
    // 1. Name & ID
    const nameInput = document.getElementById("prop-name-input");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.name = e.target.value.trim() || "Asset";
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }

    // 2. Position Inputs (X, Y)
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");

    if (posX) {
      posX.addEventListener("input", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.x = parseInt(e.target.value) || 0;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }

    if (posY) {
      posY.addEventListener("input", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.y = parseInt(e.target.value) || 0;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }

    // 3. Dimension Inputs (W, H)
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");

    if (sizeW) {
      sizeW.addEventListener("input", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          const newW = Math.max(10, parseInt(e.target.value) || 10);
          if (controller.lockAspect && item.w > 0) {
            const ratio = item.h / item.w;
            item.w = newW;
            item.h = Math.round(newW * ratio);
            if (sizeH) sizeH.value = item.h;
          } else {
            item.w = newW;
          }
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }

    if (sizeH) {
      sizeH.addEventListener("input", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          const newH = Math.max(10, parseInt(e.target.value) || 10);
          if (controller.lockAspect && item.h > 0) {
            const ratio = item.w / item.h;
            item.h = newH;
            item.w = Math.round(newH * ratio);
            if (sizeW) sizeW.value = item.w;
          } else {
            item.h = newH;
          }
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }

    // 4. Aspect Ratio Lock Toggle
    const btnLock = document.getElementById("btn-lock-aspect");
    if (btnLock) {
      btnLock.addEventListener("click", () => {
        controller.lockAspect = !controller.lockAspect;
        btnLock.classList.toggle("active", controller.lockAspect);
        btnLock.innerHTML = controller.lockAspect 
          ? '<i class="ph ph-lock-simple"></i> LOCK' 
          : '<i class="ph ph-lock-simple-open"></i> FREE';
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(controller.lockAspect ? 560 : 380, "square", 0.05, 0.08);
      });
    }

    // Scale Preset Chips
    const scaleChips = document.querySelectorAll(".prop-scale-presets .prop-scale-chip");
    scaleChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const scale = parseFloat(chip.getAttribute("data-scale"));
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && scale && item.naturalW && item.naturalH) {
          const refW = item.crop && item.crop.isCropped ? item.crop.w : item.naturalW;
          const refH = item.crop && item.crop.isCropped ? item.crop.h : item.naturalH;
          item.w = Math.round(refW * scale);
          item.h = Math.round(refH * scale);
          controller.updateFromSelected(item);
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "square", 0.05, 0.08);
        }
      });
    });

    // 5. Rotation Slider & Number Input
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");

    const updateRotation = (val) => {
      const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (item && !controller.isUpdatingUI) {
        let deg = parseInt(val) || 0;
        deg = ((deg % 360) + 360) % 360;
        item.rotation = deg;
        if (rotSlider) rotSlider.value = deg;
        if (rotNum) rotNum.value = deg;
        if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
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
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
        }
      });
    });

    // Flip H & Flip V
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");

    if (btnFlipH) {
      btnFlipH.addEventListener("click", () => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.flipH = !item.flipH;
          btnFlipH.classList.toggle("active", item.flipH);
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    }

    if (btnFlipV) {
      btnFlipV.addEventListener("click", () => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.flipV = !item.flipV;
          btnFlipV.classList.toggle("active", item.flipV);
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    }

    // 6. Layer Order Buttons
    const btnFront = document.getElementById("btn-bring-front");
    const btnForward = document.getElementById("btn-bring-forward");
    const btnBackward = document.getElementById("btn-send-backward");
    const btnBack = document.getElementById("btn-send-back");

    if (btnFront) btnFront.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.bringToFront());
    if (btnForward) btnForward.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.bringForward());
    if (btnBackward) btnBackward.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sendBackward());
    if (btnBack) btnBack.addEventListener("click", () => typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sendToBack());

    // 7. Playable Hero & Device Visibility Controls
    const chkPlayable = document.getElementById("prop-is-playable");
    if (chkPlayable) {
      chkPlayable.addEventListener("change", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.isPlayable = e.target.checked;
          if (item.isPlayable && typeof WorldObjectsManager !== "undefined") {
            // Unmark other items so there is a primary designated player
            WorldObjectsManager.items.forEach(it => {
              if (it.id !== item.id) it.isPlayable = false;
            });
          }
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.isPlayable ? 784 : 440, "triangle", 0.05, 0.1);
        }
      });
    }

    const selectDeviceVis = document.getElementById("prop-device-visibility");
    if (selectDeviceVis) {
      selectDeviceVis.addEventListener("change", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.deviceVisibility = e.target.value || "all";
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.04, 0.08);
        }
      });
    }

    const selectCollision = document.getElementById("prop-collision-type");
    if (selectCollision) {
      selectCollision.addEventListener("change", (e) => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (item && !controller.isUpdatingUI) {
          item.isSolid = (e.target.value === "solid");
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(item.isSolid ? 620 : 440, "square", 0.04, 0.08);
        }
      });
    }
  }
};
