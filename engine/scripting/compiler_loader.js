/**
 * UNIFIVE Scripting - Compiler Loader Subsystem
 */
(function (global) {
  'use strict';

  const CompilerLoader = {
    async loadProjectJSON(jsonText) {
      try {
        const payload = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
        if (!payload || (payload.format !== "UNIFIVE_U5" && !payload.layers && !payload.worldConfig && !payload.items)) {
          throw new Error("Invalid project format.");
        }

        if (payload.metadata && payload.metadata.perspective && typeof ViewController !== "undefined") {
          if (ViewController.currentView !== payload.metadata.perspective) {
            ViewController.setView(payload.metadata.perspective);
          }
        }

        if (payload.bundledAssets && typeof payload.bundledAssets === "object") {
          const preloadPromises = Object.entries(payload.bundledAssets).map(([src, dataUrl]) => {
            return new Promise((resolve) => {
              const storeEntry = (entry) => {
                // Store in the shared cache (WorldObjectsManager.imageCache via ObjectsAssetLoader getter)
                if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.imageCache) {
                  WorldObjectsManager.imageCache[src] = entry;
                }
                if (typeof ObjectsAssetLoader !== "undefined") {
                  // Also store via the getter (same object, but ensures _fallbackCache is seeded too)
                  ObjectsAssetLoader.imageCache[src] = entry;
                }
                resolve();
              };
              if (typeof loadImage === "function") {
                loadImage(
                  dataUrl,
                  (p5Img) => {
                    storeEntry({
                      img: p5Img,
                      loaded: true,
                      naturalW: p5Img.width || 320,
                      naturalH: p5Img.height || 180
                    });
                  },
                  () => {
                    const img = new Image();
                    img.onload = () => {
                      storeEntry({
                        img: img,
                        loaded: true,
                        naturalW: img.naturalWidth || 320,
                        naturalH: img.naturalHeight || 180
                      });
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

        if (payload.worldConfig && typeof WorldConfig !== "undefined") {
          WorldConfig.worldWidth = payload.worldConfig.worldWidth || 2000;
          WorldConfig.worldHeight = payload.worldConfig.worldHeight || 1500;
          WorldConfig.bgColor = payload.worldConfig.bgColor || "#ffffff";
          WorldConfig.panX = payload.worldConfig.panX !== undefined ? payload.worldConfig.panX : (WorldConfig.worldWidth / 2);
          WorldConfig.panY = payload.worldConfig.panY !== undefined ? payload.worldConfig.panY : (WorldConfig.worldHeight / 2);
          WorldConfig.zoom = payload.worldConfig.zoom || 1.0;
          if (WorldConfig.clampPan) WorldConfig.clampPan();

          if (typeof ConfigController !== "undefined" && ConfigController.syncUIFromWorldConfig) {
            ConfigController.syncUIFromWorldConfig();
          }
        }

        const items = payload.layers || payload.items || [];
        if (Array.isArray(items) && typeof WorldObjectsManager !== "undefined") {
          WorldObjectsManager.deserialize(items);
        }

        const scriptsObj = (payload.code && payload.code.objectScripts) || payload.codeScripts || payload.objectScripts || payload.scripts;
        if (scriptsObj && typeof AppModeController !== "undefined") {
          AppModeController.objectScripts = JSON.parse(JSON.stringify(scriptsObj));
        }

        const rawVars = (payload.code && payload.code.variables) || payload.variables;
        if (typeof VariableStore !== "undefined") {
          if (Array.isArray(rawVars)) {
            VariableStore.variables = rawVars;
          } else if (rawVars && typeof rawVars === "object") {
            VariableStore.variables = Object.entries(rawVars).map(([vName, vVal]) => ({
              id: "var_" + vName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
              name: vName,
              scope: "global",
              targetId: null,
              value: Number(vVal) || vVal,
              showWatcher: true
            }));
          }
          if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
        }

        if (typeof LayersController !== "undefined") LayersController.update();
        if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
        if (typeof AppModeController !== "undefined") {
          if (AppModeController.renderObjectsList) AppModeController.renderObjectsList();
          if (AppModeController.updateTargetBadge) AppModeController.updateTargetBadge();
          if (AppModeController.renderScriptsForActiveTarget) AppModeController.renderScriptsForActiveTarget();
        }

        if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.saveHistory) {
          WorldObjectsManager.saveHistory();
        }
        return true;
      } catch (e) {
        console.error("Failed to load project JSON:", e);
        return false;
      }
    }
  };

  global.CompilerLoader = CompilerLoader;
})(typeof window !== 'undefined' ? window : globalThis);
