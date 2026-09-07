/**
 * UNIFIVE Scripting - Compiler Assets & Statistics Subsystem
 * Handles image data URL encoding, thumbnail captures, and stats updating.
 */
(function (global) {
  'use strict';

  const CompilerAssets = {
    updateStats(customSizeText = null) {
      const statsText = document.getElementById("u5-stats-text");
      if (!statsText) return;

      const layerCount = typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items ? WorldObjectsManager.items.length : 0;
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
        if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.imageCache) {
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
        if (typeof mainCanvas !== "undefined" && mainCanvas && mainCanvas.elt) {
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
    }
  };

  global.CompilerAssets = CompilerAssets;
})(typeof window !== 'undefined' ? window : globalThis);
