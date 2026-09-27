/**
 * UNIFIVE World - Sprite Pose Animator Subsystem
 * Manages pose resolution, spritesheet frame loading, animation playback, and costume switching.
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

    resolvePoses(item) {
      if (!item) return null;
      if (item.poses && typeof item.poses === "object" && Object.keys(item.poses).length > 0) {
        return item.poses;
      }

      // 1. Search in CreatePalette.assetsData if available
      const assetsData = (typeof CreatePalette !== "undefined" && CreatePalette.assetsData)
        ? CreatePalette.assetsData
        : null;

      if (assetsData) {
        const itemAssetId = item.assetId || item.id || "";
        const itemSrc = item.src || "";
        const itemName = (item.name || "").toLowerCase();

        for (const viewKey of Object.keys(assetsData)) {
          const categories = assetsData[viewKey] || [];
          for (const cat of categories) {
            const catItems = cat.items || [];
            for (const a of catItems) {
              const isMatch = (a.id && a.id === itemAssetId) ||
                              (a.src && a.src === itemSrc) ||
                              (a.id && itemAssetId && itemAssetId.includes(a.id)) ||
                              (a.name && itemName.includes(a.name.toLowerCase()));
              if (isMatch && a.poses) {
                item.poses = JSON.parse(JSON.stringify(a.poses));
                if (!item.defaultPose) item.defaultPose = a.defaultPose || Object.keys(a.poses)[0];
                return item.poses;
              }
            }
          }
        }
      }

      return item.poses || null;
    },

    findMatchingPoseKey(poses, targetPoseName) {
      if (!poses || typeof poses !== "object") return null;
      const keys = Object.keys(poses);
      if (keys.length === 0) return null;
      if (!targetPoseName) return keys[0];

      const cleanTarget = String(targetPoseName).trim().toLowerCase().replace(/[_\s-]+/g, "");

      // 1. Exact match
      if (poses[targetPoseName]) return targetPoseName;

      // 2. Case-insensitive / normalized match
      for (const k of keys) {
        const cleanK = k.trim().toLowerCase().replace(/[_\s-]+/g, "");
        if (cleanK === cleanTarget) return k;
      }

      // 3. Prefix or contains match (e.g. "walk" matches "Walk Left", "Walk Right", "Walk")
      for (const k of keys) {
        const cleanK = k.trim().toLowerCase().replace(/[_\s-]+/g, "");
        if (cleanK.includes(cleanTarget) || cleanTarget.includes(cleanK)) return k;
      }

      // 4. Fallback aliases
      const aliases = {
        "idle": ["idle", "idle2", "standing", "stand"],
        "walk": ["walk", "run", "move", "walking"],
        "run": ["run", "walk", "dash"],
        "jump": ["jump", "leap", "fall"],
        "attack": ["attack1", "attack2", "attack", "shot1", "shot2", "shot", "slash"],
        "shot": ["shot1", "shot2", "attack1", "attack"]
      };

      for (const [aliasGroup, aliasList] of Object.entries(aliases)) {
        if (cleanTarget.includes(aliasGroup)) {
          for (const cand of aliasList) {
            for (const k of keys) {
              const cleanK = k.trim().toLowerCase().replace(/[_\s-]+/g, "");
              if (cleanK.includes(cand)) return k;
            }
          }
        }
      }

      return keys[0];
    },

    setPose(item, poseName, customPoseData = null) {
      if (!item) return;

      const poses = this.resolvePoses(item);
      let matchedKey = poses ? this.findMatchingPoseKey(poses, poseName) : poseName;
      let poseData = customPoseData || (poses && matchedKey ? poses[matchedKey] : null);

      if (matchedKey) {
        item.currentPose = matchedKey;
      }

      if (poseData) {
        item.poseData = poseData;

        // 1. Spritesheet Animation Setup
        if (poseData.sheet || poseData.type === "sheet") {
          item.animType = "sheet";
          item.sheetSrc = poseData.sheet;
          item.frameCount = poseData.frameCount || 1;
          item.frameWidth = poseData.frameWidth || 128;
          item.frameHeight = poseData.frameHeight || 128;
          item.autoplay = (item.frameCount > 1);
          if (!item.animSpeed) item.animSpeed = 100;

          if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.loadImageAsset === "function") {
            WorldObjectsManager.loadImageAsset(poseData.sheet, (cacheEntry) => {
              if (cacheEntry && cacheEntry.loaded && cacheEntry.img) {
                item.p5SheetImg = cacheEntry.img;
                item.loaded = true;
              }
            });
          }
        }

        // 2. Static / Fallback Preview Image Setup
        const previewSrc = poseData.preview || (typeof poseData === "string" ? poseData : poseData.sheet);
        if (previewSrc && typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.loadImageAsset === "function") {
          item.src = previewSrc;
          WorldObjectsManager.loadImageAsset(previewSrc, (cacheEntry) => {
            if (cacheEntry && cacheEntry.loaded && cacheEntry.img) {
              item.p5Img = cacheEntry.img;
              item.loaded = true;
              if (!item.naturalW) item.naturalW = cacheEntry.naturalW;
              if (!item.naturalH) item.naturalH = cacheEntry.naturalH;
            }
          });
        }

        // 3. Multi-frame Array Animation Setup
        if (Array.isArray(poseData.frames) && poseData.frames.length > 0) {
          item.animType = "frames";
          item.frameCount = poseData.frames.length;
          item.autoplay = true;
          item.p5FrameImgs = item.p5FrameImgs || [];

          poseData.frames.forEach((fSrc, idx) => {
            if (typeof WorldObjectsManager !== "undefined") {
              WorldObjectsManager.loadImageAsset(fSrc, (cacheEntry) => {
                if (cacheEntry && cacheEntry.loaded && cacheEntry.img) {
                  item.p5FrameImgs[idx] = cacheEntry.img;
                }
              });
            }
          });
        }
      } else if (item.assetId) {
        // Direct pose preview lookup fallback
        const cleanName = String(poseName || "idle").toLowerCase().replace(/[_\s-]+/g, "_");
        const fallbackSrc = `assets/sprites/pose-previews/${item.assetId}_${cleanName}.png`;
        if (typeof WorldObjectsManager !== "undefined") {
          WorldObjectsManager.loadImageAsset(fallbackSrc, (cacheEntry) => {
            if (cacheEntry && cacheEntry.loaded && cacheEntry.img) {
              item.src = fallbackSrc;
              item.p5Img = cacheEntry.img;
              item.loaded = true;
            }
          });
        }
      }

      // Update UI panels if currently inspecting this item
      if (typeof SpritePosesController !== "undefined" && SpritePosesController.activeItem === item && SpritePosesController.panelEl && SpritePosesController.gridEl) {
        const allCards = SpritePosesController.gridEl.querySelectorAll(".pose-card");
        allCards.forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-pose-name") === item.currentPose);
        });
      }

      if (typeof PropertiesController !== "undefined" && typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.selectedId === item.id) {
        PropertiesController.updateFromSelected(item);
      }

      return item.currentPose;
    },

    nextPose(item) {
      if (!item) return null;
      const poses = this.resolvePoses(item);
      if (!poses || typeof poses !== "object") return null;
      const keys = Object.keys(poses);
      if (keys.length === 0) return null;

      const curIdx = keys.findIndex(k => k.toLowerCase() === (item.currentPose || "").toLowerCase());
      const nextIdx = (curIdx >= 0) ? ((curIdx + 1) % keys.length) : 0;
      return this.setPose(item, keys[nextIdx]);
    },

    preparePoseAssetsForCanvas(item, poseData) {
      if (!item || !poseData) return;
      this.setPose(item, item.currentPose || "Idle", poseData);
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
