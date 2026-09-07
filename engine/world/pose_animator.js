/**
 * UNIFIVE World - Sprite Pose Animator Subsystem
 * Image preloading, canvas frame preparation, and hover animation loops.
 */
(function (global) {
  'use strict';

  const PoseAnimator = {
    loadedImages: {},
    activeAnimators: [],

    preloadImage(src) {
      if (this.loadedImages[src]) return Promise.resolve(this.loadedImages[src]);
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          this.loadedImages[src] = img;
          resolve(img);
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = src;
      });
    },

    stopAllAnimators() {
      this.activeAnimators.forEach(stopFn => {
        try { stopFn(); } catch (e) {}
      });
      this.activeAnimators = [];
    },

    preparePoseAssetsForCanvas(item, poseData) {
      if (!item || !poseData || typeof WorldObjectsManager === "undefined") return;
      item.frameCount = poseData.frameCount || (poseData.frames ? poseData.frames.length : 1);
      item.frameWidth = poseData.frameWidth || 128;
      item.frameHeight = poseData.frameHeight || 128;
      item.animType = poseData.type;

      if (poseData.type === "frames" && Array.isArray(poseData.frames)) {
        item.p5FrameImgs = item.p5FrameImgs || [];
        poseData.frames.forEach((f, idx) => {
          WorldObjectsManager.loadImageAsset(f, (entry) => {
            if (entry.loaded && entry.img) item.p5FrameImgs[idx] = entry.img;
          });
        });
      } else if (poseData.sheet || typeof poseData === "string") {
        const sheetSrc = poseData.sheet || poseData;
        WorldObjectsManager.loadImageAsset(sheetSrc, (entry) => {
          if (entry.loaded && entry.img) item.p5SheetImg = entry.img;
        });
      }
    }
  };

  global.PoseAnimator = PoseAnimator;
})(typeof window !== 'undefined' ? window : globalThis);
