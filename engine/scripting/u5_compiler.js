/**
 * UNIFIVE Scripting - Project Compiler & Package Aggregator
 * Orchestrates presets, compilation, data export, and project loading.
 */
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
      if (willShow && typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      }
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

    // 5. Hidden File Input Change
    if (inputLoad) {
      inputLoad.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.decompressAndLoad(file);
          inputLoad.value = ""; // Reset for re-selection
        }
      });
    }

    // 6. Drag & Drop .u5 File onto Window
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

    // 7. Prompt user before page refresh or tab close if they have unsaved changes
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
    return CompilerPackager.openExportModal(this);
  },

  closeExportModal() {
    return CompilerPackager.closeExportModal(this);
  },

  openPresetsModal() {
    return CompilerPresets.openPresetsModal(this);
  },

  closePresetsModal() {
    return CompilerPresets.closePresetsModal();
  },

  loadPresetFile(presetFilePath) {
    return CompilerPresets.loadPresetFile(this, presetFilePath);
  },

  updateStats(customSizeText = null) {
    return CompilerAssets.updateStats(customSizeText);
  },

  getImageDataUrl(src) {
    return CompilerAssets.getImageDataUrl(src);
  },

  getAppIconDataUrl() {
    return CompilerAssets.getAppIconDataUrl();
  },

  getCanvasThumbnailDataUrl(maxW = 320, maxH = 180) {
    return CompilerAssets.getCanvasThumbnailDataUrl(maxW, maxH);
  },

  compileWithWorker(customMeta = {}) {
    return CompilerPackager.compileWithWorker(this, customMeta);
  },

  compileProject() {
    return this.openExportModal();
  },

  decompressAndLoad(fileOrBlob) {
    return CompilerLoader.decompressAndLoad(this, fileOrBlob);
  }
};