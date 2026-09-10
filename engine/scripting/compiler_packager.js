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
          panY: WorldConfig.panY
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
