/**
 * UNIFIVE.P5 - Main Application Entrypoint
 * Boots the engine and initializes all studio subsystems
 */

(function (global) {
  'use strict';

  if (typeof document !== 'undefined') {
    const scripts = document.getElementsByTagName('script');
    let basePath = '';
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || '';
      if (src.includes('app.js')) {
        const parts = src.split('/');
        parts.pop();
        basePath = parts.join('/');
        if (basePath && !basePath.endsWith('/')) basePath += '/';
        break;
      }
    }
    document.write('<script src="' + (basePath ? basePath + 'engine/index.js' : 'engine/index.js') + '"><\/script>');
  }
})(typeof window !== 'undefined' ? window : globalThis);
