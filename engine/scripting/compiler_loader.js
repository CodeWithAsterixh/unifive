/**
 * UNIFIVE Scripting - Compiler Loader Subsystem
 * Decompresses and deserializes .U5 files and restores scenes, layers, assets, and code scripts.
 */
(function (global) {
  'use strict';

  const CompilerLoader = {
    async decompressAndLoad(compiler, fileOrBlob) {
      if (compiler && compiler.isLoading) return;
      if (compiler) compiler.isLoading = true;

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
        if (payload.bundledAssets && typeof payload.bundledAssets === "object" && typeof WorldObjectsManager !== "undefined") {
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
        if (payload.worldConfig && typeof WorldConfig !== "undefined") {
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
        if (Array.isArray(payload.layers) && typeof WorldObjectsManager !== "undefined") {
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

        if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
          WorldObjectsManager.saveHistory();
        }
        if (typeof CompilerAssets !== "undefined") {
          CompilerAssets.updateStats();
        }

        // Sound & Visual Confirmation
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playAction("save");
          SoundEngine.playChiptuneTone(880, "square", 0.08, 0.15);
          setTimeout(() => SoundEngine.playChiptuneTone(1174, "square", 0.12, 0.18), 80);
        }

      } catch (err) {
        console.error("Decompress & Load failed:", err);
        alert("Failed to load .u5 project: " + err.message);
      } finally {
        if (compiler) compiler.isLoading = false;
        if (btnHeader) btnHeader.classList.remove("btn-loading");
        if (btnCfg) {
          btnCfg.disabled = false;
          btnCfg.innerHTML = '<i class="ph ph-folder-open"></i><span>OPEN .U5 FILE</span>';
        }
      }
    }
  };

  global.CompilerLoader = CompilerLoader;
})(typeof window !== 'undefined' ? window : globalThis);
