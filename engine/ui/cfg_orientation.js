/**
 * UNIFIVE Engine - Config Orientation Subsystem
 * Manages game orientation (Landscape, Portrait, Auto) for runtime player and mobile experiences.
 */
const CfgOrientation = {
  init(controller) {
    this.bindOrientationChips();
  },

  bindOrientationChips() {
    const chips = document.querySelectorAll(".orientation-presets .preset-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const orientation = chip.dataset.orientation || "landscape";
        if (typeof WorldConfig !== "undefined") {
          WorldConfig.setOrientation(orientation);
        }
        chips.forEach(c => c.classList.toggle("active", c === chip));
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(580, "sine", 0.04, 0.08);
        }
      });
    });
  },

  syncUI(controller) {
    if (typeof WorldConfig === "undefined") return;
    const currentOrientation = WorldConfig.orientation || "landscape";
    const chips = document.querySelectorAll(".orientation-presets .preset-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", chip.dataset.orientation === currentOrientation);
    });
  }
};

if (typeof window !== "undefined") window.CfgOrientation = CfgOrientation;
if (typeof globalThis !== "undefined") globalThis.CfgOrientation = CfgOrientation;
