/**
 * UNIFIVE World - Sprite Pose Animator Subsystem
 */
(function (global) {
  'use strict';

  const PoseAnimator = {
    loadedImages: {},
    activeAnimators: [],

    preloadImage(src) {
      if (this.loadedImages[src]) return Promise.resolve(this.loadedImages[src]);
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { PoseAnimator.loadedImages[src] = img; resolve(img); };
        img.src = src;
      });
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
