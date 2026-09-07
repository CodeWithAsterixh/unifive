const WorldObjectsManager = {
  items: [],
  imageCache: {},
  selectedId: null,

  // Transform Gizmo Drag State
  dragState: {
    isDragging: false,
    mode: null, // "move" | "resize" | "rotate"
    handle: null, // "nw", "n", "ne", "e", "se", "s", "sw", "w", "rot"
    startX: 0,
    startY: 0,
    startItemX: 0,
    startItemY: 0,
    startItemW: 0,
    startItemH: 0,
    startAngle: 0,
    initialAngle: 0,
    anchorX: 0,
    anchorY: 0
  },

  ghostPreview: {
    active: false,
    item: null,
    worldX: 0,
    worldY: 0
  },

  init() {
    this.initCanvasDropListeners();
    this.initKeyboardListeners();
  },

  initCanvasDropListeners() {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    container.addEventListener("dragenter", (e) => {
      e.preventDefault();
      container.classList.add("drag-hover");
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      container.classList.add("drag-hover");

      if (mainCanvas && typeof WorldConfig !== "undefined") {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
        const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

        this.ghostPreview.active = true;
        this.ghostPreview.item = CreatePanelController ? CreatePanelController.draggedItem : null;
        this.ghostPreview.worldX = Math.round(wx);
        this.ghostPreview.worldY = Math.round(wy);
      }
    });

    container.addEventListener("dragleave", (e) => {
      if (e.relatedTarget && container.contains(e.relatedTarget)) return;
      container.classList.remove("drag-hover");
      this.ghostPreview.active = false;
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      container.classList.remove("drag-hover");
      this.ghostPreview.active = false;

      let item = CreatePanelController ? CreatePanelController.draggedItem : null;
      if (!item) {
        try {
          const raw = e.dataTransfer.getData("application/json");
          if (raw) item = JSON.parse(raw);
        } catch (err) {
          console.warn("Could not parse dropped item JSON", err);
        }
      }

      if (item && mainCanvas) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = WorldConfig.panX + (sx - width / 2) / WorldConfig.zoom;
        const wy = WorldConfig.panY + (sy - height / 2) / WorldConfig.zoom;

        this.addItem(item, wx, wy);
      }
    });
  },

  initKeyboardListeners() {
    window.addEventListener("keydown", (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && this.selectedId && e.target.tagName !== "INPUT") {
        e.preventDefault();
        this.deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && this.selectedId && e.target.tagName !== "INPUT") {
        e.preventDefault();
        this.duplicateSelected();
      }
    });
  },

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
          // Standard crisp pixel scaling: 1.5x of natural character size (or appropriate scale for hi-res)
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

      newItem.x = Math.round(targetX - newItem.w / 2);
      newItem.y = Math.round(targetY - newItem.h / 2);

      newItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - newItem.w, newItem.x));
      newItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - newItem.h, newItem.y));
      
      PropertiesController.updateFromSelected(newItem);
    });

    newItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - newItem.w, Math.round(targetX - newItem.w / 2)));
    newItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - newItem.h, Math.round(targetY - newItem.h / 2)));

    this.items.push(newItem);
    this.selectItem(newItem.id);

    if (MouseToolController.activeTool !== "select") {
      MouseToolController.setTool("select");
    }

    this.saveHistory();
    if (typeof LayersController !== "undefined") LayersController.update();

    SoundEngine.playChiptuneTone(520, "square", 0.06, 0.12);
    setTimeout(() => SoundEngine.playChiptuneTone(780, "square", 0.1, 0.14), 50);
  },

  selectItem(id) {
    this.selectedId = id;
    const item = this.getSelectedItem();
    PropertiesController.updateFromSelected(item);

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

  // Coordinate Conversion: World (wx, wy) -> Local (lx, ly)
  worldToLocal(item, wx, wy) {
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    const dx = wx - cx;
    const dy = wy - cy;
    const rad = -(item.rotation || 0) * Math.PI / 180;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    return { lx, ly, cx, cy };
  },

  // Hit test handles and body for the selected item
  getTransformTarget(item, wx, wy) {
    if (!item) return null;

    // If item is locked: only allow selection, disable canvas transform handles!
    if (item.locked) {
      const { lx, ly } = this.worldToLocal(item, wx, wy);
      const hw = item.w / 2;
      const hh = item.h / 2;
      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
        return { mode: "locked_only", handle: null };
      }
      return null;
    }

    // In Code Mode: Disable resizing and rotation handles! Only allow selection
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      const { lx, ly } = this.worldToLocal(item, wx, wy);
      const hw = item.w / 2;
      const hh = item.h / 2;
      if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
        return { mode: "select_only", handle: null };
      }
      return null;
    }

    const { lx, ly } = this.worldToLocal(item, wx, wy);
    const hw = item.w / 2;
    const hh = item.h / 2;
    const handleHitDist = 12 / WorldConfig.zoom;

    // 1. Rotation Handle at top: (0, -hh - 24)
    if (Math.hypot(lx - 0, ly - (-hh - 24)) <= handleHitDist + 4) {
      return { mode: "rotate", handle: "rot" };
    }

    // 2. 8 Resize Handles
    const handles = {
      nw: [-hw, -hh],
      n:  [0, -hh],
      ne: [hw, -hh],
      e:  [hw, 0],
      se: [hw, hh],
      s:  [0, hh],
      sw: [-hw, hh],
      w:  [-hw, 0]
    };

    for (const [key, [hx, hy]] of Object.entries(handles)) {
      if (Math.hypot(lx - hx, ly - hy) <= handleHitDist) {
        return { mode: "resize", handle: key };
      }
    }

    // 3. Item Body (Inside bounding box)
    if (lx >= -hw && lx <= hw && ly >= -hh && ly <= hh) {
      return { mode: "move", handle: null };
    }

    return null;
  },

  getItemAt(worldX, worldY) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.hidden) continue;
      const { lx, ly } = this.worldToLocal(item, worldX, worldY);
      if (lx >= -item.w / 2 && lx <= item.w / 2 && ly >= -item.h / 2 && ly <= item.h / 2) {
        return item;
      }
    }
    return null;
  },

  getSelectedItem() {
    return this.items.find(it => it.id === this.selectedId) || null;
  },

  // Layer Ordering Operations
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
      SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
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
      SoundEngine.playChiptuneTone(440, "square", 0.05, 0.08);
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
      SoundEngine.playChiptuneTone(640, "square", 0.06, 0.1);
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
      SoundEngine.playChiptuneTone(360, "square", 0.06, 0.1);
    }
  },

  moveLayerFront(targetId, count = 1) {
    this.bringForward(targetId, count);
  },

  moveLayerBack(targetId, count = 1) {
    this.sendBackward(targetId, count);
  },

  duplicateSelected() {
    const item = this.getSelectedItem();
    if (!item) return;

    const clone = {
      ...item,
      id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      name: `${item.name} (Copy)`,
      x: Math.min(WorldConfig.worldWidth - item.w, item.x + 24),
      y: Math.min(WorldConfig.worldHeight - item.h, item.y + 24),
      crop: item.crop ? { ...item.crop } : { x: 0, y: 0, w: item.naturalW || item.w, h: item.naturalH || item.h, isCropped: false },
      locked: false,
      hidden: false
    };

    this.items.push(clone);
    this.selectItem(clone.id);
    this.saveHistory();
    if (typeof LayersController !== "undefined") LayersController.update();
    if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
    SoundEngine.playChiptuneTone(600, "square", 0.06, 0.1);
  },

  deleteSelected() {
    if (!this.selectedId) return;
    this.items = this.items.filter(it => it.id !== this.selectedId);
    this.selectedId = null;
    PropertiesController.updateFromSelected(null);
    if (typeof SpritePosesController !== "undefined") {
      SpritePosesController.hide();
    }
    this.saveHistory();
    if (typeof LayersController !== "undefined") LayersController.update();
    if (typeof AppModeController !== "undefined") {
      AppModeController.renderObjectsList();
      AppModeController.updateTargetBadge();
    }
    SoundEngine.playChiptuneTone(220, "square", 0.09, 0.12);
  },

  clearAll() {
    this.items = [];
    this.selectedId = null;
    PropertiesController.updateFromSelected(null);
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
      PropertiesController.updateFromSelected(null);
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
    PropertiesController.updateFromSelected(this.getSelectedItem());
    if (typeof LayersController !== "undefined") LayersController.update();
  },

  saveHistory() {
    HistoryManager.pushState({
      type: "world_items",
      items: this.serialize()
    });
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }
    if (typeof U5Compiler !== "undefined") {
      U5Compiler.updateStats();
    }
  },

  drawGizmo(item) {
    push();
    translate(item.x + item.w / 2, item.y + item.h / 2);
    rotate(radians(item.rotation || 0));

    const w = item.w;
    const h = item.h;

    // Locked Item Gizmo: Red outline and locked tag
    if (item.locked) {
      stroke(239, 68, 68);
      strokeWeight(2);
      noFill();
      rect(-w / 2, -h / 2, w, h);

      const tagText = `🔒 ${item.name.toUpperCase()} (LOCKED)`;
      textSize(9);
      const tagW = textWidth(tagText) + 14;
      fill(13, 2, 5, 230);
      stroke(239, 68, 68);
      strokeWeight(1);
      rect(-tagW / 2, Math.min(-h / 2 - 28, -h / 2 - 32), tagW, 16);

      fill(255, 120, 120);
      noStroke();
      textAlign(CENTER, CENTER);
      text(tagText, 0, Math.min(-h / 2 - 20, -h / 2 - 24));
      pop();
      return;
    }

    // 1. Selection Bounding Box
    stroke(254, 204, 27);
    strokeWeight(2);
    noFill();
    rect(-w / 2, -h / 2, w, h);

    // 2. Rotation Stalk & Circle Handle
    stroke(254, 204, 27);
    strokeWeight(1.5);
    line(0, -h / 2, 0, -h / 2 - 24);

    fill(254, 204, 27);
    stroke(13, 2, 5);
    strokeWeight(1.5);
    circle(0, -h / 2 - 24, 12);
    fill(13, 2, 5);
    noStroke();
    circle(0, -h / 2 - 24, 4);

    // 3. 8 Resize Handles (Gold pixel squares)
    const handles = [
      [-w/2, -h/2], [0, -h/2], [w/2, -h/2],
      [w/2, 0], [w/2, h/2], [0, h/2],
      [-w/2, h/2], [-w/2, 0]
    ];
    const hs = 8;
    fill(254, 204, 27);
    stroke(13, 2, 5);
    strokeWeight(1.5);
    handles.forEach(([hx, hy]) => {
      rect(hx - hs / 2, hy - hs / 2, hs, hs);
    });

    // 4. Dimension & Rotation Info Tag
    const tagText = `${item.name.toUpperCase()} | ${Math.round(w)}x${Math.round(h)} | ${Math.round(item.rotation || 0)}°`;
    textSize(9);
    const tagW = textWidth(tagText) + 12;
    fill(13, 2, 5, 230);
    stroke(254, 204, 27);
    strokeWeight(1);
    rect(-tagW / 2, Math.min(-h / 2 - 38, -h / 2 - 42), tagW, 16);

    fill(254, 204, 27);
    noStroke();
    textAlign(CENTER, CENTER);
    text(tagText, 0, Math.min(-h / 2 - 30, -h / 2 - 34));
    pop();
  },

  getSortedRenderList(isPlay = false) {
    if (!this.items || this.items.length === 0) return [];
    const isResponsive = WorldConfig.responsiveLayering !== false;

    if (!isResponsive || !isPlay) {
      return this.items.slice();
    }

    const list = this.items.slice();
    list.sort((a, b) => {
      // 1. Static backdrops / Sky / Parallax backgrounds always render first in base layer order
      const aIsBg = (a.locked && a.y <= 0 && (a.h || 0) >= WorldConfig.worldHeight * 0.7) || 
                    (a.assetId && (a.assetId.includes("sky") || a.assetId.includes("bg_") || a.assetId.includes("gradient")));
      const bIsBg = (b.locked && b.y <= 0 && (b.h || 0) >= WorldConfig.worldHeight * 0.7) || 
                    (b.assetId && (b.assetId.includes("sky") || b.assetId.includes("bg_") || b.assetId.includes("gradient")));

      if (aIsBg && !bIsBg) return -1;
      if (!aIsBg && bIsBg) return 1;
      if (aIsBg && bIsBg) return this.items.indexOf(a) - this.items.indexOf(b);

      // 2. Y-Sorting by bottom feet ground position (item.y + item.h)
      const aFeetY = (a.y || 0) + (a.h || 0);
      const bFeetY = (b.y || 0) + (b.h || 0);

      if (Math.abs(aFeetY - bFeetY) > 1) {
        return aFeetY - bFeetY;
      }

      // 3. Secondary tie-breaker: original layer stacking index
      return this.items.indexOf(a) - this.items.indexOf(b);
    });

    return list;
  },

  draw() {
    const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;
    const renderItems = this.getSortedRenderList(isPlay);

    // 1. Draw all placed items
    for (let i = 0; i < renderItems.length; i++) {
      const item = renderItems[i];

      // If item is hidden by code runtime or in player mode, skip rendering
      if (item.hidden) continue;
      if (isPlay && item.hiddenInPlayer) continue;

      push();
      translate(item.x + item.w / 2, item.y + item.h / 2);
      rotate(radians(item.rotation || 0));
      scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

      if (item.loaded && item.p5Img) {
        if (CropController.isActive && item.id === CropController.targetItemId) {
          // In Crop Mode: draw dimmed full image (the overlay will handle highlight and brackets)
          tint(255, 90);
          image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
          noTint();
          const nw = item.naturalW || item.w;
          const nh = item.naturalH || item.h;
          const c = item.crop || { x: 0, y: 0, w: nw, h: nh };
          const cx1 = -item.w / 2 + (c.x / nw) * item.w;
          const cy1 = -item.h / 2 + (c.y / nh) * item.h;
          const cw1 = (c.w / nw) * item.w;
          const ch1 = (c.h / nh) * item.h;
          image(item.p5Img, cx1, cy1, cw1, ch1, c.x, c.y, c.w, c.h);
        } else if (item.autoplay && item.frameCount > 1) {
          // AUTOPLAY MODE: render live animated frame on canvas (strictly proportional)
          const animSpeed = item.animSpeed || 100;
          const frameIdx = Math.floor((millis() / animSpeed) % item.frameCount);

          if (item.animType === "frames" && item.p5FrameImgs && item.p5FrameImgs[frameIdx]) {
            const frameImg = item.p5FrameImgs[frameIdx];
            const srcAspect = (frameImg.width && frameImg.height) ? (frameImg.width / frameImg.height) : (item.w / item.h);
            let drawW, drawH;
            if (srcAspect > item.w / item.h) {
              drawW = item.w;
              drawH = item.w / srcAspect;
            } else {
              drawH = item.h;
              drawW = item.h * srcAspect;
            }
            const drawX = -drawW / 2;
            const drawY = item.h / 2 - drawH; // Ground feet at bottom
            image(frameImg, drawX, drawY, drawW, drawH);
          } else if (item.p5SheetImg) {
            const fw = item.frameWidth || 128;
            const fh = item.frameHeight || 128;
            const sx = frameIdx * fw;
            const charNatH = item.naturalH || item.h || 70;
            
            // If sprite sheet frame has transparent headroom (e.g. 128px frame for ~70px character), scale the full frame so character matches bounding box
            if (fh > charNatH && charNatH > 20) {
              const scale = item.h / charNatH;
              const drawW = fw * scale;
              const drawH = fh * scale;
              const drawX = -drawW / 2;
              const drawY = item.h / 2 - drawH; // Ground feet at bottom of bounding box
              image(item.p5SheetImg, drawX, drawY, drawW, drawH, sx, 0, fw, fh);
            } else {
              const srcAspect = fw / fh;
              let drawW, drawH;
              if (srcAspect > item.w / item.h) {
                drawW = item.w;
                drawH = item.w / srcAspect;
              } else {
                drawH = item.h;
                drawW = item.h * srcAspect;
              }
              const drawX = -drawW / 2;
              const drawY = item.h / 2 - drawH;
              image(item.p5SheetImg, drawX, drawY, drawW, drawH, sx, 0, fw, fh);
            }
          } else if (item.p5Img) {
            image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
          }
        } else if (item.crop && item.crop.isCropped) {
          image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h, item.crop.x, item.crop.y, item.crop.w, item.crop.h);
        } else if (item.p5Img) {
          const isSprite = (item.type === "sprite" || (item.assetId && item.assetId.startsWith("sprite_")) || item.poses);
          if (isSprite && item.p5Img.width && item.p5Img.height) {
            // Strictly proportional sprite rendering (no horizontal or vertical squeezing)
            const srcAspect = item.p5Img.width / item.p5Img.height;
            let drawW, drawH;
            if (srcAspect > item.w / item.h) {
              drawW = item.w;
              drawH = item.w / srcAspect;
            } else {
              drawH = item.h;
              drawW = item.h * srcAspect;
            }
            const drawX = -drawW / 2;
            const drawY = item.h / 2 - drawH; // Feet aligned to bottom
            image(item.p5Img, drawX, drawY, drawW, drawH);
          } else {
            image(item.p5Img, -item.w / 2, -item.h / 2, item.w, item.h);
          }
        }
      } else {
        fill(25, 6, 14, 230);
        stroke(173, 32, 77);
        strokeWeight(2);
        rect(-item.w / 2, -item.h / 2, item.w, item.h);

        fill(254, 204, 27);
        noStroke();
        textSize(10);
        textAlign(CENTER, CENTER);
        text(item.name, 0, 0);
      }
      pop();

      // Render Speech Bubble above sprite if active
      if (item.speechBubble && item.speechBubble.expiresAt > Date.now()) {
        push();
        translate(item.x + item.w / 2, item.y);
        const bubbleText = item.speechBubble.text;
        textSize(11);
        const tw = textWidth(bubbleText);
        const bw = Math.max(50, tw + 20);
        const bh = 26;
        const bx = -bw / 2;
        const by = -bh - 14;

        // Bubble background
        fill(255, 255, 255, 245);
        stroke(46, 8, 20);
        strokeWeight(2);
        rect(bx, by, bw, bh, 5);

        // Arrow pointer pointing down to sprite head
        noStroke();
        fill(255, 255, 255, 245);
        triangle(-5, by + bh - 1, 5, by + bh - 1, 0, by + bh + 8);
        stroke(46, 8, 20);
        strokeWeight(2);
        line(-5, by + bh - 1, 0, by + bh + 8);
        line(5, by + bh - 1, 0, by + bh + 8);

        // Text inside bubble
        fill(26, 4, 11);
        noStroke();
        textAlign(CENTER, CENTER);
        text(bubbleText, 0, by + bh / 2);
        pop();
      }

      // Crop Mode Overlay vs Normal Selection Gizmo (Only in Editor Mode)
      if (!isPlay) {
        if (CropController.isActive && item.id === CropController.targetItemId) {
          CropController.drawCropOverlay(item);
        } else if (item.id === this.selectedId) {
          this.drawGizmo(item);
        }
      }
    }

    // 2. Drag & Drop Ghost Preview (Only in Editor Mode)
    if (!isPlay && this.ghostPreview.active) {
      push();
      const gw = 260;
      const gh = 160;
      const gx = this.ghostPreview.worldX - gw / 2;
      const gy = this.ghostPreview.worldY - gh / 2;

      fill(254, 204, 27, 45);
      stroke(254, 204, 27, 220);
      strokeWeight(2);
      drawingContext.setLineDash([6, 4]);
      rect(gx, gy, gw, gh);
      drawingContext.setLineDash([]);

      if (this.ghostPreview.item) {
        fill(254, 204, 27);
        noStroke();
        textSize(10);
        textAlign(CENTER, CENTER);
        text(`+ DROP: ${this.ghostPreview.item.name.toUpperCase()}`, gx + gw / 2, gy + gh / 2);
      }
      pop();
    }
  }
};

// ============================================================================
// 7. HISTORY MANAGER (Undo / Redo)
// ============================================================================