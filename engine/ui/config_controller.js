/**
 * UNIFIVE Engine - Config Controller Subsystem
 */
const ConfigController = {
  init() {
    if (typeof CfgColorPicker !== "undefined") CfgColorPicker.init(this);
    if (typeof StageLimits !== "undefined") StageLimits.init(this);
    if (typeof CfgToggles !== "undefined") CfgToggles.init(this);
    if (typeof CfgOrientation !== "undefined") CfgOrientation.init(this);

    this.bindCompilationActions();
    this.syncUIFromWorldConfig();
  },

  bindCompilationActions() {
    const btnExportU5 = document.getElementById("btn-cfg-export-u5");
    const btnImportU5 = document.getElementById("btn-cfg-import-u5");
    const btnLoadPreset = document.getElementById("btn-cfg-load-preset");
    const inputLoadU5 = document.getElementById("input-load-u5");

    if (btnExportU5) {
      btnExportU5.addEventListener("click", () => {
        if (typeof CompilerPackager !== "undefined" && typeof CompilerPackager.exportPackage === "function") {
          CompilerPackager.exportPackage(typeof U5Compiler !== "undefined" ? U5Compiler : null);
        } else if (typeof U5Compiler !== "undefined" && typeof U5Compiler.exportPackage === "function") {
          U5Compiler.exportPackage();
        } else if (typeof saveWorkspace === "function") {
          saveWorkspace();
        }
      });
    }

    if (btnImportU5) {
      btnImportU5.addEventListener("click", () => {
        if (inputLoadU5) {
          inputLoadU5.click();
        }
      });
    }

    if (btnLoadPreset) {
      btnLoadPreset.addEventListener("click", () => {
        if (typeof CompilerPresets !== "undefined" && typeof CompilerPresets.openPresetsModal === "function") {
          CompilerPresets.openPresetsModal(typeof U5Compiler !== "undefined" ? U5Compiler : null);
        } else if (typeof U5Compiler !== "undefined" && typeof U5Compiler.openPresetsModal === "function") {
          U5Compiler.openPresetsModal();
        }
      });
    }
  },

  syncUIFromWorldConfig() {
    if (typeof CfgColorPicker !== "undefined" && typeof CfgColorPicker.syncUI === "function") {
      CfgColorPicker.syncUI(this);
    }
    if (typeof StageLimits !== "undefined" && typeof StageLimits.syncUI === "function") {
      StageLimits.syncUI(this);
    }
    if (typeof CfgToggles !== "undefined" && typeof CfgToggles.syncUI === "function") {
      CfgToggles.syncUI(this);
    }
    if (typeof CfgOrientation !== "undefined" && typeof CfgOrientation.syncUI === "function") {
      CfgOrientation.syncUI(this);
    }
    this.updateStats();
  },

  updateStats() {
    const statsText = document.getElementById("u5-stats-text");
    if (!statsText) return;

    const layerCount = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) ? WorldObjectsManager.items.length : 0;
    const scripts = (typeof AppModeController !== "undefined" && AppModeController.objectScripts) ? AppModeController.objectScripts : {};
    let scriptBlockCount = 0;
    for (const key of Object.keys(scripts)) {
      if (Array.isArray(scripts[key])) scriptBlockCount += scripts[key].length;
    }

    statsText.textContent = `${layerCount} ${layerCount === 1 ? 'Layer' : 'Layers'} • ${scriptBlockCount} ${scriptBlockCount === 1 ? 'Script' : 'Scripts'} • Standalone`;
  }
};

if (typeof window !== "undefined") window.ConfigController = ConfigController;
if (typeof globalThis !== "undefined") globalThis.ConfigController = ConfigController;
