/**
 * UNIFIVE Engine - Config Controller Subsystem
 * Aggregator coordinating world size constraints (stage_limits.js) and config panel UI (config_modal.js).
 */
const ConfigController = {
  init() {
    if (typeof ConfigModal !== "undefined") {
      ConfigModal.bindColorControls();
      ConfigModal.bindGameplayToggles();
    }
    if (typeof StageLimits !== "undefined") {
      StageLimits.bindSizeControls();
    }

    // Set initial values from WorldConfig
    if (typeof WorldConfig !== "undefined") {
      if (typeof ConfigModal !== "undefined") ConfigModal.updateColorUI(WorldConfig.bgColor);
      if (typeof StageLimits !== "undefined") StageLimits.updateSizeInputs(WorldConfig.worldWidth, WorldConfig.worldHeight);
    }
  },

  syncUIFromWorldConfig() {
    if (typeof WorldConfig === "undefined") return;

    if (typeof ConfigModal !== "undefined") {
      const colorPicker = document.getElementById("cfg-bg-color-picker");
      const colorText = document.getElementById("cfg-bg-color-text");
      const colorPreview = document.getElementById("color-preview-box");
      const swatches = document.querySelectorAll(".swatch-btn");

      const hex = WorldConfig.bgColor;
      if (colorPicker) colorPicker.value = hex;
      if (colorText) colorText.value = hex.toUpperCase();
      if (colorPreview) colorPreview.style.backgroundColor = hex;
      swatches.forEach(s => {
        s.classList.toggle("active", s.getAttribute("data-color").toLowerCase() === hex.toLowerCase());
      });

      const layeringCheckbox = document.getElementById("cfg-responsive-layering");
      if (layeringCheckbox) {
        layeringCheckbox.checked = WorldConfig.responsiveLayering !== false;
      }

      const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
      if (autoGoAroundCheckbox) {
        autoGoAroundCheckbox.checked = WorldConfig.autoGoAround !== false;
      }
    }

    if (typeof StageLimits !== "undefined") {
      const widthInput = document.getElementById("cfg-world-width");
      const heightInput = document.getElementById("cfg-world-height");
      const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

      if (widthInput) widthInput.value = WorldConfig.worldWidth;
      if (heightInput) heightInput.value = WorldConfig.worldHeight;
      sizeChips.forEach(chip => {
        const cw = parseInt(chip.getAttribute("data-w"));
        const ch = parseInt(chip.getAttribute("data-h"));
        chip.classList.toggle("active", cw === WorldConfig.worldWidth && ch === WorldConfig.worldHeight);
      });
    }
  }
};