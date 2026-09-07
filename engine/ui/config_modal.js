/**
 * UNIFIVE Engine - Config Modal Subsystem
 * World background color picker, swatches, and gameplay simulation toggles.
 */
const ConfigModal = {
  updateColorUI(hex) {
    const colorPicker = document.getElementById("cfg-bg-color-picker");
    const colorText = document.getElementById("cfg-bg-color-text");
    const colorPreview = document.getElementById("color-preview-box");
    const swatches = document.querySelectorAll(".swatch-btn");

    if (colorPicker) colorPicker.value = hex;
    if (colorText) colorText.value = hex.toUpperCase();
    if (colorPreview) colorPreview.style.backgroundColor = hex;
    swatches.forEach(s => {
      s.classList.toggle("active", s.getAttribute("data-color").toLowerCase() === hex.toLowerCase());
    });
    if (typeof WorldConfig !== "undefined") WorldConfig.setBgColor(hex);
  },

  bindColorControls() {
    const colorPicker = document.getElementById("cfg-bg-color-picker");
    const colorText = document.getElementById("cfg-bg-color-text");
    const swatches = document.querySelectorAll(".swatch-btn");

    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => this.updateColorUI(e.target.value));
    }
    if (colorText) {
      colorText.addEventListener("change", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          this.updateColorUI(val);
        }
      });
    }
    swatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        const hex = swatch.getAttribute("data-color");
        if (hex) {
          this.updateColorUI(hex);
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    });
  },

  bindGameplayToggles() {
    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = typeof WorldConfig !== "undefined" && WorldConfig.responsiveLayering !== false;
      layeringCheckbox.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setResponsiveLayering(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
      });
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = typeof WorldConfig !== "undefined" && WorldConfig.autoGoAround !== false;
      autoGoAroundCheckbox.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setAutoGoAround(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.04, 0.08);
      });
    }
  }
};
