/**
 * UNIFIVE World - Sprite Poses Panel UI Subsystem
 */
const SpritePosesPanel = {
  bindUI(controller) {
    controller.panelEl = document.getElementById("floating-sprite-poses-panel");
    controller.btnCloseEl = document.getElementById("btn-close-sprite-poses");
    if (controller.btnCloseEl) {
      controller.btnCloseEl.addEventListener("click", () => controller.hide());
    }
  }
};
