/**
 * UNIFIVE Engine - Player Menu & Modals Subsystem
 */
const PlayerMenu = {
  bindUI(engine) {
    document.addEventListener("click", (e) => {
      const target = e.target.closest("#btn-mode-play, #btn-mobile-nav-play, #btn-player-pause, #btn-player-fullscreen, #btn-player-exit, #btn-pause-resume, #btn-pause-customize-controls, #btn-pause-restart, #btn-pause-exit, #btn-gameover-retry, #btn-gameover-exit");
      if (!target) return;
      const id = target.id;
      if (id === "btn-mode-play" || id === "btn-mobile-nav-play") engine.togglePlay();
      else if (id === "btn-player-pause") engine.togglePause();
      else if (id === "btn-player-fullscreen") engine.toggleFullscreen();
      else if (id === "btn-player-exit" || id === "btn-pause-exit" || id === "btn-gameover-exit") engine.exit();
      else if (id === "btn-pause-resume") engine.resume();
      else if (id === "btn-pause-customize-controls") { if (typeof MobileControlsManager !== "undefined") MobileControlsManager.openCustomizer(); }
      else if (id === "btn-pause-restart" || id === "btn-gameover-retry") engine.restart();
    });
  },

  pause(engine) {
    engine.isPaused = true;
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) {
      pauseModal.style.display = "flex";
      const btnCustomize = document.getElementById("btn-pause-customize-controls");
      if (btnCustomize && typeof MobileControlsManager !== "undefined") {
        btnCustomize.style.display = MobileControlsManager.customizationEnabled ? "flex" : "none";
      }
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(392, "square", 0.06, 0.1);
  },

  resume(engine) {
    engine.isPaused = false;
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) pauseModal.style.display = "none";
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(587, "square", 0.06, 0.1);
  },

  triggerGameOver(engine, finalScore, finalCoins) {
    engine.isPaused = true;
    const modal = document.getElementById("modal-player-gameover");
    const scoreEl = document.getElementById("gameover-final-score");
    const coinsEl = document.getElementById("gameover-final-coins");
    if (scoreEl) scoreEl.textContent = finalScore;
    if (coinsEl) coinsEl.textContent = finalCoins;
    if (modal) modal.style.display = "flex";
    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(330, "square", 0.15, 0.2);
    }
  }
};
