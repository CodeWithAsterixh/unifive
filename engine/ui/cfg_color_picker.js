/**
 * UNIFIVE Engine - Config Color Picker & Background Swatches Subsystem
 */
const CfgColorPicker = {
  isUpdatingUI: false,

  init(controller) {
    const bgPicker = document.getElementById("cfg-bg-color-picker") || document.getElementById("cfg-bg-color");
    const bgText = document.getElementById("cfg-bg-color-text");
    const previewBox = document.getElementById("color-preview-box");
    const swatchBtns = document.querySelectorAll(".swatch-palette .swatch-btn");

    const applyColor = (hex, updatePicker = true, updateText = true) => {
      if (this.isUpdatingUI) return;
      if (!hex) return;

      const normHex = hex.startsWith("#") ? hex : `#${hex}`;
      if (typeof WorldConfig !== "undefined") {
        WorldConfig.setBgColor(normHex);
      }

      if (previewBox) previewBox.style.backgroundColor = normHex;

      if (updatePicker && bgPicker && bgPicker.value !== normHex) {
        try { bgPicker.value = normHex; } catch (e) {}
      }

      if (updateText && bgText && bgText.value.toUpperCase() !== normHex.toUpperCase()) {
        bgText.value = normHex.toUpperCase();
      }

      swatchBtns.forEach(btn => {
        const btnColor = btn.getAttribute("data-color") || "";
        btn.classList.toggle("active", btnColor.toLowerCase() === normHex.toLowerCase());
      });
    };

    if (bgPicker) {
      bgPicker.addEventListener("input", (e) => {
        applyColor(e.target.value, false, true);
      });
      bgPicker.addEventListener("change", (e) => {
        applyColor(e.target.value, false, true);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.03, 0.06);
      });
    }

    if (bgText) {
      bgText.addEventListener("input", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
          applyColor(val, true, false);
        }
      });
      bgText.addEventListener("change", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
          applyColor(val, true, true);
        }
      });
    }

    swatchBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const color = btn.getAttribute("data-color");
        if (color) {
          applyColor(color, true, true);
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "triangle", 0.03, 0.06);
        }
      });
    });
  },

  syncUI(controller) {
    if (typeof WorldConfig === "undefined") return;
    this.isUpdatingUI = true;

    const currentHex = WorldConfig.bgColor || "#ffffff";
    const bgPicker = document.getElementById("cfg-bg-color-picker") || document.getElementById("cfg-bg-color");
    const bgText = document.getElementById("cfg-bg-color-text");
    const previewBox = document.getElementById("color-preview-box");
    const swatchBtns = document.querySelectorAll(".swatch-palette .swatch-btn");

    if (bgPicker) {
      try { bgPicker.value = currentHex; } catch (e) {}
    }
    if (bgText) bgText.value = currentHex.toUpperCase();
    if (previewBox) previewBox.style.backgroundColor = currentHex;

    swatchBtns.forEach(btn => {
      const btnColor = btn.getAttribute("data-color") || "";
      btn.classList.toggle("active", btnColor.toLowerCase() === currentHex.toLowerCase());
    });

    this.isUpdatingUI = false;
  }
};

if (typeof window !== "undefined") window.CfgColorPicker = CfgColorPicker;
if (typeof globalThis !== "undefined") globalThis.CfgColorPicker = CfgColorPicker;
