/**
 * UNIFIVE Scripting - Compiler Presets & World Marketplace Subsystem
 */
(function (global) {
  'use strict';

  const CompilerPresets = {
    presetsList: [],
    currentFilter: 'all',
    searchQuery: '',
    currentCompiler: null,
    isInitialized: false,

    initListeners() {
      if (this.isInitialized) return;
      this.isInitialized = true;

      // Close buttons
      const closeBtn = document.getElementById("btn-close-presets-modal");
      const cancelBtn = document.getElementById("btn-cancel-presets-modal");
      const modal = document.getElementById("modal-presets-browser");

      if (closeBtn) closeBtn.addEventListener("click", () => this.closePresetsModal());
      if (cancelBtn) cancelBtn.addEventListener("click", () => this.closePresetsModal());
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) this.closePresetsModal();
        });
      }

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal && modal.style.display !== "none") {
          this.closePresetsModal();
        }
      });

      // Search input & clear button
      const searchInput = document.getElementById("presets-search-input");
      const clearSearchBtn = document.getElementById("btn-clear-presets-search");

      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = (e.target.value || '').trim().toLowerCase();
          if (clearSearchBtn) {
            clearSearchBtn.style.display = this.searchQuery ? "flex" : "none";
          }
          this.renderMarketplace();
        });
      }

      if (clearSearchBtn && searchInput) {
        clearSearchBtn.addEventListener("click", () => {
          searchInput.value = '';
          this.searchQuery = '';
          clearSearchBtn.style.display = "none";
          searchInput.focus();
          this.renderMarketplace();
        });
      }

      // Filter chips
      const filterChips = document.querySelectorAll(".mkt-filter-chip");
      filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
          filterChips.forEach(c => {
            c.classList.remove("active");
            c.setAttribute("aria-selected", "false");
          });
          chip.classList.add("active");
          chip.setAttribute("aria-selected", "true");
          this.currentFilter = chip.getAttribute("data-filter") || 'all';
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "square", 0.03, 0.05);
          this.renderMarketplace();
        });
      });
    },

    async openPresetsModal(compiler) {
      this.currentCompiler = compiler || (typeof U5Compiler !== "undefined" ? U5Compiler : null);
      this.initListeners();

      const modal = document.getElementById("modal-presets-browser");
      const statusEl = document.getElementById("presets-loading-status");
      const gridEl = document.getElementById("presets-cards-grid");

      if (!modal) return;
      modal.style.display = "flex";
      if (statusEl) statusEl.style.display = "none";
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);

      if (this.presetsList.length === 0) {
        if (gridEl) {
          gridEl.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: var(--gold-bright); font-family: var(--font-pixel);"><i class="ph ph-spinner ph-spin" style="font-size: 1.8rem; display: block; margin-bottom: 10px;"></i> Accessing UNIFIVE World Marketplace...</div>';
        }

        try {
          let resp = await fetch("assets/presets/index.json");
          if (!resp.ok) resp = await fetch("../assets/presets/index.json");
          if (resp.ok) {
            const indexData = await resp.json();
            this.presetsList = indexData.presets || [];
          }
        } catch (e) {
          console.warn("Could not fetch assets/presets/index.json:", e);
        }

        if (!this.presetsList || this.presetsList.length === 0) {
          this.presetsList = [
            {
              id: "sidefacing_desert_oasis_expanse",
              name: "The Great Desert Oasis Expanse",
              perspective: "sidefacing",
              category: "Adventure",
              featured: true,
              badge: "STAFF PICK",
              rating: 4.9,
              file: "assets/presets/sidefacing_desert_oasis_expanse.json",
              thumbnail: "assets/presets/desert_oasis_preview.png",
              author: "Paul Peter (@asterixh)",
              assetCount: 21,
              layerCount: 8,
              dimensions: "5760 × 1080",
              scriptsCount: 4,
              description: "A vast 5760x1080 panoramic desert world featuring golden rolling dunes, lush palm oases, crystal mountain springs, nomad traders, and patrolling dune raiders with full player controller scripts.",
              tags: ["Desert", "Platformer", "Parallax", "Player Physics"]
            },
            {
              id: "sidefacing_metropolis_quest",
              name: "Cyberpunk Metropolis Quest",
              perspective: "sidefacing",
              category: "Cyberpunk",
              featured: false,
              badge: "POPULAR",
              rating: 5.0,
              file: "assets/presets/sidefacing_metropolis_quest.json",
              thumbnail: "assets/sidefacing-assets/city-backgrounds/city_1_composite_hd.png",
              author: "Paul Peter (@asterixh)",
              assetCount: 68,
              layerCount: 12,
              dimensions: "3840 × 2160",
              scriptsCount: 6,
              description: "A sprawling 3840x2160 cyberpunk city platformer preset with parallax towers, street traffic, vendors, police enforcers, and animated fantasy heroes.",
              tags: ["Cyberpunk", "City", "Parallax", "Animated NPCs", "Neon"]
            }
          ];
        }
      }

      this.renderMarketplace();
    },

    renderMarketplace() {
      const gridEl = document.getElementById("presets-cards-grid");
      const featuredEl = document.getElementById("marketplace-featured-container");
      const countEl = document.getElementById("marketplace-results-count");
      const sectionTitleEl = document.getElementById("marketplace-results-title");
      if (!gridEl) return;

      if (featuredEl) {
        featuredEl.style.display = 'none';
        featuredEl.innerHTML = '';
      }

      // Filter presets
      const filtered = this.presetsList.filter(preset => {
        // Perspective Filter
        if (this.currentFilter !== 'all' && preset.perspective !== this.currentFilter) {
          return false;
        }
        // Search Query Filter
        if (this.searchQuery) {
          const matchName = (preset.name || '').toLowerCase().includes(this.searchQuery);
          const matchDesc = (preset.description || '').toLowerCase().includes(this.searchQuery);
          const matchAuthor = (preset.author || '').toLowerCase().includes(this.searchQuery);
          const matchCategory = (preset.category || '').toLowerCase().includes(this.searchQuery);
          const matchTags = Array.isArray(preset.tags) && preset.tags.some(t => t.toLowerCase().includes(this.searchQuery));
          if (!matchName && !matchDesc && !matchAuthor && !matchCategory && !matchTags) {
            return false;
          }
        }
        return true;
      });

      // Update Header Stats
      if (countEl) {
        countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'WORLD' : 'WORLDS'} AVAILABLE`;
      }
      if (sectionTitleEl) {
        if (this.searchQuery) {
          sectionTitleEl.textContent = `SEARCH RESULTS FOR "${this.searchQuery.toUpperCase()}"`;
        } else if (this.currentFilter === 'sidefacing') {
          sectionTitleEl.textContent = 'SIDE-FACING PLATFORMER WORLDS';
        } else if (this.currentFilter === 'topdown') {
          sectionTitleEl.textContent = 'TOP-DOWN RPG WORLDS';
        } else {
          sectionTitleEl.textContent = 'ALL WORLD TEMPLATES & PRESETS';
        }
      }

      // Empty State
      if (filtered.length === 0) {
        gridEl.innerHTML = `
          <div class="marketplace-empty-state" style="grid-column: 1 / -1;">
            <i class="ph ph-magnifying-glass"></i>
            <div class="marketplace-empty-title">NO PRESETS FOUND</div>
            <div class="marketplace-empty-desc">No world templates matched your search criteria. Try different keywords or switch filters.</div>
          </div>
        `;
        return;
      }

      // Render Cards Grid (Clean, expansive multi-column)
      gridEl.innerHTML = '';
      filtered.forEach(preset => {
        const card = document.createElement("div");
        card.className = "marketplace-card";
        const isSide = preset.perspective === "sidefacing";

        const tagsHtml = Array.isArray(preset.tags)
          ? preset.tags.map(t => `<span class="mkt-tag-chip">#${t}</span>`).join('')
          : '';

        card.innerHTML = `
          <div class="mkt-card-thumb-wrap">
            <img src="${preset.thumbnail || 'favicon-32x32.png'}" alt="${preset.name}" class="mkt-card-thumb-img" onerror="this.src='favicon-32x32.png'" />
            <div class="mkt-card-top-badges">
              <span class="mkt-card-perspective-badge">${isSide ? 'SIDE-FACING' : 'TOP-DOWN'}</span>
              ${preset.badge ? `<span class="mkt-card-staff-badge"><i class="ph ph-sparkle"></i> ${preset.badge}</span>` : ''}
              ${preset.category ? `<span class="mkt-card-category-badge">${preset.category}</span>` : ''}
            </div>
          </div>
          <div class="mkt-card-body">
            <div class="mkt-card-title-row">
              <span class="mkt-card-title">${preset.name}</span>
              <span class="mkt-card-rating"><i class="ph ph-star-fill"></i> ${preset.rating ? preset.rating.toFixed(1) : '5.0'}</span>
            </div>
            <span class="mkt-card-author"><i class="ph ph-user"></i> ${preset.author || 'UNIFIVE Creator'}</span>
            <div class="mkt-card-desc">${preset.description || 'Pre-configured world template.'}</div>
            <div class="mkt-card-specs">
              <span class="mkt-spec-pill"><i class="ph ph-stack"></i> ${preset.assetCount || 20} Assets</span>
              <span class="mkt-spec-pill"><i class="ph ph-layers"></i> ${preset.layerCount || 6} Layers</span>
              ${preset.dimensions ? `<span class="mkt-spec-pill"><i class="ph ph-aspect-ratio"></i> ${preset.dimensions}</span>` : ''}
              ${preset.scriptsCount ? `<span class="mkt-spec-pill"><i class="ph ph-code-block"></i> ${preset.scriptsCount} Scripts</span>` : ''}
            </div>
            ${tagsHtml ? `<div class="mkt-card-tags">${tagsHtml}</div>` : ''}
          </div>
          <div class="mkt-card-footer">
            <div class="mkt-price-tag"><i class="ph ph-tag"></i> 100% FREE</div>
            <button class="btn btn-pixel btn-mkt-load btn-load-preset" data-preset-file="${preset.file}">
              <i class="ph ph-download-simple"></i>
              <span>LOAD PRESET</span>
            </button>
          </div>
        `;

        const btnLoad = card.querySelector(".btn-load-preset");
        if (btnLoad) {
          btnLoad.addEventListener("click", () => {
            this.loadPresetFile(this.currentCompiler, preset.file);
          });
        }

        gridEl.appendChild(card);
      });
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
      if (!compiler && typeof U5Compiler !== "undefined") {
        compiler = U5Compiler;
      }

      const statusEl = document.getElementById("presets-loading-status");
      const statusText = document.getElementById("presets-loading-text");
      if (statusEl) statusEl.style.display = "flex";
      if (statusText) statusText.textContent = "Connecting to marketplace & downloading preset scene...";
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("save");

      try {
        let resp = await fetch(presetFilePath);
        if (!resp.ok) resp = await fetch("../" + presetFilePath);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const blob = await resp.blob();

        if (statusText) statusText.textContent = "Unpacking layers, assets & visual code scripts...";
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
