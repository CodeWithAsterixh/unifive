/**
 * UNIFIVE Scripting - Compiler Packager Subsystem
 * Bundles scene layers, scripts, assets, and compiles to .U5 packages via Web Worker.
 */
(function (global) {
  'use strict';

  const CompilerPackager = {
    openExportModal(compiler) {
      if (compiler && compiler.isCompiling) return;
      const modal = document.getElementById("modal-export-u5");
      const previewImg = document.getElementById("export-preview-img");
      const inputTitle = document.getElementById("input-export-title");
      const inputAuthor = document.getElementById("input-export-author");
      const inputVersion = document.getElementById("input-export-version");
      const workerStatus = document.getElementById("export-worker-status");
      const btnConfirm = document.getElementById("btn-confirm-export-u5");

      // Live Snapshot Thumbnail
      const thumbUrl = typeof CompilerAssets !== "undefined" ? CompilerAssets.getCanvasThumbnailDataUrl(220, 136) : null;
      if (previewImg && thumbUrl) {
        previewImg.src = thumbUrl;
      }

      // Meta Badges
      const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
      const metaPersp = document.getElementById("export-meta-perspective");
      const metaLayers = document.getElementById("export-meta-layers");
      const metaScripts = document.getElementById("export-meta-scripts");
      const metaWorld = document.getElementById("export-meta-world");

      const layerCount = typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items ? WorldObjectsManager.items.length : 0;
      let blockCount = 0;
      if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
        Object.values(AppModeController.objectScripts).forEach(list => {
          if (Array.isArray(list)) blockCount += list.length;
        });
      }

      if (metaPersp) metaPersp.innerHTML = `<i class="ph ph-compass"></i><span>${activeView === "topdown" ? "TOP-DOWN" : "SIDE-FACING"}</span>`;
      if (metaLayers) metaLayers.innerHTML = `<i class="ph ph-stack"></i><span>${layerCount} ${layerCount === 1 ? "LAYER" : "LAYERS"}</span>`;
      if (metaScripts) metaScripts.innerHTML = `<i class="ph ph-code"></i><span>${blockCount} ${blockCount === 1 ? "SCRIPT BLOCK" : "SCRIPT BLOCKS"}</span>`;
      if (metaWorld && typeof WorldConfig !== "undefined") metaWorld.innerHTML = `<i class="ph ph-bounding-box"></i><span>${WorldConfig.worldWidth} × ${WorldConfig.worldHeight}</span>`;

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

      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
      }
    },

    closeExportModal(compiler) {
      if (compiler && compiler.isCompiling) return;
      const modal = document.getElementById("modal-export-u5");
      if (modal) modal.style.display = "none";
    },

    async compileWithWorker(compiler, customMeta = {}) {
      if (compiler && compiler.isCompiling) return;
      if (compiler) compiler.isCompiling = true;

      // Audio & UI Feedback
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("save");
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
        const appIcon = typeof CompilerAssets !== "undefined" ? await CompilerAssets.getAppIconDataUrl() : null;
        const thumbnail = typeof CompilerAssets !== "undefined" ? CompilerAssets.getCanvasThumbnailDataUrl(320, 180) : null;

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
          worldWidth: typeof WorldConfig !== "undefined" ? (WorldConfig.worldWidth || 2000) : 2000,
          worldHeight: typeof WorldConfig !== "undefined" ? (WorldConfig.worldHeight || 1500) : 1500,
          bgColor: typeof WorldConfig !== "undefined" ? (WorldConfig.bgColor || "#ffffff") : "#ffffff",
          panX: typeof WorldConfig !== "undefined" ? (WorldConfig.panX || 1000) : 1000,
          panY: typeof WorldConfig !== "undefined" ? (WorldConfig.panY || 750) : 750,
          zoom: typeof WorldConfig !== "undefined" ? (WorldConfig.zoom || 1.0) : 1.0,
          minZoom: typeof WorldConfig !== "undefined" ? (WorldConfig.minZoom || 0.15) : 0.15,
          maxZoom: typeof WorldConfig !== "undefined" ? (WorldConfig.maxZoom || 4.0) : 4.0
        };

        // 4. Collect Placed Layers
        const layers = typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.serialize === "function"
          ? WorldObjectsManager.serialize()
          : [];

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
          const dataUrl = typeof CompilerAssets !== "undefined" ? await CompilerAssets.getImageDataUrl(src) : null;
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

        // 7. Assemble Full Payload
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

            if (typeof CompilerAssets !== "undefined") {
              CompilerAssets.updateStats(`${formattedSize} (${isGzipped ? "Compressed" : "Raw"})`);
            }
            if (typeof SoundEngine !== "undefined") {
              SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
              setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.12, 0.2), 80);
            }

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
        if (compiler) compiler.isCompiling = false;
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
        this.closeExportModal(compiler);
      }
    }
  };

  global.CompilerPackager = CompilerPackager;
})(typeof window !== 'undefined' ? window : globalThis);
