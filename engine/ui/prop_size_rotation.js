/**
 * UNIFIVE Engine - Properties Size & Rotation Subsystem
 */
const PropSizeRotation = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const sizeWInput = document.getElementById("prop-size-w") || document.getElementById("prop-width");
    const sizeHInput = document.getElementById("prop-size-h") || document.getElementById("prop-height");
    const btnLockAspect = document.getElementById("btn-lock-aspect");
    const rotSlider = document.getElementById("prop-rotation-slider") || document.getElementById("prop-rotation");
    const rotNum = document.getElementById("prop-rotation-num");

    const getSel = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        return WorldObjectsManager.getSelectedItem ? WorldObjectsManager.getSelectedItem() : null;
      }
      return null;
    };

    const save = () => {
      if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
        WorldObjectsManager.saveHistory();
      }
    };

    // 1. Width input
    if (sizeWInput) {
      sizeWInput.addEventListener("input", (e) => {
        if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
        const item = getSel();
        if (!item) return;

        const newW = Math.max(8, parseFloat(e.target.value) || 10);
        const lock = (typeof PropertiesController !== "undefined" && PropertiesController.lockAspect !== false);

        if (lock && item.w > 0 && item.h > 0) {
          const ratio = item.h / item.w;
          item.w = Math.round(newW);
          item.h = Math.max(8, Math.round(newW * ratio));
          if (sizeHInput) sizeHInput.value = item.h;
        } else {
          item.w = Math.round(newW);
        }
        save();
      });
    }

    // 2. Height input
    if (sizeHInput) {
      sizeHInput.addEventListener("input", (e) => {
        if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
        const item = getSel();
        if (!item) return;

        const newH = Math.max(8, parseFloat(e.target.value) || 10);
        const lock = (typeof PropertiesController !== "undefined" && PropertiesController.lockAspect !== false);

        if (lock && item.w > 0 && item.h > 0) {
          const ratio = item.w / item.h;
          item.h = Math.round(newH);
          item.w = Math.max(8, Math.round(newH * ratio));
          if (sizeWInput) sizeWInput.value = item.w;
        } else {
          item.h = Math.round(newH);
        }
        save();
      });
    }

    // 3. Aspect lock button toggle
    if (btnLockAspect) {
      btnLockAspect.addEventListener("click", () => {
        if (typeof PropertiesController !== "undefined") {
          PropertiesController.lockAspect = !PropertiesController.lockAspect;
          btnLockAspect.classList.toggle("active", PropertiesController.lockAspect);
          btnLockAspect.innerHTML = PropertiesController.lockAspect
            ? `<i class="ph ph-lock-simple"></i> LOCK`
            : `<i class="ph ph-lock-simple-open"></i> FREE`;
        }
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(520, "sine", 0.03, 0.06);
        }
      });
    }

    // 4. Scale preset chips (50%, 100%, 150%, 200%)
    const scaleChips = document.querySelectorAll(".prop-scale-presets .prop-scale-chip");
    scaleChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const item = getSel();
        if (!item) return;

        const scale = parseFloat(chip.dataset.scale) || 1.0;
        const baseW = item.naturalW || item.w || 64;
        const baseH = item.naturalH || item.h || 64;

        item.w = Math.max(8, Math.round(baseW * scale));
        item.h = Math.max(8, Math.round(baseH * scale));

        if (sizeWInput) sizeWInput.value = item.w;
        if (sizeHInput) sizeHInput.value = item.h;

        save();
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(600, "triangle", 0.04, 0.08);
        }
      });
    });

    // 5. Rotation slider & numeric input
    const updateRot = (deg) => {
      if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
      const item = getSel();
      if (!item) return;

      const normDeg = ((Math.round(deg) % 360) + 360) % 360;
      item.rotation = normDeg;

      if (rotSlider && parseFloat(rotSlider.value) !== normDeg) rotSlider.value = normDeg;
      if (rotNum && parseFloat(rotNum.value) !== normDeg) rotNum.value = normDeg;

      save();
    };

    if (rotSlider) {
      rotSlider.addEventListener("input", (e) => updateRot(parseFloat(e.target.value) || 0));
    }
    if (rotNum) {
      rotNum.addEventListener("input", (e) => updateRot(parseFloat(e.target.value) || 0));
    }

    // 6. Quick rotation preset chips (0°, 90°, 180°, 270°)
    const rotChips = document.querySelectorAll(".prop-rotation-presets .prop-rot-chip");
    rotChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const item = getSel();
        if (!item) return;

        const targetRot = parseInt(chip.dataset.rot) || 0;
        updateRot(targetRot);

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(580, "sine", 0.03, 0.06);
        }
      });
    });
  }
};

if (typeof window !== "undefined") window.PropSizeRotation = PropSizeRotation;
if (typeof globalThis !== "undefined") globalThis.PropSizeRotation = PropSizeRotation;
