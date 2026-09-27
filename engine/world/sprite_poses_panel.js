/**
 * UNIFIVE World - Sprite Poses Panel UI Subsystem
 */
const SpritePosesPanel = {
  bindUI(controller) {
    controller.panelEl = document.getElementById("floating-sprite-poses-panel");
    controller.gridEl = document.getElementById("sprite-poses-grid");
    controller.btnCloseEl = document.getElementById("btn-close-sprite-poses");
    controller.btnMinimizeEl = document.getElementById("btn-minimize-sprite-poses");
    controller.charNameEl = document.getElementById("sprite-poses-char-name");
    controller.themeBadgeEl = document.getElementById("sprite-poses-theme-badge");
    controller.countEl = document.getElementById("sprite-poses-count");

    if (controller.btnCloseEl) {
      controller.btnCloseEl.addEventListener("click", () => controller.hide());
    }

    if (controller.btnMinimizeEl && controller.panelEl) {
      controller.btnMinimizeEl.addEventListener("click", () => {
        controller.panelEl.classList.toggle("minimized");
      });
    }
  }
};

if (typeof window !== "undefined") window.SpritePosesPanel = SpritePosesPanel;
if (typeof globalThis !== "undefined") globalThis.SpritePosesPanel = SpritePosesPanel;

