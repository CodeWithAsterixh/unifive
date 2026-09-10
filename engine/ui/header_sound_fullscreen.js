/**
 * UNIFIVE Engine - Header Sound & Fullscreen Subsystem
 */
const HeaderSoundFullscreen = {
  bind() {
    this.bindButtons();
  },

  bindButtons() {
    const btnSound = document.getElementById("btn-sound");
    const btnFs = document.getElementById("btn-fullscreen");

    if (btnSound) {
      btnSound.addEventListener("click", () => {
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.toggle();
        }
      });
    }

    if (btnFs) {
      btnFs.addEventListener("click", () => {
        if (typeof FullscreenMode !== "undefined") FullscreenMode.toggleFullscreen();
      });
    }

    document.addEventListener("fullscreenchange", () => {
      const icon = document.getElementById("fullscreen-icon");
      const btn = document.getElementById("btn-fullscreen");
      if (!icon || !btn) return;
      if (document.fullscreenElement) {
        btn.classList.add("active");
        icon.className = "ph ph-corners-in";
      } else {
        btn.classList.remove("active");
        icon.className = "ph ph-corners-out";
      }
    });
  }
};
