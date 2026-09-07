const U5Compiler = {
  isCompiling: false,
  isLoading: false,

  init() {
    // 1. Unified Header File Dropdown (SAVE & LOAD)
    const btnFileMenu = document.getElementById("btn-file-menu");
    const fileDropdownMenu = document.getElementById("file-dropdown-menu");
    const btnFileSaveU5 = document.getElementById("btn-file-save-u5");
    const btnFileExportPng = document.getElementById("btn-file-export-png");
    const btnFileLoadPreset = document.getElementById("btn-file-load-preset");
    const btnFileLoadFile = document.getElementById("btn-file-load-file");
    const inputLoad = document.getElementById("input-load-u5");

    const toggleFileMenu = (show = null) => {
      if (!fileDropdownMenu) return;
      const willShow = show !== null ? show : fileDropdownMenu.style.display === "none";
      fileDropdownMenu.style.display = willShow ? "flex" : "none";
      if (btnFileMenu) btnFileMenu.classList.toggle("active", willShow);
      if (willShow) SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
    };

    if (btnFileMenu) {
      btnFileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu();
      });
    }

    if (btnFileSaveU5) {
      btnFileSaveU5.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        this.openExportModal();
      });
    }

    if (btnFileExportPng) {
      btnFileExportPng.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        if (typeof saveWorkspace === "function") saveWorkspace();
      });
    }

    if (btnFileLoadPreset) {
      btnFileLoadPreset.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        this.openPresetsModal();
      });
    }

    if (btnFileLoadFile) {
      btnFileLoadFile.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        if (inputLoad) inputLoad.click();
      });
    }

    // Close file dropdown when clicking outside
    window.addEventListener("click", (e) => {
      if (fileDropdownMenu && fileDropdownMenu.style.display !== "none") {
        if (!e.target.closest("#file-dropdown-wrapper")) {
          toggleFileMenu(false);
        }
      }
    });

    // 2. Config Tab Compile, Load & Presets Buttons
    const btnCfgExport = document.getElementById("btn-cfg-export-u5");
    const btnCfgImport = document.getElementById("btn-cfg-import-u5");
    const btnCfgPreset = document.getElementById("btn-cfg-load-preset");

    if (btnCfgExport) {
      btnCfgExport.addEventListener("click", () => this.openExportModal());
    }
    if (btnCfgImport) {
      btnCfgImport.addEventListener("click", () => {
        if (inputLoad) inputLoad.click();
      });
    }
    if (btnCfgPreset) {
      btnCfgPreset.addEventListener("click", () => this.openPresetsModal());
    }

    // 3. Presets Browser Modal Controls
    const btnClosePresets = document.getElementById("btn-close-presets-modal");
    const btnCancelPresets = document.getElementById("btn-cancel-presets-modal");
    if (btnClosePresets) btnClosePresets.addEventListener("click", () => this.closePresetsModal());
    if (btnCancelPresets) btnCancelPresets.addEventListener("click", () => this.closePresetsModal());

    // 4. Export Modal Controls
    const modalExport = document.getElementById("modal-export-u5");
    const btnCloseModal = document.getElementById("btn-close-export-modal");
    const btnCancelModal = document.getElementById("btn-cancel-export-modal");
    const btnConfirmExport = document.getElementById("btn-confirm-export-u5");
    const inputTitle = document.getElementById("input-export-title");
    const inputAuthor = document.getElementById("input-export-author");
    const inputVersion = document.getElementById("input-export-version");
    const inputDesc = document.getElementById("input-export-desc");

    if (btnCloseModal) btnCloseModal.addEventListener("click", () => this.closeExportModal());
    if (btnCancelModal) btnCancelModal.addEventListener("click", () => this.closeExportModal());
    if (btnConfirmExport) {
      btnConfirmExport.addEventListener("click", () => {
        const metadata = {
          title: (inputTitle && inputTitle.value.trim()) || "My_Project",
          author: (inputAuthor && inputAuthor.value.trim()) || "Player",
          version: (inputVersion && inputVersion.value.trim()) || "1.0.0",
          description: (inputDesc && inputDesc.value.trim()) || ""
        };
        this.compileWithWorker(metadata);
      });
    }

    if (inputTitle) {
      inputTitle.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          if (btnConfirmExport) btnConfirmExport.click();
        }
        if (e.key === "Escape") this.closeExportModal();
      });
    }

    // 4. Hidden File Input Change
    if (inputLoad) {
      inputLoad.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.decompressAndLoad(file);
          inputLoad.value = ""; // Reset for re-selection
        }
      });
    }

    // 5. Drag & Drop .u5 File onto Window
    window.addEventListener("dragover", (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
      }
    });

    window.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith(".u5") || file.name.toLowerCase().endsWith(".json")) {
          e.preventDefault();
          this.decompressAndLoad(file);
        }
      }
    });

    // 6. Prompt user before page refresh or tab close if they have unsaved changes
    window.addEventListener("beforeunload", (e) => {
      const hasItems = typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items && WorldObjectsManager.items.length > 0;
      let hasScripts = false;
      if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
        hasScripts = Object.values(AppModeController.objectScripts).some(list => Array.isArray(list) && list.length > 0);
      }

      if (hasItems || hasScripts) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes! Make sure to export your work before closing.";
        return e.returnValue;
      }
    });

    this.updateStats();
  },

  openExportModal() {
    if (this.isCompiling) return;
    const modal = document.getElementById("modal-export-u5");
    const previewImg = document.getElementById("export-preview-img");
    const inputTitle = document.getElementById("input-export-title");
    const inputAuthor = document.getElementById("input-export-author");
    const inputVersion = document.getElementById("input-export-version");
    const workerStatus = document.getElementById("export-worker-status");
    const btnConfirm = document.getElementById("btn-confirm-export-u5");

    // Live Snapshot Thumbnail
    const thumbUrl = this.getCanvasThumbnailDataUrl(220, 136);
    if (previewImg && thumbUrl) {
      previewImg.src = thumbUrl;
    }

    // Meta Badges
    const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
    const metaPersp = document.getElementById("export-meta-perspective");
    const metaLayers = document.getElementById("export-meta-layers");
    const metaScripts = document.getElementById("export-meta-scripts");
    const metaWorld = document.getElementById("export-meta-world");

    const layerCount = WorldObjectsManager.items.length;
    let blockCount = 0;
    if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
      Object.values(AppModeController.objectScripts).forEach(list => {
        if (Array.isArray(list)) blockCount += list.length;
      });
    }

    if (metaPersp) metaPersp.innerHTML = `<i class="ph ph-compass"></i><span>${activeView === "topdown" ? "TOP-DOWN" : "SIDE-FACING"}</span>`;
    if (metaLayers) metaLayers.innerHTML = `<i class="ph ph-stack"></i><span>${layerCount} ${layerCount === 1 ? "LAYER" : "LAYERS"}</span>`;
    if (metaScripts) metaScripts.innerHTML = `<i class="ph ph-code"></i><span>${blockCount} ${blockCount === 1 ? "SCRIPT BLOCK" : "SCRIPT BLOCKS"}</span>`;
    if (metaWorld) metaWorld.innerHTML = `<i class="ph ph-bounding-box"></i><span>${WorldConfig.worldWidth} × ${WorldConfig.worldHeight}</span>`;

    // Populate default title if empty
    if (inputTitle && (!inputTitle.value || inputTitle.value.startsWith("Project_"))) {
      const timeTag = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
      inputTitle.value = `Project_${activeView}_${timeTag}`;
    }

    if (inputAuthor && !inputAuthor.value) {
      inputAuthor.value = "PixelMaster";
    }

    if (inputVersion && !inputVersion.value) {
      inputVersion.value = "1.0.0";
    }

    if (workerStatus) workerStatus.style.display = "none";
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>EXPORT .U5</span>';
    }

    if (modal) modal.style.display = "flex";
    if (inputTitle) {
      setTimeout(() => {
        inputTitle.focus();
        inputTitle.select();
      }, 50);
    }

    SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
  },

  closeExportModal() {
    if (this.isCompiling) return;
    const modal = document.getElementById("modal-export-u5");
    if (modal) modal.style.display = "none";
  },

  async openPresetsModal() {
    const modal = document.getElementById("modal-presets-browser");
    const gridEl = document.getElementById("presets-cards-grid");
    const statusEl = document.getElementById("presets-loading-status");
    if (!modal) return;

    modal.style.display = "flex";
    if (statusEl) statusEl.style.display = "none";
    SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);

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
            this.loadPresetFile(preset.file || "assets/presets/sidefacing_metropolis_quest.json");
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

  async loadPresetFile(presetFilePath) {
    const statusEl = document.getElementById("presets-loading-status");
    const statusText = document.getElementById("presets-loading-text");
    if (statusEl) statusEl.style.display = "flex";
    if (statusText) statusText.textContent = "Fetching preset scene data...";
    SoundEngine.playAction("save");

    try {
      let resp = await fetch(presetFilePath);
      if (!resp.ok) resp = await fetch("../" + presetFilePath);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();

      if (statusText) statusText.textContent = "Unpacking layers & code scripts...";
      await this.decompressAndLoad(blob);
      this.closePresetsModal();
      SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
      setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.15, 0.2), 80);
    } catch (err) {
      console.error("Failed to load preset:", err);
      alert("Failed to load preset: " + err.message);
      if (statusEl) statusEl.style.display = "none";
    }
  },

  updateStats(customSizeText = null) {
    const statsText = document.getElementById("u5-stats-text");
    if (!statsText) return;

    const layerCount = WorldObjectsManager.items.length;
    let blockCount = 0;
    if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
      Object.values(AppModeController.objectScripts).forEach(list => {
        if (Array.isArray(list)) blockCount += list.length;
      });
    }

    if (customSizeText) {
      statsText.textContent = `${layerCount} ${layerCount === 1 ? "Layer" : "Layers"} • ${blockCount} ${blockCount === 1 ? "Script Block" : "Script Blocks"} • ${customSizeText}`;
    } else {
      statsText.textContent = `${layerCount} ${layerCount === 1 ? "Layer" : "Layers"} • ${blockCount} ${blockCount === 1 ? "Script Block" : "Script Blocks"} • Standalone .U5`;
    }
  },

  async getImageDataUrl(src) {
    // 1. Try offscreen canvas extraction from cached p5.Image or Image element
    try {
      const entry = WorldObjectsManager.imageCache[src];
      let htmlImg = null;
      if (entry && entry.img) {
        if (entry.img.elt && entry.img.elt instanceof HTMLImageElement) {
          htmlImg = entry.img.elt;
        } else if (entry.img.canvas && entry.img.canvas instanceof HTMLCanvasElement) {
          return entry.img.canvas.toDataURL("image/png");
        }
      }

      if (htmlImg && htmlImg.complete && htmlImg.naturalWidth > 0) {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = htmlImg.naturalWidth;
        offCanvas.height = htmlImg.naturalHeight;
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(htmlImg, 0, 0);
        return offCanvas.toDataURL("image/png");
      }
    } catch (e) {
      console.warn("Direct canvas toDataURL extraction failed, falling back to fetch:", e);
    }

    // 2. Fetch as blob fallback
    try {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Could not bundle asset data URL for:", src, err);
      return null;
    }
  },

  async getAppIconDataUrl() {
    try {
      let resp = await fetch("icons/icon-128x128.png");
      if (!resp.ok) {
        resp = await fetch("../icons/icon-128x128.png");
      }
      if (resp.ok) {
        const blob = await resp.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    // Fallback: draw 32x32 pixel U5 icon directly on offscreen canvas
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#120308";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#ad204d";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);
      ctx.font = "bold 28px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("U", 8, 44);
      ctx.fillStyle = "#fecc1b";
      ctx.fillText("5", 34, 44);
      return canvas.toDataURL("image/png");
    } catch (e) {
      return null;
    }
  },

  getCanvasThumbnailDataUrl(maxW = 320, maxH = 180) {
    try {
      if (mainCanvas && mainCanvas.elt) {
        const srcCanvas = mainCanvas.elt;
        const offCanvas = document.createElement("canvas");
        offCanvas.width = maxW;
        offCanvas.height = maxH;
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(srcCanvas, 0, 0, maxW, maxH);
        return offCanvas.toDataURL("image/png");
      }
    } catch (e) {
      console.warn("Could not generate canvas thumbnail:", e);
    }
    return null;
  },

  async compileWithWorker(customMeta = {}) {
    if (this.isCompiling) return;
    this.isCompiling = true;

    // Audio & UI Feedback
    SoundEngine.playAction("save");
    const btnHeader = document.getElementById("btn-export-u5");
    const btnCfg = document.getElementById("btn-cfg-export-u5");
    const workerStatus = document.getElementById("export-worker-status");
    const btnConfirm = document.getElementById("btn-confirm-export-u5");

    if (btnHeader) btnHeader.classList.add("btn-loading");
    if (btnCfg) {
      btnCfg.disabled = true;
      btnCfg.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>COMPILING...</span>';
    }
    if (workerStatus) workerStatus.style.display = "flex";
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>PACKAGING...</span>';
    }

    try {
      // 1. App Icon & Scene Thumbnail
      const appIcon = await this.getAppIconDataUrl();
      const thumbnail = this.getCanvasThumbnailDataUrl(320, 180);

      // 2. Collect Full Metadata
      const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
      const metadata = {
        title: customMeta.title || `Project_${activeView}`,
        author: customMeta.author || "Player",
        version: customMeta.version || "1.0.0",
        description: customMeta.description || "",
        perspective: activeView,
        generator: "UNIFIVE Studio v2.0",
        timestamp: Date.now(),
        exportedAt: new Date().toISOString(),
        icon: appIcon,
        thumbnail: thumbnail
      };

      // 3. Collect World Config
      const worldConfig = {
        worldWidth: WorldConfig.worldWidth || 2000,
        worldHeight: WorldConfig.worldHeight || 1500,
        bgColor: WorldConfig.bgColor || "#ffffff",
        panX: WorldConfig.panX || 1000,
        panY: WorldConfig.panY || 750,
        zoom: WorldConfig.zoom || 1.0,
        minZoom: WorldConfig.minZoom || 0.15,
        maxZoom: WorldConfig.maxZoom || 4.0
      };

      // 4. Collect Placed Layers
      const layers = WorldObjectsManager.serialize();

      // 5. Find ONLY used assets and convert to base64 Data URLs
      const usedAssetPaths = new Set();
      layers.forEach(item => {
        if (item.src) usedAssetPaths.add(item.src);
        if (item.poses && typeof item.poses === "object") {
          Object.values(item.poses).forEach(pose => {
            if (typeof pose === "string") usedAssetPaths.add(pose);
            else if (pose && pose.sheet) usedAssetPaths.add(pose.sheet);
            else if (pose && Array.isArray(pose.frames)) {
              pose.frames.forEach(f => { if (typeof f === "string") usedAssetPaths.add(f); });
            }
          });
        }
      });

      const bundledAssets = {};
      const assetPromises = Array.from(usedAssetPaths).map(async (src) => {
        const dataUrl = await this.getImageDataUrl(src);
        if (dataUrl) {
          bundledAssets[src] = dataUrl;
        }
      });
      await Promise.all(assetPromises);

      // 6. Collect Code Scripts & Variables
      const code = {
        objectScripts: (typeof AppModeController !== "undefined" && AppModeController.objectScripts) ? JSON.parse(JSON.stringify(AppModeController.objectScripts)) : {},
        variables: (typeof VariableManager !== "undefined" && VariableManager.variables) ? JSON.parse(JSON.stringify(VariableManager.variables)) : []
      };

      // 7. Assemble Full Payload (With Embedded Icon & Thumbnail)
      const payload = {
        format: "UNIFIVE_U5",
        version: "1.0.0",
        timestamp: Date.now(),
        icon: appIcon,
        thumbnail: thumbnail,
        metadata,
        worldConfig,
        layers,
        bundledAssets,
        code
      };

      // 8. Execute Background Worker for Serialization & Compression
      await new Promise((resolve, reject) => {
        const workerCode = `
          self.onmessage = async function(e) {
            const { type, payload } = e.data;
            if (type === 'COMPILE_U5') {
              try {
                const jsonStr = JSON.stringify(payload);
                const uint8 = new TextEncoder().encode(jsonStr);
                let finalBuffer;
                let isGzipped = false;

                if (typeof CompressionStream !== 'undefined') {
                  try {
                    const cs = new CompressionStream('gzip');
                    const writer = cs.writable.getWriter();
                    writer.write(uint8);
                    writer.close();
                    const resp = new Response(cs.readable);
                    const ab = await resp.arrayBuffer();
                    finalBuffer = ab;
                    isGzipped = true;
                  } catch (compErr) {
                    finalBuffer = uint8.buffer;
                  }
                } else {
                  finalBuffer = uint8.buffer;
                }

                self.postMessage({ success: true, buffer: finalBuffer, isGzipped: isGzipped }, [finalBuffer]);
              } catch (err) {
                self.postMessage({ success: false, error: err.message });
              }
            }
          };
        `;

        const workerBlob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (e) => {
          const { success, buffer, isGzipped, error } = e.data;
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          if (!success) {
            return reject(new Error(error || "Worker compilation failed"));
          }

          const finalBlob = new Blob([buffer], { type: "application/octet-stream" });
          const formattedSize = finalBlob.size > 1048576 
            ? (finalBlob.size / 1048576).toFixed(2) + " MB" 
            : (finalBlob.size / 1024).toFixed(1) + " KB";

          const cleanTitle = (metadata.title || `Project_${activeView}`).replace(/[^a-zA-Z0-9_-]/g, "_");
          const filename = `${cleanTitle}.u5`;

          const downloadUrl = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);

          this.updateStats(`${formattedSize} (${isGzipped ? "Compressed" : "Raw"})`);
          SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
          setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.12, 0.2), 80);

          resolve();
        };

        worker.onerror = (err) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(err);
        };

        worker.postMessage({ type: "COMPILE_U5", payload: payload });
      });

    } catch (err) {
      console.error("Worker compilation failed:", err);
      alert("Project compilation failed: " + err.message);
    } finally {
      this.isCompiling = false;
      if (btnHeader) btnHeader.classList.remove("btn-loading");
      if (btnCfg) {
        btnCfg.disabled = false;
        btnCfg.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>COMPILE TO .U5</span>';
      }
      if (workerStatus) workerStatus.style.display = "none";
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>EXPORT .U5</span>';
      }
      this.closeExportModal();
    }
  },

  async compileProject() {
    return this.openExportModal();
  },

  async decompressAndLoad(fileOrBlob) {
    if (this.isLoading) return;
    this.isLoading = true;

    const btnHeader = document.getElementById("btn-import-u5");
    const btnCfg = document.getElementById("btn-cfg-import-u5");
    if (btnHeader) btnHeader.classList.add("btn-loading");
    if (btnCfg) {
      btnCfg.disabled = true;
      btnCfg.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>OPENING...</span>';
    }

    try {
      const arrayBuffer = await fileOrBlob.arrayBuffer();
      let jsonStr;

      // 1. Attempt Decompression with DecompressionStream('gzip')
      if (typeof DecompressionStream !== "undefined") {
        try {
          const ds = new DecompressionStream("gzip");
          const writer = ds.writable.getWriter();
          writer.write(new Uint8Array(arrayBuffer));
          writer.close();
          const decompressedBlob = await new Response(ds.readable).blob();
          jsonStr = await decompressedBlob.text();
        } catch (dsErr) {
          // If GZIP fails, fallback to direct text decoding
          jsonStr = new TextDecoder().decode(arrayBuffer);
        }
      } else {
        jsonStr = new TextDecoder().decode(arrayBuffer);
      }

      // 2. Parse JSON
      const payload = JSON.parse(jsonStr);

      if (!payload || (payload.format !== "UNIFIVE_U5" && !payload.layers && !payload.worldConfig)) {
        throw new Error("Invalid .u5 file format. Missing UNIFIVE signature or layers.");
      }

      // 3. Perspective View Switch (if specified)
      if (payload.metadata && payload.metadata.perspective && typeof ViewController !== "undefined") {
        if (ViewController.currentView !== payload.metadata.perspective) {
          ViewController.setView(payload.metadata.perspective);
        }
      }

      // 4. Preload Bundled Assets into WorldObjectsManager.imageCache
      if (payload.bundledAssets && typeof payload.bundledAssets === "object") {
        const preloadPromises = Object.entries(payload.bundledAssets).map(([src, dataUrl]) => {
          return new Promise((resolve) => {
            if (typeof loadImage === "function") {
              loadImage(
                dataUrl,
                (p5Img) => {
                  WorldObjectsManager.imageCache[src] = {
                    img: p5Img,
                    loaded: true,
                    naturalW: p5Img.width || 320,
                    naturalH: p5Img.height || 180
                  };
                  resolve();
                },
                () => {
                  // Fallback HTML Image Element
                  const img = new Image();
                  img.onload = () => {
                    WorldObjectsManager.imageCache[src] = {
                      img: img,
                      loaded: true,
                      naturalW: img.naturalWidth || 320,
                      naturalH: img.naturalHeight || 180
                    };
                    resolve();
                  };
                  img.onerror = () => resolve();
                  img.src = dataUrl;
                }
              );
            } else {
              resolve();
            }
          });
        });
        await Promise.all(preloadPromises);
      }

      // 5. Restore World Config
      if (payload.worldConfig) {
        WorldConfig.worldWidth = payload.worldConfig.worldWidth || 2000;
        WorldConfig.worldHeight = payload.worldConfig.worldHeight || 1500;
        WorldConfig.bgColor = payload.worldConfig.bgColor || "#ffffff";
        WorldConfig.panX = payload.worldConfig.panX !== undefined ? payload.worldConfig.panX : (WorldConfig.worldWidth / 2);
        WorldConfig.panY = payload.worldConfig.panY !== undefined ? payload.worldConfig.panY : (WorldConfig.worldHeight / 2);
        WorldConfig.zoom = payload.worldConfig.zoom || 1.0;
        WorldConfig.clampPan();

        if (typeof ConfigController !== "undefined") {
          ConfigController.syncUIFromWorldConfig();
        }
      }

      // 6. Restore Layers (Stacking Order Preserved)
      if (Array.isArray(payload.layers)) {
        WorldObjectsManager.deserialize(payload.layers);
      }

      // 7. Restore Code Scripts & Variables
      const scriptsObj = (payload.code && payload.code.objectScripts) || payload.codeScripts || payload.objectScripts;
      if (scriptsObj && typeof AppModeController !== "undefined") {
        AppModeController.objectScripts = JSON.parse(JSON.stringify(scriptsObj));
      }

      if (typeof VariableManager !== "undefined") {
        const rawVars = (payload.code && payload.code.variables) || payload.variables;
        if (Array.isArray(rawVars)) {
          VariableManager.variables = rawVars;
        } else if (rawVars && typeof rawVars === "object") {
          VariableManager.variables = Object.entries(rawVars).map(([vName, vVal]) => ({
            id: "var_" + vName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            name: vName,
            scope: "global",
            targetId: null,
            value: Number(vVal) || vVal,
            showWatcher: true
          }));
        }
      }

      // 8. Refresh Views and Inspectors
      if (typeof LayersController !== "undefined") LayersController.update();
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof AppModeController !== "undefined") {
        AppModeController.renderObjectsList();
        AppModeController.updateTargetBadge();
        AppModeController.renderScriptsForActiveTarget();
      }

      WorldObjectsManager.saveHistory();
      this.updateStats();

      // Sound & Visual Confirmation
      SoundEngine.playAction("save");
      SoundEngine.playChiptuneTone(880, "square", 0.08, 0.15);
      setTimeout(() => SoundEngine.playChiptuneTone(1174, "square", 0.12, 0.18), 80);

    } catch (err) {
      console.error("Decompress & Load failed:", err);
      alert("Failed to load .u5 project: " + err.message);
    } finally {
      this.isLoading = false;
      if (btnHeader) btnHeader.classList.remove("btn-loading");
      if (btnCfg) {
        btnCfg.disabled = false;
        btnCfg.innerHTML = '<i class="ph ph-folder-open"></i><span>OPEN .U5 FILE</span>';
      }
    }
  }
};

// ============================================================================
// 11. P5.JS CANVAS LIFECYCLE & WORLD RENDERING
// ============================================================================