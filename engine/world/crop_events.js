/**
 * UNIFIVE World - Crop Events Subsystem
 */
const CropEvents = {
  bindEvents(controller) {
    const btnToggle = document.getElementById("btn-toggle-crop");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        if (controller.isActive) controller.exitCrop ? controller.exitCrop(true) : (controller.isActive = false);
        else {
          const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
          if (item) controller.startCrop(item.id);
        }
      });
    }
    const btnReset = document.getElementById("btn-reset-crop");
    if (btnReset) btnReset.addEventListener("click", () => controller.resetCrop());
    const btnApply = document.getElementById("btn-apply-crop");
    if (btnApply) btnApply.addEventListener("click", () => controller.applyCrop());
  }
};
