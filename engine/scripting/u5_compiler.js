/**
 * UNIFIVE Scripting - U5 Project Compiler
 */
const U5Compiler = {
  init() {
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
        if (typeof saveWorkspace === "function") saveWorkspace();
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

    if (inputLoad) {
      inputLoad.addEventListener("change", async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          if (typeof this.decompressAndLoad === "function") {
            await this.decompressAndLoad(new Blob([text], { type: "application/json" }));
          }
        } catch (err) {
          console.warn("Failed to load project file:", err);
        }
        inputLoad.value = "";
      });
    }

    window.addEventListener("click", (e) => {
      if (fileDropdownMenu && fileDropdownMenu.style.display !== "none" && !e.target.closest("#file-dropdown-wrapper")) {
        toggleFileMenu(false);
      }
    });

    const btnPresets = document.getElementById("btn-file-presets");
    if (btnPresets) btnPresets.addEventListener("click", () => this.openPresetsModal());
  },
  openPresetsModal() {
    if (typeof CompilerPresets !== "undefined") CompilerPresets.openPresetsModal(this);
  },
  loadPresetFile(path) {
    if (typeof CompilerPresets !== "undefined") return CompilerPresets.loadPresetFile(this, path);
  },
  async decompressAndLoad(blob) {
    const text = await blob.text();
    return typeof CompilerLoader !== "undefined" ? CompilerLoader.loadProjectJSON(text) : false;
  }
};
