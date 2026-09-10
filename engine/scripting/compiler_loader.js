/**
 * UNIFIVE Scripting - Compiler Loader Subsystem
 */
(function (global) {
  'use strict';

  const CompilerLoader = {
    async loadProjectJSON(jsonText) {
      try {
        const data = JSON.parse(jsonText);
        if (data.worldConfig && typeof WorldConfig !== "undefined") {
          if (data.worldConfig.worldWidth) WorldConfig.worldWidth = data.worldConfig.worldWidth;
          if (data.worldConfig.worldHeight) WorldConfig.worldHeight = data.worldConfig.worldHeight;
          if (data.worldConfig.bgColor) WorldConfig.bgColor = data.worldConfig.bgColor;
          if (data.worldConfig.zoom) WorldConfig.zoom = data.worldConfig.zoom;
          if (data.worldConfig.panX) WorldConfig.panX = data.worldConfig.panX;
          if (data.worldConfig.panY) WorldConfig.panY = data.worldConfig.panY;
        }
        if (data.view && typeof ViewController !== "undefined") ViewController.setView(data.view);
        if (Array.isArray(data.items) && typeof WorldObjectsManager !== "undefined") {
          WorldObjectsManager.deserialize(data.items);
        }
        if (data.scripts && typeof AppModeController !== "undefined") {
          AppModeController.objectScripts = data.scripts;
          AppModeController.renderWorkspaceScripts();
        }
        if (Array.isArray(data.variables) && typeof VariableManager !== "undefined") {
          VariableManager.variables = data.variables;
          if (typeof VariableWatchers !== "undefined") VariableWatchers.renderWatchers();
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
