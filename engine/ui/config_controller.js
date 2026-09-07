const ConfigController = {
  init() {
    // 1. Color Picker & Swatches
    const colorPicker = document.getElementById("cfg-bg-color-picker");
    const colorText = document.getElementById("cfg-bg-color-text");
    const colorPreview = document.getElementById("color-preview-box");
    const swatches = document.querySelectorAll(".swatch-btn");

    const updateColorUI = (hex) => {
      if (colorPicker) colorPicker.value = hex;
      if (colorText) colorText.value = hex.toUpperCase();
      if (colorPreview) colorPreview.style.backgroundColor = hex;
      swatches.forEach(s => {
        s.classList.toggle("active", s.getAttribute("data-color").toLowerCase() === hex.toLowerCase());
      });
      WorldConfig.setBgColor(hex);
    };

    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => updateColorUI(e.target.value));
    }
    if (colorText) {
      colorText.addEventListener("change", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          updateColorUI(val);
        }
      });
    }
    swatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        const hex = swatch.getAttribute("data-color");
        if (hex) {
          updateColorUI(hex);
          SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    });

    // 2. World Size Inputs & Presets
    const widthInput = document.getElementById("cfg-world-width");
    const heightInput = document.getElementById("cfg-world-height");
    const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

    const updateSizeInputs = (w, h) => {
      if (widthInput) widthInput.value = w;
      if (heightInput) heightInput.value = h;
      WorldConfig.setWorldSize(w, h);
      sizeChips.forEach(chip => {
        const cw = chip.getAttribute("data-w");
        const ch = chip.getAttribute("data-h");
        chip.classList.toggle("active", parseInt(cw) === w && parseInt(ch) === h);
      });
    };

    if (widthInput) {
      widthInput.addEventListener("input", (e) => {
        WorldConfig.setWorldSize(e.target.value, WorldConfig.worldHeight);
      });
    }
    if (heightInput) {
      heightInput.addEventListener("input", (e) => {
        WorldConfig.setWorldSize(WorldConfig.worldWidth, e.target.value);
      });
    }
    sizeChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const w = parseInt(chip.getAttribute("data-w"));
        const h = parseInt(chip.getAttribute("data-h"));
        if (w && h) {
          updateSizeInputs(w, h);
          SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    });

    // 3. Responsive Gameplay Layering & Auto Go Around
    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = WorldConfig.responsiveLayering !== false;
      layeringCheckbox.addEventListener("change", (e) => {
        WorldConfig.setResponsiveLayering(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
      });
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = WorldConfig.autoGoAround !== false;
      autoGoAroundCheckbox.addEventListener("change", (e) => {
        WorldConfig.setAutoGoAround(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.04, 0.08);
      });
    }

    // Set initial values from WorldConfig
    updateColorUI(WorldConfig.bgColor);
    updateSizeInputs(WorldConfig.worldWidth, WorldConfig.worldHeight);
  },

  syncUIFromWorldConfig() {
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

    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = WorldConfig.responsiveLayering !== false;
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = WorldConfig.autoGoAround !== false;
    }
  }
};

// ============================================================================
// 6. PROPERTIES CONTROLLER & CROP ENGINE
// ============================================================================