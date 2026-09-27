/**
 * UNIFIVE Engine - World Dimensions & Stage Limits Subsystem
 */
const StageLimits = {
  isUpdatingUI: false,

  init(controller) {
    const widthInput = document.getElementById("cfg-world-width") || document.getElementById("cfg-stage-width");
    const heightInput = document.getElementById("cfg-world-height") || document.getElementById("cfg-stage-height");
    const presetChips = document.querySelectorAll(".size-presets .preset-chip[data-w]");

    const applyDims = (w, h, updateInputs = true) => {
      if (this.isUpdatingUI) return;

      const numW = Math.max(400, Math.min(20000, parseInt(w, 10) || 2000));
      const numH = Math.max(400, Math.min(20000, parseInt(h, 10) || 1500));

      if (typeof WorldConfig !== "undefined") {
        WorldConfig.setWorldSize(numW, numH);
      }

      if (updateInputs) {
        if (widthInput && parseInt(widthInput.value, 10) !== numW) widthInput.value = numW;
        if (heightInput && parseInt(heightInput.value, 10) !== numH) heightInput.value = numH;
      }

      presetChips.forEach(chip => {
        const pw = parseInt(chip.getAttribute("data-w"), 10);
        const ph = parseInt(chip.getAttribute("data-h"), 10);
        chip.classList.toggle("active", pw === numW && ph === numH);
      });
    };

    if (widthInput) {
      widthInput.addEventListener("input", () => {
        const hVal = heightInput ? parseInt(heightInput.value, 10) : (WorldConfig ? WorldConfig.worldHeight : 1500);
        applyDims(widthInput.value, hVal, false);
      });
      widthInput.addEventListener("change", () => {
        const hVal = heightInput ? parseInt(heightInput.value, 10) : (WorldConfig ? WorldConfig.worldHeight : 1500);
        applyDims(widthInput.value, hVal, true);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.03, 0.06);
      });
    }

    if (heightInput) {
      heightInput.addEventListener("input", () => {
        const wVal = widthInput ? parseInt(widthInput.value, 10) : (WorldConfig ? WorldConfig.worldWidth : 2000);
        applyDims(wVal, heightInput.value, false);
      });
      heightInput.addEventListener("change", () => {
        const wVal = widthInput ? parseInt(widthInput.value, 10) : (WorldConfig ? WorldConfig.worldWidth : 2000);
        applyDims(wVal, heightInput.value, true);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.03, 0.06);
      });
    }

    presetChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const w = chip.getAttribute("data-w");
        const h = chip.getAttribute("data-h");
        if (w && h) {
          applyDims(w, h, true);
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(640, "triangle", 0.03, 0.06);
        }
      });
    });
  },

  syncUI(controller) {
    if (typeof WorldConfig === "undefined") return;
    this.isUpdatingUI = true;

    const currentW = WorldConfig.worldWidth || 2000;
    const currentH = WorldConfig.worldHeight || 1500;
    const widthInput = document.getElementById("cfg-world-width") || document.getElementById("cfg-stage-width");
    const heightInput = document.getElementById("cfg-world-height") || document.getElementById("cfg-stage-height");
    const presetChips = document.querySelectorAll(".size-presets .preset-chip[data-w]");

    if (widthInput) widthInput.value = currentW;
    if (heightInput) heightInput.value = currentH;

    presetChips.forEach(chip => {
      const pw = parseInt(chip.getAttribute("data-w"), 10);
      const ph = parseInt(chip.getAttribute("data-h"), 10);
      chip.classList.toggle("active", pw === currentW && ph === currentH);
    });

    this.isUpdatingUI = false;
  }
};

if (typeof window !== "undefined") window.StageLimits = StageLimits;
if (typeof globalThis !== "undefined") globalThis.StageLimits = StageLimits;
