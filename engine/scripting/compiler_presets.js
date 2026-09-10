/**
 * UNIFIVE Scripting - Compiler Presets Subsystem
 */
(function (global) {
  'use strict';

  const CompilerPresets = {
    async openPresetsModal(compiler) {
      const modal = document.getElementById("modal-presets-browser");
      const gridEl = document.getElementById("presets-cards-grid");
      if (!modal || !gridEl) return;
      modal.style.display = "flex";
      gridEl.innerHTML = "";
      let presetsList = [];
      try {
        let resp = await fetch("assets/presets/index.json");
        if (resp.ok) {
          const indexData = await resp.json();
          presetsList = indexData.presets || [];
        }
      } catch (e) {}

      for (const preset of presetsList) {
        const card = document.createElement("div");
        card.className = "preset-card";
        card.innerHTML = '<span class="preset-card-title">' + preset.name + '</span><button class="btn-load-preset">LOAD</button>';
        const btn = card.querySelector(".btn-load-preset");
        if (btn) btn.addEventListener("click", () => compiler.loadPresetFile(preset.file));
        gridEl.appendChild(card);
      }
    },

    closePresetsModal() {
      const modal = document.getElementById("modal-presets-browser");
      if (modal) modal.style.display = "none";
    },

    async loadPresetFile(compiler, presetFilePath) {
      try {
        let resp = await fetch(presetFilePath);
        if (resp.ok && compiler) {
          const blob = await resp.blob();
          await compiler.decompressAndLoad(blob);
          this.closePresetsModal();
        }
      } catch (err) {
        console.error("Failed to load preset:", err);
      }
    }
  };

  global.CompilerPresets = CompilerPresets;
})(typeof window !== 'undefined' ? window : globalThis);
