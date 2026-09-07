/**
 * UNIFIVE Engine - Stage Limits Subsystem
 * World canvas width/height size inputs and aspect preset chips.
 */
const StageLimits = {
  updateSizeInputs(w, h) {
    const widthInput = document.getElementById("cfg-world-width");
    const heightInput = document.getElementById("cfg-world-height");
    const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

    if (widthInput) widthInput.value = w;
    if (heightInput) heightInput.value = h;
    if (typeof WorldConfig !== "undefined") WorldConfig.setWorldSize(w, h);

    sizeChips.forEach(chip => {
      const cw = chip.getAttribute("data-w");
      const ch = chip.getAttribute("data-h");
      chip.classList.toggle("active", parseInt(cw) === w && parseInt(ch) === h);
    });
  },

  bindSizeControls() {
    const widthInput = document.getElementById("cfg-world-width");
    const heightInput = document.getElementById("cfg-world-height");
    const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

    if (widthInput) {
      widthInput.addEventListener("input", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setWorldSize(e.target.value, WorldConfig.worldHeight);
      });
    }
    if (heightInput) {
      heightInput.addEventListener("input", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setWorldSize(WorldConfig.worldWidth, e.target.value);
      });
    }
    sizeChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const w = parseInt(chip.getAttribute("data-w"));
        const h = parseInt(chip.getAttribute("data-h"));
        if (w && h) {
          this.updateSizeInputs(w, h);
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    });
  }
};
