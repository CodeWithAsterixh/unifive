/**
 * UNIFIVE Scripting - Compiler Presets Subsystem
 */
(function (global) {
  'use strict';

  const CompilerPresets = {
    async openPresetsModal(compiler) {
      const modal = document.getElementById("modal-presets-browser");
      const gridEl = document.getElementById("presets-cards-grid");
      const statusEl = document.getElementById("presets-loading-status");
      if (!modal) return;

      modal.style.display = "flex";
      if (statusEl) statusEl.style.display = "none";
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);

      if (gridEl) {
        gridEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--gold-bright); font-family: var(--font-pixel);"><i class="ph ph-spinner ph-spin"></i> Loading presets catalog...</div>';

        let presetsList = [];
        try {
          let resp = await fetch("assets/presets/index.json");
          if (!resp.ok) resp = await fetch("../assets/presets/index.json");
          if (resp.ok) {
            const indexData = await resp.json();
            presetsList = indexData.presets || [];
          }
        } catch (e) {
          console.warn("Could not fetch assets/presets/index.json:", e);
        }

        if (!presetsList || presetsList.length === 0) {
          presetsList = [
            {
              id: "sidefacing_metropolis_quest",
              name: "Cyberpunk Metropolis Quest",
              perspective: "sidefacing",
              file: "assets/presets/sidefacing_metropolis_quest.json",
              thumbnail: "assets/sidefacing-assets/city-backgrounds/city_1_layer2_distant_skyline.png",
              author: "Paul Peter (@asterixh)",
              assetCount: 68,
              description: "A sprawling 3840x2160 cyberpunk city platformer preset with parallax towers, street traffic, vendors, police enforcers, and animated fantasy heroes."
            }
          ];
        }

        gridEl.innerHTML = "";
        presetsList.forEach(preset => {
          const card = document.createElement("div");
          card.className = "preset-card";
          const isSide = preset.perspective === "sidefacing";

          card.innerHTML = `
            <div class="preset-thumb-wrap">
              <img src="${preset.thumbnail || 'favicon-32x32.png'}" alt="${preset.name}" class="preset-thumb-img" onerror="this.src='favicon-32x32.png'" />
              <span class="preset-badge-tag">${isSide ? 'SIDE' : 'TOP'}</span>
            </div>
            <div class="preset-card-content">
              <span class="preset-card-title">${preset.name}</span>
              <span class="preset-card-desc">${preset.description || 'Pre-configured world template with multi-layered assets.'}</span>
              <div class="preset-card-pills">
                <span class="preset-pill"><i class="ph ph-stack"></i> ${preset.assetCount || 68} Assets</span>
                <span class="preset-pill"><i class="ph ph-compass"></i> ${isSide ? 'Side-Facing' : 'Top-Down'}</span>
                <span class="preset-pill"><i class="ph ph-user"></i> ${preset.author || 'Paul Peter'}</span>
              </div>
            </div>
            <button class="btn btn-pixel btn-load-preset" data-preset-file="${preset.file}">
              <i class="ph ph-rocket-launch"></i>
              <span>LOAD PRESET</span>
            </button>
          `;

          const btnLoad = card.querySelector(".btn-load-preset");
          if (btnLoad) {
            btnLoad.addEventListener("click", () => {
              this.loadPresetFile(compiler, preset.file || "assets/presets/sidefacing_metropolis_quest.json");
            });
          }

          gridEl.appendChild(card);
        });
      }
    },

    closePresetsModal() {
      const modal = document.getElementById("modal-presets-browser");
      if (modal) modal.style.display = "none";
    },

    async loadPresetFile(compiler, presetFilePath) {
      if (typeof compiler === "string") {
        presetFilePath = compiler;
        compiler = typeof U5Compiler !== "undefined" ? U5Compiler : null;
      }
      const statusEl = document.getElementById("presets-loading-status");
      const statusText = document.getElementById("presets-loading-text");
      if (statusEl) statusEl.style.display = "flex";
      if (statusText) statusText.textContent = "Fetching preset scene data...";
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("save");

      try {
        let resp = await fetch(presetFilePath);
        if (!resp.ok) resp = await fetch("../" + presetFilePath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();

        if (statusText) statusText.textContent = "Unpacking layers & code scripts...";
        if (compiler && typeof compiler.decompressAndLoad === "function") {
          await compiler.decompressAndLoad(blob);
        } else if (typeof U5Compiler !== "undefined" && typeof U5Compiler.decompressAndLoad === "function") {
          await U5Compiler.decompressAndLoad(blob);
        }
        this.closePresetsModal();
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
          setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.15, 0.2), 80);
        }
      } catch (err) {
        console.error("Failed to load preset:", err);
        alert("Failed to load preset: " + err.message);
        if (statusEl) statusEl.style.display = "none";
      }
    }
  };

  global.CompilerPresets = CompilerPresets;
})(typeof window !== 'undefined' ? window : globalThis);
