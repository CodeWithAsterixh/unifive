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
  async decompressAndLoad(fileOrBlob) {
    if (this.isLoading) return false;
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
      const bytes = new Uint8Array(arrayBuffer);
      let jsonStr;

      const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
      if (isGzip && typeof DecompressionStream !== "undefined") {
        try {
          const ds = new DecompressionStream("gzip");
          const writer = ds.writable.getWriter();
          writer.write(bytes);
          writer.close();
          const decompressedBlob = await new Response(ds.readable).blob();
          jsonStr = await decompressedBlob.text();
        } catch (dsErr) {
          jsonStr = new TextDecoder().decode(arrayBuffer);
        }
      } else {
        jsonStr = new TextDecoder().decode(arrayBuffer);
      }

      if (typeof CompilerLoader !== "undefined") {
        const ok = await CompilerLoader.loadProjectJSON(jsonStr);
        if (!ok) throw new Error("Invalid .u5 file format.");
      }

      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playAction("save");
        SoundEngine.playChiptuneTone(880, "square", 0.08, 0.15);
        setTimeout(() => SoundEngine.playChiptuneTone(1174, "square", 0.12, 0.18), 80);
      }
      return true;
    } catch (err) {
      console.error("Decompress & Load failed:", err);
      alert("Failed to load .u5 project: " + err.message);
      return false;
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
