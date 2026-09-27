/**
 * UNIFIVE Scripting - Compiler Packager Subsystem
 */
(function (global) {
  'use strict';

  const CompilerPackager = {
    async buildPackageData(compiler) {
      const sceneData = {
        version: "1.0.0",
        timestamp: Date.now(),
        worldConfig: typeof WorldConfig !== "undefined" ? {
          worldWidth: WorldConfig.worldWidth,
          worldHeight: WorldConfig.worldHeight,
          bgColor: WorldConfig.bgColor,
          zoom: WorldConfig.zoom,
          panX: WorldConfig.panX,
          panY: WorldConfig.panY,
          responsiveLayering: WorldConfig.responsiveLayering,
          autoGoAround: WorldConfig.autoGoAround
        } : {},
        view: typeof ViewController !== "undefined" ? ViewController.currentView : "sidefacing",
        items: typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items ? WorldObjectsManager.items.map(it => Object.assign({}, it)) : [],
        scripts: typeof AppModeController !== "undefined" ? AppModeController.objectScripts : {},
        variables: typeof VariableManager !== "undefined" ? VariableManager.variables : []
      };

      if (typeof CompilerAssets !== "undefined") {
        sceneData.items = await CompilerAssets.inlineAllAssets(sceneData.items);
      }
      return JSON.stringify(sceneData);
    },

    async exportPackage(compiler) {
      const btnExport = document.getElementById("btn-cfg-export-u5");
      let originalHtml = "";
      if (btnExport) {
        btnExport.disabled = true;
        originalHtml = btnExport.innerHTML;
        btnExport.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>COMPILING...</span>';
      }

      try {
        const jsonStr = await this.buildPackageData(compiler);
        let blob;
        if (typeof CompressionStream !== "undefined") {
          try {
            const stream = new Blob([jsonStr], { type: "application/json" }).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
            blob = await new Response(compressedStream).blob();
          } catch (e) {
            blob = new Blob([jsonStr], { type: "application/json" });
          }
        } else {
          blob = new Blob([jsonStr], { type: "application/json" });
        }

        const sceneName = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.sceneName) ? WorldObjectsManager.sceneName : "unifive_world";
        const cleanName = sceneName.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        const filename = `${cleanName}_${Date.now()}.u5`;
        this.downloadBlob(blob, filename);

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playAction("save");
          SoundEngine.playChiptuneTone(880, "square", 0.08, 0.15);
          setTimeout(() => SoundEngine.playChiptuneTone(1174, "square", 0.12, 0.18), 80);
        }
      } catch (err) {
        console.error("Export .u5 failed:", err);
        alert("Failed to export .u5 project: " + err.message);
      } finally {
        if (btnExport) {
          btnExport.disabled = false;
          btnExport.innerHTML = originalHtml || '<i class="ph ph-file-arrow-down"></i><span>COMPILE TO .U5</span>';
        }
      }
    },

    downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  global.CompilerPackager = CompilerPackager;
})(typeof window !== 'undefined' ? window : globalThis);
