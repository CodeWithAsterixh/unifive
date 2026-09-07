/**
 * UNIFIVE World - Objects Store Subsystem
 * Manages placed items collection, image asset cache, selection, layer ordering, and serialization.
 */
(function (global) {
  'use strict';

  const ObjectsStore = {
    items: [],
    imageCache: {},
    selectedId: null,

    loadImageAsset(src, callback) {
      if (this.imageCache[src]) {
        callback(this.imageCache[src]);
        return;
      }

      if (typeof loadImage === "function") {
        loadImage(
          src,
          (p5Img) => {
            const cacheEntry = {
              img: p5Img,
              loaded: true,
              naturalW: p5Img.width || 320,
              naturalH: p5Img.height || 180
            };
            this.imageCache[src] = cacheEntry;
            callback(cacheEntry);
          },
          (err) => {
            console.warn("Failed to load p5 image:", src, err);
            const cacheEntry = {
              img: null,
              loaded: false,
              naturalW: 320,
              naturalH: 180
            };
            this.imageCache[src] = cacheEntry;
            callback(cacheEntry);
          }
        );
      }
    },

    addItem(assetData, targetX, targetY) {
      const newItem = {
        id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        assetId: assetData.id,
        name: assetData.name || "Asset",
        src: assetData.src,
        type: assetData.type || "image",
        theme: assetData.theme || null,
        defaultPose: assetData.defaultPose || "Idle",
        poses: assetData.poses || null,
        currentPose: assetData.defaultPose || "Idle",
        autoplay: false,
        animSpeed: 100,
        locked: false,
        hidden: false,
        x: 0,
        y: 0,
        w: 320,
        h: 180,
        naturalW: 320,
        naturalH: 180,
        rotation: 0,
        flipH: false,
        flipV: false,
        crop: { x: 0, y: 0, w: 320, h: 180, isCropped: false },
        p5Img: null,
        loaded: false
      };

      this.loadImageAsset(assetData.src, (cacheEntry) => {
        if (cacheEntry.loaded && cacheEntry.img) {
          newItem.p5Img = cacheEntry.img;
          newItem.loaded = true;
          newItem.naturalW = cacheEntry.naturalW;
          newItem.naturalH = cacheEntry.naturalH;
          newItem.crop = { x: 0, y: 0, w: cacheEntry.naturalW, h: cacheEntry.naturalH, isCropped: false };

          let nw = cacheEntry.naturalW;
          let nh = cacheEntry.naturalH;

          if (newItem.type === "sprite" || (newItem.assetId && newItem.assetId.startsWith("sprite_")) || newItem.poses) {
            let spriteScale = 1.5;
            if (nh > 600) {
              spriteScale = 140 / nh;
            } else if (nh <= 32) {
              spriteScale = 2.5;
            }
            nw = Math.max(20, Math.round(nw * spriteScale));
            nh = Math.max(20, Math.round(nh * spriteScale));
          } else {
            const maxDim = 640;
            if (nw > maxDim || nh > maxDim) {
              const ratio = Math.min(maxDim / nw, maxDim / nh);
              nw = Math.round(nw * ratio);
              nh = Math.round(nh * ratio);
            }
          }

          newItem.w = nw;
          newItem.h = nh;
        }

        const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
        const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

        newItem.x = Math.round(targetX - newItem.w / 2);
        newItem.y = Math.round(targetY - newItem.h / 2);

        newItem.x = Math.max(0, Math.min(wWidth - newItem.w, newItem.x));
        newItem.y = Math.max(0, Math.min(wHeight - newItem.h, newItem.y));
        
        if (typeof PropertiesController !== "undefined") {
          PropertiesController.updateFromSelected(newItem);
        }
      });

      const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
      const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

      newItem.x = Math.max(0, Math.min(wWidth - newItem.w, Math.round(targetX - newItem.w / 2)));
      newItem.y = Math.max(0, Math.min(wHeight - newItem.h, Math.round(targetY - newItem.h / 2)));

      this.items.push(newItem);
      this.selectItem(newItem.id);

      if (typeof MouseToolController !== "undefined" && MouseToolController.activeTool !== "select") {
        MouseToolController.setTool("select");
      }

      this.saveHistory();
      if (typeof LayersController !== "undefined") LayersController.update();

      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(520, "square", 0.06, 0.12);
        setTimeout(() => SoundEngine.playChiptuneTone(780, "square", 0.1, 0.14), 50);
      }
    },

    selectItem(id) {
      this.selectedId = id;
      const item = this.getSelectedItem();
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromSelected(item);
      }

      if (typeof SpritePosesController !== "undefined") {
        if (item && (item.type === "sprite" || item.poses || (item.assetId && item.assetId.startsWith("sprite_")))) {
          if (typeof AppModeController === "undefined" || !AppModeController.isCodeMode()) {
            SpritePosesController.show(item);
          }
        } else {
          SpritePosesController.hide();
        }
      }

      if (typeof LayersController !== "undefined") {
        LayersController.update();
      }

      if (typeof AppModeController !== "undefined") {
        AppModeController.renderObjectsList();
        AppModeController.updateTargetBadge();
      }
    },

    getItemAt(worldX, worldY) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const item = this.items[i];
        if (item.hidden) continue;
        const { lx, ly } = ObjectsTransform.worldToLocal(item, worldX, worldY);
        if (lx >= -item.w / 2 && lx <= item.w / 2 && ly >= -item.h / 2 && ly <= item.h / 2) {
          return item;
        }
      }
      return null;
    },

    getSelectedItem() {
      return this.items.find(it => it.id === this.selectedId) || null;
    },

    bringForward(targetId = null, count = 1) {
      const id = targetId || this.selectedId;
      if (!id) return;
      const idx = this.items.findIndex(it => it.id === id);
      if (idx >= 0 && idx < this.items.length - 1) {
        const item = this.items.splice(idx, 1)[0];
        const newIdx = Math.min(this.items.length, idx + (count || 1));
        this.items.splice(newIdx, 0, item);
        this.saveHistory();
        if (typeof LayersController !== "undefined") LayersController.update();
        if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
      }
    },

    sendBackward(targetId = null, count = 1) {
      const id = targetId || this.selectedId;
      if (!id) return;
      const idx = this.items.findIndex(it => it.id === id);
      if (idx > 0) {
        const item = this.items.splice(idx, 1)[0];
        const newIdx = Math.max(0, idx - (count || 1));
        this.items.splice(newIdx, 0, item);
        this.saveHistory();
        if (typeof LayersController !== "undefined") LayersController.update();
        if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(440, "square", 0.05, 0.08);
      }
    },

    bringToFront(targetId = null) {
      const id = targetId || this.selectedId;
      if (!id) return;
      const idx = this.items.findIndex(it => it.id === id);
      if (idx >= 0 && idx < this.items.length - 1) {
        const item = this.items.splice(idx, 1)[0];
        this.items.push(item);
        this.saveHistory();
        if (typeof LayersController !== "undefined") LayersController.update();
        if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(640, "square", 0.06, 0.1);
      }
    },

    sendToBack(targetId = null) {
      const id = targetId || this.selectedId;
      if (!id) return;
      const idx = this.items.findIndex(it => it.id === id);
      if (idx > 0) {
        const item = this.items.splice(idx, 1)[0];
        this.items.unshift(item);
        this.saveHistory();
        if (typeof LayersController !== "undefined") LayersController.update();
        if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(360, "square", 0.06, 0.1);
      }
    },

    duplicateSelected() {
      const item = this.getSelectedItem();
      if (!item) return;

      const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
      const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;

      const clone = {
        ...item,
        id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
        name: `${item.name} (Copy)`,
        x: Math.min(wWidth - item.w, item.x + 24),
        y: Math.min(wHeight - item.h, item.y + 24),
        crop: item.crop ? { ...item.crop } : { x: 0, y: 0, w: item.naturalW || item.w, h: item.naturalH || item.h, isCropped: false },
        locked: false,
        hidden: false
      };

      this.items.push(clone);
      this.selectItem(clone.id);
      this.saveHistory();
      if (typeof LayersController !== "undefined") LayersController.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "square", 0.06, 0.1);
    },

    deleteSelected() {
      if (!this.selectedId) return;
      this.items = this.items.filter(it => it.id !== this.selectedId);
      this.selectedId = null;
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") {
        SpritePosesController.hide();
      }
      this.saveHistory();
      if (typeof LayersController !== "undefined") LayersController.update();
      if (typeof AppModeController !== "undefined") {
        AppModeController.renderObjectsList();
        AppModeController.updateTargetBadge();
      }
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(220, "square", 0.09, 0.12);
    },

    clearAll() {
      this.items = [];
      this.selectedId = null;
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") {
        SpritePosesController.hide();
      }
      this.saveHistory();
      if (typeof LayersController !== "undefined") LayersController.update();
      if (typeof AppModeController !== "undefined") {
        AppModeController.renderObjectsList();
        AppModeController.updateTargetBadge();
      }
    },

    serialize() {
      return this.items.map(it => ({
        id: it.id,
        assetId: it.assetId,
        name: it.name,
        src: it.src,
        type: it.type,
        theme: it.theme,
        defaultPose: it.defaultPose,
        poses: it.poses,
        currentPose: it.currentPose,
        autoplay: !!it.autoplay,
        animSpeed: it.animSpeed || 100,
        locked: !!it.locked,
        hidden: !!it.hidden,
        isPlayable: !!it.isPlayable,
        isSolid: !!it.isSolid,
        deviceVisibility: it.deviceVisibility || "all",
        x: it.x,
        y: it.y,
        w: it.w,
        h: it.h,
        naturalW: it.naturalW || it.w,
        naturalH: it.naturalH || it.h,
        rotation: it.rotation || 0,
        flipH: !!it.flipH,
        flipV: !!it.flipV,
        crop: it.crop ? {
          x: it.crop.x || 0,
          y: it.crop.y || 0,
          w: it.crop.w || it.naturalW || it.w,
          h: it.crop.h || it.naturalH || it.h,
          isCropped: !!it.crop.isCropped
        } : {
          x: 0,
          y: 0,
          w: it.naturalW || it.w,
          h: it.naturalH || it.h,
          isCropped: false
        }
      }));
    },

    deserialize(serializedItems) {
      if (!Array.isArray(serializedItems)) {
        this.items = [];
        this.selectedId = null;
        if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
        if (typeof LayersController !== "undefined") LayersController.update();
        return;
      }

      this.items = serializedItems.map(raw => {
        const item = {
          ...raw,
          autoplay: !!raw.autoplay,
          animSpeed: raw.animSpeed || 100,
          locked: !!raw.locked,
          hidden: !!raw.hidden,
          isPlayable: !!raw.isPlayable,
          isSolid: !!raw.isSolid,
          deviceVisibility: raw.deviceVisibility || "all",
          rotation: raw.rotation || 0,
          flipH: !!raw.flipH,
          flipV: !!raw.flipV,
          crop: raw.crop ? {
            x: raw.crop.x || 0,
            y: raw.crop.y || 0,
            w: raw.crop.w || raw.naturalW || raw.w,
            h: raw.crop.h || raw.naturalH || raw.h,
            isCropped: !!raw.crop.isCropped
          } : {
            x: 0,
            y: 0,
            w: raw.naturalW || raw.w,
            h: raw.naturalH || raw.h,
            isCropped: false
          },
          p5Img: null,
          loaded: false
        };
        this.loadImageAsset(item.src, (cacheEntry) => {
          if (cacheEntry.loaded && cacheEntry.img) {
            item.p5Img = cacheEntry.img;
            item.loaded = true;
            item.naturalW = cacheEntry.naturalW;
            item.naturalH = cacheEntry.naturalH;
            if (!item.crop || !item.crop.isCropped) {
              item.crop = {
                x: 0,
                y: 0,
                w: cacheEntry.naturalW,
                h: cacheEntry.naturalH,
                isCropped: false
              };
            }
          }
        });
        return item;
      });

      if (this.selectedId && !this.items.some(it => it.id === this.selectedId)) {
        this.selectedId = null;
      }
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromSelected(this.getSelectedItem());
      }
      if (typeof LayersController !== "undefined") LayersController.update();
    },

    saveHistory() {
      if (typeof HistoryManager !== "undefined") {
        HistoryManager.pushState({
          type: "world_items",
          items: this.serialize()
        });
      }
      if (typeof AsyncSceneStore !== "undefined") {
        AsyncSceneStore.saveCurrentScene();
      }
      if (typeof U5Compiler !== "undefined") {
        U5Compiler.updateStats();
      }
    }
  };

  global.ObjectsStore = ObjectsStore;
})(typeof window !== 'undefined' ? window : globalThis);
