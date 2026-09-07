/**
 * UNIFIVE Engine - Bottom Nav Subsystem
 * Mobile viewport bottom navigation buttons: Canvas mode, Play mode, and Code mode transitions.
 */
const BottomNav = {
  bindBottomNav(controller) {
    const btnNavPlay = document.getElementById("btn-mobile-nav-play");
    if (btnNavPlay) {
      btnNavPlay.addEventListener("click", () => {
        if (typeof GamePlayer !== "undefined") {
          GamePlayer.togglePlay();
        } else if (typeof GamePlayerEngine !== "undefined") {
          if (GamePlayerEngine.isPlaying) GamePlayerEngine.exit();
          else GamePlayerEngine.enter();
        }
        controller.closeDrawer();
      });
    }

    const btnNavCanvas = document.getElementById("btn-mobile-nav-canvas");
    if (btnNavCanvas) {
      btnNavCanvas.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("canvas");
        }
        controller.closeDrawer();
      });
    }

    const btnNavCode = document.getElementById("btn-mobile-nav-code");
    if (btnNavCode) {
      btnNavCode.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("code");
        }
        controller.closeDrawer();
      });
    }
  }
};
