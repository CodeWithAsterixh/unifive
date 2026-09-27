/**
 * UNIFIVE World - Sprite Pose Animator Subsystem
 */
(function (global) {
  'use strict';

  const PoseAnimator = {
    loadedImages: {},
    _pendingPromises: {},
    activeAnimators: [],

    preloadImage(src) {
      if (!src) return Promise.resolve(null);
      if (this.loadedImages[src]) return Promise.resolve(this.loadedImages[src]);
      if (this._pendingPromises[src]) return this._pendingPromises[src];

      const p = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          PoseAnimator.loadedImages[src] = img;
          delete PoseAnimator._pendingPromises[src];
          resolve(img);
        };
        img.onerror = () => {
          delete PoseAnimator._pendingPromises[src];
          resolve(null);
        };
        img.src = src;
      });

      this._pendingPromises[src] = p;
      return p;
    },

    stopAllAnimators() {
      for (const stopFn of this.activeAnimators) {
        try { stopFn(); } catch (e) {}
      }
      this.activeAnimators = [];
    }
  };

  global.PoseAnimator = PoseAnimator;
})(typeof window !== 'undefined' ? window : globalThis);
