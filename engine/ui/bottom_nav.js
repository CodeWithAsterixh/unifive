/**
 * UNIFIVE Engine - Mobile Bottom Navigation Subsystem
 */
const BottomNav = {
  init(controller) {
    const navCanvas = document.getElementById("btn-mobile-nav-canvas");
    const navPlay = document.getElementById("btn-mobile-nav-play");
    const navCode = document.getElementById("btn-mobile-nav-code");

    if (navCanvas) navCanvas.addEventListener("click", () => controller.switchMode("canvas"));
    if (navPlay) navPlay.addEventListener("click", () => controller.switchMode("play"));
    if (navCode) navCode.addEventListener("click", () => controller.switchMode("code"));
  }
};
