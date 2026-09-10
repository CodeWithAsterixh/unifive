/**
 * UNIFIVE Engine - Mobile Navigation Controller Subsystem
 */
const MobileNavigationController = {
  init() {
    if (typeof BottomNav !== "undefined") BottomNav.init(this);
  },
  closeDrawer() {
    const controlsPane = document.getElementById("controls-pane");
    const codeToolbox = document.getElementById("code-toolbox-pane");
    if (controlsPane) controlsPane.classList.remove("mobile-drawer-open");
    if (codeToolbox) codeToolbox.classList.remove("mobile-drawer-open");
  },
  switchMode(mode) {
    if (typeof AppModeController !== "undefined") {
      AppModeController.setMode(mode);
    }
  }
};
