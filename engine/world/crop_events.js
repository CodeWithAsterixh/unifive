/**
 * UNIFIVE World - Crop Events Subsystem
 */
const CropEvents = {
  bindEvents(controller) {
    // --- Toggle button ---
    const btnToggle = document.getElementById("btn-toggle-crop");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
        if (!item) return;
        if (controller.isActive) {
          controller.exitCrop(true);
        } else {
          controller.startCrop(item.id);
        }
      });
    }

    // --- Reset / Apply buttons (floating bar) ---
    const btnReset = document.getElementById("btn-reset-crop");
    if (btnReset) btnReset.addEventListener("click", () => controller.resetCrop());

    const btnApply = document.getElementById("btn-apply-crop");
    if (btnApply) btnApply.addEventListener("click", () => controller.applyCrop());

    // --- Canvas-level apply / cancel buttons ---
    const btnCanvasApply = document.getElementById("btn-canvas-apply-crop");
    if (btnCanvasApply) btnCanvasApply.addEventListener("click", () => {
      controller.applyCrop();
    });

    const btnCanvasCancel = document.getElementById("btn-canvas-cancel-crop");
    if (btnCanvasCancel) btnCanvasCancel.addEventListener("click", () => controller.exitCrop(false));

    // --- Numeric crop inputs ---
    const onNumericCropChange = () => {
      const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (!item) return;
      if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;

      if (!item.crop) {
        item.crop = {
          x: 0,
          y: 0,
          w: item.naturalW || item.w,
          h: item.naturalH || item.h,
          isCropped: false
        };
      }

      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;
      const cropX = document.getElementById("prop-crop-x");
      const cropY = document.getElementById("prop-crop-y");
      const cropW = document.getElementById("prop-crop-w");
      const cropH = document.getElementById("prop-crop-h");

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

    ["prop-crop-x", "prop-crop-y", "prop-crop-w", "prop-crop-h"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", onNumericCropChange);
    });

    // --- Aspect ratio chip buttons ---
    const chipBtns = document.querySelectorAll(".prop-crop-presets .prop-crop-chip");
    chipBtns.forEach(chip => {
      chip.addEventListener("click", () => {
        const aspect = chip.dataset.aspect || "free";
        controller.activeAspect = aspect;
        chipBtns.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        if (typeof controller.applyAspectPreset === "function") {
          controller.applyAspectPreset(aspect);
        }
      });
    });
  }
};
