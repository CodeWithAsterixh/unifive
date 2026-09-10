/**
 * UNIFIVE Scripting - Compiler Assets Subsystem
 */
(function (global) {
  'use strict';

  const CompilerAssets = {
    async fetchAssetBlob(url) {
      try {
        let resp = await fetch(url);
        if (!resp.ok) resp = await fetch("../" + url);
        return resp.ok ? await resp.blob() : null;
      } catch (e) {
        return null;
      }
    },

    async inlineAllAssets(items) {
      if (!items || !Array.isArray(items)) return [];
      const cloned = [];
      for (const item of items) {
        const copy = Object.assign({}, item);
        cloned.push(copy);
      }
      return cloned;
    }
  };

  global.CompilerAssets = CompilerAssets;
})(typeof window !== 'undefined' ? window : globalThis);
