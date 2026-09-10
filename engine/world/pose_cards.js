/**
 * UNIFIVE World - Pose Cards & Selector Subsystem
 */
(function (global) {
  'use strict';

  const PoseCards = {
    renderPoseCards(controller, item, poses) {
      if (!controller.gridEl) return;
      if (typeof PoseAnimator !== "undefined") PoseAnimator.stopAllAnimators();
      controller.gridEl.innerHTML = "";

      const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];

      const entries = Object.entries(poses);
      for (const [poseName, poseData] of entries) {
        const isActive = currentPoseName === poseName || currentPoseName.toLowerCase() === poseName.toLowerCase();
        if (typeof PoseCardBuilder !== "undefined") {
          const card = PoseCardBuilder.buildCard(poseName, poseData, isActive, item, (pName, pData) => {
            this.selectPose(controller, item, pName, pData);
          });
          controller.gridEl.appendChild(card);
        }
      }
    },

    selectPose(controller, item, poseName, poseData) {
      if (!item) return;

      item.currentPose = poseName;
      item.poseData = poseData;
      if (typeof PoseAnimator !== "undefined") {
        PoseAnimator.preparePoseAssetsForCanvas(item, poseData);
      }

      const newSrc = poseData.preview || (typeof poseData === "string" ? poseData : (poseData.frames && poseData.frames[0]) || poseData.sheet);
      if (newSrc && typeof WorldObjectsManager !== "undefined") {
        item.src = newSrc;
        WorldObjectsManager.loadImageAsset(newSrc, (cacheEntry) => {
          if (cacheEntry.loaded && cacheEntry.img) {
            item.p5Img = cacheEntry.img;
            item.loaded = true;
            
            const oldNatH = item.naturalH || item.h || 70;
            const currentScale = (oldNatH > 0 && item.h > 0) ? (item.h / oldNatH) : 1.5;

            item.naturalW = cacheEntry.naturalW;
            item.naturalH = cacheEntry.naturalH;

            const newH = Math.max(20, Math.round(cacheEntry.naturalH * currentScale));
            const newW = Math.max(20, Math.round(cacheEntry.naturalW * currentScale));
            
            const oldBottomY = item.y + item.h;
            item.y = oldBottomY - newH;
            item.w = newW;
            item.h = newH;

            if (!item.crop || !item.crop.isCropped) {
              item.crop = { x: 0, y: 0, w: cacheEntry.naturalW, h: cacheEntry.naturalH, isCropped: false };
            }
          }
        });
      }

      if (controller.gridEl) {
        const allCards = controller.gridEl.querySelectorAll(".pose-card");
        for (const c of allCards) {
          c.classList.toggle("active", c.getAttribute("data-pose-name") === poseName);
        }
      }

      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromSelected(item);
      }
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(640, "square", 0.05, 0.1);
    }
  };

  global.PoseCards = PoseCards;
})(typeof window !== 'undefined' ? window : globalThis);
