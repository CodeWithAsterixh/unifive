/**
 * UNIFIVE World - Pose Cards & Selector Subsystem
 * Renders thumbnail cards for sprite poses and handles pose selection.
 */
(function (global) {
  'use strict';

  const PoseCards = {
    renderPoseCards(controller, item, poses) {
      if (!controller.gridEl) return;
      if (typeof PoseAnimator !== "undefined") PoseAnimator.stopAllAnimators();
      controller.gridEl.innerHTML = "";

      const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];

      Object.entries(poses).forEach(([poseName, poseData]) => {
        const card = document.createElement("div");
        const isActive = currentPoseName === poseName || currentPoseName.toLowerCase() === poseName.toLowerCase();
        card.className = `pose-card ${isActive ? "active" : ""}`;
        card.setAttribute("data-pose-name", poseName);
        card.setAttribute("title", `Click to switch pose to ${poseName}`);

        const frameCount = poseData.frameCount || (poseData.frames ? poseData.frames.length : 1);

        card.innerHTML = `
          <div class="pose-preview-box">
            <canvas class="pose-canvas-elt" width="128" height="128"></canvas>
            <span class="pose-hover-indicator">HOVER: ANIMATE</span>
          </div>
          <div class="pose-footer">
            <span class="pose-name-label">${poseName}</span>
            <span class="pose-frames-badge">${frameCount} ${frameCount === 1 ? "FRAME" : "FRAMES"}</span>
          </div>
        `;

        const canvas = card.querySelector(".pose-canvas-elt");
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = false;

        const previewSrc = poseData.preview || (typeof poseData === "string" ? poseData : poseData.sheet || (poseData.frames && poseData.frames[0]));
        
        let staticImg = null;
        if (typeof PoseAnimator !== "undefined") {
          PoseAnimator.preloadImage(previewSrc).then(img => {
            if (img) {
              staticImg = img;
              ctx.clearRect(0, 0, 128, 128);
              const ratio = Math.min(128 / img.width, 128 / img.height);
              const drawW = img.width * ratio;
              const drawH = img.height * ratio;
              const drawX = (128 - drawW) / 2;
              const drawY = (128 - drawH) / 2;
              ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);
            }
          });
        }

        let animTimer = null;
        let currentFrameIdx = 0;
        let isHovering = false;

        const stopAnimation = () => {
          isHovering = false;
          if (animTimer) {
            clearInterval(animTimer);
            animTimer = null;
          }
          currentFrameIdx = 0;
          if (staticImg) {
            ctx.clearRect(0, 0, 128, 128);
            const ratio = Math.min(128 / staticImg.width, 128 / staticImg.height);
            const drawW = staticImg.width * ratio;
            const drawH = staticImg.height * ratio;
            const drawX = (128 - drawW) / 2;
            const drawY = (128 - drawH) / 2;
            ctx.drawImage(staticImg, 0, 0, staticImg.width, staticImg.height, drawX, drawY, drawW, drawH);
          }
        };

        const startAnimation = async () => {
          isHovering = true;
          if (frameCount <= 1 || typeof PoseAnimator === "undefined") return;

          if (poseData.type === "frames" && Array.isArray(poseData.frames)) {
            const loadedFrames = await Promise.all(poseData.frames.map(f => PoseAnimator.preloadImage(f)));
            if (!isHovering) return;

            animTimer = setInterval(() => {
              currentFrameIdx = (currentFrameIdx + 1) % loadedFrames.length;
              const fImg = loadedFrames[currentFrameIdx];
              if (fImg) {
                ctx.clearRect(0, 0, 128, 128);
                const ratio = Math.min(128 / fImg.width, 128 / fImg.height);
                const drawW = fImg.width * ratio;
                const drawH = fImg.height * ratio;
                const drawX = (128 - drawW) / 2;
                const drawY = (128 - drawH) / 2;
                ctx.drawImage(fImg, 0, 0, fImg.width, fImg.height, drawX, drawY, drawW, drawH);
              }
            }, 100);
          } else {
            const sheetSrc = poseData.sheet || (typeof poseData === "string" ? poseData : null);
            if (!sheetSrc) return;
            const sheetImg = await PoseAnimator.preloadImage(sheetSrc);
            if (!isHovering || !sheetImg) return;

            const fw = poseData.frameWidth || poseData.frameHeight || 128;
            const fh = poseData.frameHeight || 128;

            animTimer = setInterval(() => {
              currentFrameIdx = (currentFrameIdx + 1) % frameCount;
              const sx = currentFrameIdx * fw;
              ctx.clearRect(0, 0, 128, 128);
              ctx.drawImage(sheetImg, sx, 0, fw, fh, 0, 0, 128, 128);
            }, 100);
          }
        };

        card.addEventListener("mouseenter", () => startAnimation());
        card.addEventListener("mouseleave", () => stopAnimation());

        if (typeof PoseAnimator !== "undefined") {
          PoseAnimator.activeAnimators.push(stopAnimation);
        }

        card.addEventListener("click", () => {
          this.selectPose(controller, item, poseName, poseData);
        });

        controller.gridEl.appendChild(card);
      });
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
        controller.gridEl.querySelectorAll(".pose-card").forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-pose-name") === poseName);
        });
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
