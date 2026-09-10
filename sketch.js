/**
 * UNIFIVE - Pixelated Burgundy Workspace
 * Top-Down vs Side-Facing Isolated Scene Store (Non-blocking IndexedDB Backend)
 * + CREATE / CONFIG Tabs + World & Pan System + Floating Mouse/Grid Action Dock + Drag & Drop.
 */

// ============================================================================
// 1. SESSION SCENE STORE (In-Memory Session Storage - Fresh on Reload)
// ============================================================================
const AsyncSceneStore = {
  // In-memory cache for fast zero-latency perspective switching during the active session
  cachedScenes: {
    sidefacing: null,
    topdown: null
  },

  async init() {
    // Fresh session on every page load
    this.cachedScenes.sidefacing = this.createDefaultScene("sidefacing");
    this.cachedScenes.topdown = this.createDefaultScene("topdown");

    // Clear any previous persistent IndexedDB records to guarantee fresh reload
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        indexedDB.deleteDatabase("UNIFIVE_STUDIO_DB");
      } catch (e) {}
    }
  },

  saveScene(viewId, sceneSnapshot) {
    this.cachedScenes[viewId] = {
      viewId: viewId,
      ...sceneSnapshot,
      lastSaved: Date.now()
    };
  },

  saveCurrentScene() {
    const currentView = typeof ViewController !== "undefined" && ViewController.currentView ? ViewController.currentView : "sidefacing";
    const snapshot = {
      viewId: currentView,
      worldConfig: {
        bgColor: WorldConfig.bgColor,
        worldWidth: WorldConfig.worldWidth,
        worldHeight: WorldConfig.worldHeight,
        panX: WorldConfig.panX,
        panY: WorldConfig.panY,
        zoom: WorldConfig.zoom,
        responsiveLayering: WorldConfig.responsiveLayering !== false,
        autoGoAround: WorldConfig.autoGoAround !== false
      },
      items: typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.serialize() : [],
      undoStack: typeof HistoryManager !== "undefined" ? HistoryManager.undoStack.slice() : [],
      redoStack: typeof HistoryManager !== "undefined" ? HistoryManager.redoStack.slice() : [],
      activeCategoryId: typeof CreatePanelController !== "undefined" ? CreatePanelController.activeCategoryId : null
    };
    this.saveScene(currentView, snapshot);
  },

  getScene(viewId) {
    return this.cachedScenes[viewId] || null;
  },

  loadSceneToActive(viewId) {
    let scene = this.getScene(viewId);
    if (!scene) {
      scene = this.createDefaultScene(viewId);
      this.cachedScenes[viewId] = scene;
    }

    // 1. Restore World Configuration
    if (scene.worldConfig) {
      WorldConfig.bgColor = scene.worldConfig.bgColor || "#ffffff";
      WorldConfig.worldWidth = scene.worldConfig.worldWidth || 2000;
      WorldConfig.worldHeight = scene.worldConfig.worldHeight || 1500;
      WorldConfig.panX = typeof scene.worldConfig.panX === "number" ? scene.worldConfig.panX : Math.round(WorldConfig.worldWidth / 2);
      WorldConfig.panY = typeof scene.worldConfig.panY === "number" ? scene.worldConfig.panY : Math.round(WorldConfig.worldHeight / 2);
      WorldConfig.zoom = scene.worldConfig.zoom || 1.0;
      WorldConfig.responsiveLayering = scene.worldConfig.responsiveLayering !== false;
      WorldConfig.autoGoAround = scene.worldConfig.autoGoAround !== false;
      WorldConfig.clampPan();
    }

    // 2. Sync CONFIG Panel UI Controls
    if (typeof ConfigController !== "undefined" && ConfigController.syncUIFromWorldConfig) {
      ConfigController.syncUIFromWorldConfig();
    }

    // 3. Restore Placed World Objects
    if (typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.deserialize(scene.items || []);
    }

    // 4. Restore Undo/Redo History Stacks
    if (typeof HistoryManager !== "undefined") {
      HistoryManager.undoStack = (scene.undoStack || []).slice();
      HistoryManager.redoStack = (scene.redoStack || []).slice();
      HistoryManager.updateUI();
    }

    // 5. Restore CREATE Panel Categories & Selection
    if (typeof CreatePanelController !== "undefined") {
      CreatePanelController.activeCategoryId = scene.activeCategoryId || null;
      CreatePanelController.renderCategories();
    }

    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }
  },

  createDefaultScene(viewId) {
    return {
      viewId: viewId,
      worldConfig: {
        bgColor: "#ffffff",
        worldWidth: 2000,
        worldHeight: 1500,
        panX: 1000,
        panY: 750,
        zoom: 1.0,
        responsiveLayering: true,
        autoGoAround: true
      },
      items: [],
      undoStack: [],
      redoStack: [],
      activeCategoryId: viewId === "sidefacing" ? "city" : "tiles"
    };
  }
};

// ============================================================================
// 2. WORLD STATE & PAN SYSTEM
// ============================================================================
let isSpacePressed = false;

const WorldConfig = {
  bgColor: "#ffffff",
  worldWidth: 2000,
  worldHeight: 1500,
  panX: 1000,
  panY: 750,
  zoom: 1.0,
  minZoom: 0.15,
  maxZoom: 4.0,
  responsiveLayering: true,
  autoGoAround: true,

  // Pan Drag State
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  startPanX: 0,
  startPanY: 0,

  init() {
    this.panX = Math.round(this.worldWidth / 2);
    this.panY = Math.round(this.worldHeight / 2);
  },

  clampPan() {
    if (typeof width === "undefined" || typeof height === "undefined" || width <= 0 || height <= 0) {
      this.panX = Math.max(0, Math.min(this.worldWidth, this.panX));
      this.panY = Math.max(0, Math.min(this.worldHeight, this.panY));
      return;
    }

    const halfViewW = (width / 2) / this.zoom;
    const halfViewH = (height / 2) / this.zoom;

    // Horizontal Boundary Clamping (World edge never leaves the canvas border)
    if (this.worldWidth > halfViewW * 2) {
      this.panX = Math.max(halfViewW, Math.min(this.worldWidth - halfViewW, this.panX));
    } else {
      this.panX = this.worldWidth / 2;
    }

    // Vertical Boundary Clamping (World edge never leaves the canvas border)
    if (this.worldHeight > halfViewH * 2) {
      this.panY = Math.max(halfViewH, Math.min(this.worldHeight - halfViewH, this.panY));
    } else {
      this.panY = this.worldHeight / 2;
    }
  },

  setBgColor(hex) {
    this.bgColor = hex;
    AsyncSceneStore.saveCurrentScene();
  },

  setWorldSize(w, h) {
    this.worldWidth = Math.max(200, parseInt(w) || 2000);
    this.worldHeight = Math.max(200, parseInt(h) || 1500);
    this.clampPan();
    AsyncSceneStore.saveCurrentScene();
  },

  setResponsiveLayering(enabled) {
    this.responsiveLayering = !!enabled;
    AsyncSceneStore.saveCurrentScene();
  },

  setAutoGoAround(enabled) {
    this.autoGoAround = !!enabled;
    AsyncSceneStore.saveCurrentScene();
  }
};

// ============================================================================
// 2b. INDEPENDENT CODE MODE PREVIEW CAMERA CONFIG
// ============================================================================
const PreviewConfig = {
  zoom: null,
  panX: null,
  panY: null,
  isUserAdjusted: false,

  reset() {
    this.zoom = null;
    this.panX = null;
    this.panY = null;
    this.isUserAdjusted = false;
  },

  getFitZoom(stageW, stageH, worldW, worldH) {
    if (stageW <= 0 || stageH <= 0 || worldW <= 0 || worldH <= 0) return 0.2;
    const pad = 16;
    const zX = (stageW - pad) / Math.max(1, worldW);
    const zY = (stageH - pad) / Math.max(1, worldH);
    return Math.min(zX, zY);
  },

  getCamera(stageW, stageH, worldW, worldH) {
    const fitZ = this.getFitZoom(stageW, stageH, worldW, worldH);
    const z = (this.isUserAdjusted && this.zoom !== null) ? this.zoom : fitZ;
    const px = (this.isUserAdjusted && this.panX !== null) ? this.panX : (worldW / 2);
    const py = (this.isUserAdjusted && this.panY !== null) ? this.panY : (worldH / 2);
    return { zoom: z, panX: px, panY: py, isPreview: true };
  }
};

function getActiveStageCamera() {
  if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
    return {
      zoom: GamePlayerEngine.camZoom,
      panX: GamePlayerEngine.camX,
      panY: GamePlayerEngine.camY,
      isPreview: false
    };
  }
  if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
    const stageDims = getStageDimensions();
    return PreviewConfig.getCamera(stageDims.w, stageDims.h, WorldConfig.worldWidth, WorldConfig.worldHeight);
  }
  return {
    zoom: WorldConfig.zoom,
    panX: WorldConfig.panX,
    panY: WorldConfig.panY,
    isPreview: false
  };
}

// ============================================================================
// 2. MOUSE TOOL & GRID CONTROLLER (Floating Action Dock)
// ============================================================================
const MouseToolController = {
  activeTool: "move", // "move" | "select"
  showGrid: true,

  init() {
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");
    const btnGrid = document.getElementById("btn-toggle-grid");

    if (btnMove) {
      btnMove.addEventListener("click", () => this.setTool("move"));
    }
    if (btnSelect) {
      btnSelect.addEventListener("click", () => this.setTool("select"));
    }
    if (btnGrid) {
      btnGrid.addEventListener("click", () => this.toggleGrid());
    }

    this.updateCursor();
  },

  setTool(tool) {
    this.activeTool = tool;
    const btnMove = document.getElementById("btn-tool-move");
    const btnSelect = document.getElementById("btn-tool-select");

    if (btnMove) btnMove.classList.toggle("active", tool === "move");
    if (btnSelect) btnSelect.classList.toggle("active", tool === "select");

    this.updateCursor();
    const freqMap = { move: 440, select: 560 };
    SoundEngine.playChiptuneTone(freqMap[tool] || 440, "square", 0.05, 0.08);
  },

  toggleGrid() {
    this.showGrid = !this.showGrid;
    const btn = document.getElementById("btn-toggle-grid");
    const icon = document.getElementById("grid-icon");

    if (btn) btn.classList.toggle("active", this.showGrid);
    if (icon) icon.className = this.showGrid ? "ph ph-grid-four" : "ph ph-square";

    SoundEngine.playChiptuneTone(this.showGrid ? 600 : 300, "square", 0.06, 0.08);
  },

  updateCursor() {
    const container = document.getElementById("canvas-container");
    if (container) {
      container.classList.remove("cursor-move", "cursor-select", "panning");
      container.classList.add(`cursor-${this.activeTool}`);
    }
  }
};

// ============================================================================
// 3. 8-BIT CHIPTUNE SOUND ENGINE (Web Audio API)
// ============================================================================
const SoundEngine = {
  enabled: true,
  audioCtx: null,

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  },

  playChiptuneTone(freq, type = "square", duration = 0.08, volume = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("8-Bit Audio error:", e);
    }
  },

  playAction(action) {
    switch (action) {
      case "undo":
        this.playChiptuneTone(320, "square", 0.07, 0.12);
        setTimeout(() => this.playChiptuneTone(240, "square", 0.09, 0.12), 60);
        break;
      case "redo":
        this.playChiptuneTone(260, "square", 0.07, 0.12);
        setTimeout(() => this.playChiptuneTone(390, "square", 0.09, 0.12), 60);
        break;
      case "save":
        this.playChiptuneTone(523.25, "square", 0.08, 0.12);
        setTimeout(() => this.playChiptuneTone(659.25, "square", 0.08, 0.12), 70);
        setTimeout(() => this.playChiptuneTone(783.99, "square", 0.08, 0.12), 140);
        setTimeout(() => this.playChiptuneTone(1046.50, "square", 0.18, 0.15), 210);
        break;
      case "toggle_on":
        this.playChiptuneTone(440, "square", 0.06, 0.1);
        setTimeout(() => this.playChiptuneTone(880, "square", 0.1, 0.12), 60);
        break;
      case "toggle_off":
        this.playChiptuneTone(600, "square", 0.06, 0.1);
        setTimeout(() => this.playChiptuneTone(300, "square", 0.1, 0.1), 60);
        break;
      default:
        this.playChiptuneTone(440, "square", 0.08, 0.1);
    }
  },

  playSoundEffect(name) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;
      switch (name) {
        case "jump": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
          break;
        }
        case "laser": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        }
        case "coin": {
          this.playChiptuneTone(987.77, "triangle", 0.08, 0.15);
          setTimeout(() => this.playChiptuneTone(1318.51, "triangle", 0.2, 0.15), 70);
          break;
        }
        case "hit": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
          break;
        }
        case "powerup": {
          const notes = [330, 392, 494, 659];
          notes.forEach((freq, idx) => {
            setTimeout(() => this.playChiptuneTone(freq, "square", 0.07, 0.12), idx * 60);
          });
          break;
        }
        default:
          this.playChiptuneTone(440, "square", 0.08, 0.1);
      }
    } catch (e) {
      console.warn("Sound effect error:", e);
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("btn-sound");
    const icon = document.getElementById("sound-icon");
    const label = document.getElementById("sound-label");

    if (this.enabled) {
      this.playAction("toggle_on");
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-speaker-high";
      if (label) label.textContent = "AUDIO: ON";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-speaker-slash";
      if (label) label.textContent = "AUDIO: OFF";
    }
    return this.enabled;
  }
};

// ============================================================================
// 4. VIEW PERSPECTIVE CONTROLLER (Top-Down vs Side-Facing)
// ============================================================================
const ViewController = {
  currentView: "sidefacing", // "topdown" | "sidefacing"

  init() {
    document.querySelectorAll(".btn-view-topdown").forEach(btn => {
      btn.addEventListener("click", () => this.setView("topdown"));
    });
    document.querySelectorAll(".btn-view-sidefacing").forEach(btn => {
      btn.addEventListener("click", () => this.setView("sidefacing"));
    });
  },

  setView(view) {
    if (this.currentView === view) return;
    const previousView = this.currentView;

    // 1. Snapshot and save current active scene to the non-blocking store before switching
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }

    // 2. Set new active view
    this.currentView = view;

    // 3. Update view buttons in header and sidebar
    const topdownBtns = document.querySelectorAll(".btn-view-topdown");
    const sidefacingBtns = document.querySelectorAll(".btn-view-sidefacing");

    if (view === "topdown") {
      topdownBtns.forEach(btn => btn.classList.add("active"));
      sidefacingBtns.forEach(btn => btn.classList.remove("active"));
      SoundEngine.playAction("toggle_on");
    } else {
      topdownBtns.forEach(btn => btn.classList.remove("active"));
      sidefacingBtns.forEach(btn => btn.classList.add("active"));
      SoundEngine.playAction("toggle_off");
    }

    // 4. Load the target scene data (world config, items, undo stacks, categories)
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.loadSceneToActive(view);
    }
  },

  toggleView() {
    const nextView = this.currentView === "topdown" ? "sidefacing" : "topdown";
    this.setView(nextView);
  }
};

// ============================================================================
// 5. CREATE PANEL CONTROLLER (Categories Sidebar + Items Gallery)
// ============================================================================
const CreatePanelController = {
  assetsData: null,
  activeCategoryId: null,
  selectedAssetId: null,
  selectedAsset: null,

  async init() {
    await this.loadAssetsData();
    this.renderCategories();
  },

  async loadAssetsData() {
    try {
      let response = await fetch("assets.json");
      if (!response.ok) {
        response = await fetch("../assets.json");
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.assetsData = await response.json();
    } catch (e) {
      console.warn("Could not load assets.json via fetch, using fallback data.", e);
      this.assetsData = this.getFallbackAssetsData();
    }
  },

  onPerspectiveChange() {
    this.activeCategoryId = null;
    this.renderCategories();
  },

  getCategoriesForCurrentView() {
    if (!this.assetsData) return [];
    const view = ViewController.currentView || "topdown";
    return this.assetsData[view] || [];
  },

  renderCategories() {
    const sidebarEl = document.getElementById("create-kinds-list");
    if (!sidebarEl) return;

    const categories = this.getCategoriesForCurrentView();
    sidebarEl.innerHTML = "";

    if (categories.length === 0) {
      this.renderGallery(null);
      return;
    }

    // Default to the first category if none active or current not in view
    if (!this.activeCategoryId || !categories.some(c => c.id === this.activeCategoryId)) {
      this.activeCategoryId = categories[0].id;
    }

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = `create-cat-btn ${cat.id === this.activeCategoryId ? "active" : ""}`;
      btn.setAttribute("data-cat-id", cat.id);
      btn.setAttribute("title", cat.name + (cat.description ? ` - ${cat.description}` : ""));
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat.id === this.activeCategoryId ? "true" : "false");

      btn.innerHTML = `
        <i class="ph ${cat.icon || "ph-squares-four"}"></i>
        <span class="cat-label">${cat.name}</span>
      `;

      btn.addEventListener("click", () => {
        if (this.activeCategoryId !== cat.id) {
          this.activeCategoryId = cat.id;
          sidebarEl.querySelectorAll(".create-cat-btn").forEach(b => {
            const isActive = b.getAttribute("data-cat-id") === cat.id;
            b.classList.toggle("active", isActive);
            b.setAttribute("aria-selected", isActive ? "true" : "false");
          });
          if (typeof AsyncSceneStore !== "undefined") {
            AsyncSceneStore.saveCurrentScene();
          }
          SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
          this.renderGallery(cat);
        }
      });

      sidebarEl.appendChild(btn);
    });

    const activeCat = categories.find(c => c.id === this.activeCategoryId) || categories[0];
    this.renderGallery(activeCat);
  },

  renderGallery(cat) {
    const headerIcon = document.getElementById("gallery-header-icon");
    const headerTitle = document.getElementById("gallery-header-title");
    const headerCount = document.getElementById("gallery-header-count");
    const gridEl = document.getElementById("create-items-grid");

    if (!gridEl) return;
    gridEl.innerHTML = "";

    if (!cat) {
      if (headerIcon) headerIcon.className = "ph ph-squares-four";
      if (headerTitle) headerTitle.textContent = "EMPTY";
      if (headerCount) headerCount.textContent = "0 ITEMS";
      gridEl.innerHTML = `
        <div class="empty-gallery-state" style="grid-column: 1 / -1;">
          <i class="ph ph-hourglass-empty empty-gallery-icon"></i>
          <span class="empty-gallery-title">NO CATEGORY</span>
          <span class="empty-gallery-subtitle">No categories available for this view.</span>
        </div>
      `;
      return;
    }

    if (headerIcon) headerIcon.className = `ph ${cat.icon || "ph-squares-four"}`;
    if (headerTitle) headerTitle.textContent = cat.name.toUpperCase();

    const items = cat.items || [];
    if (headerCount) headerCount.textContent = `${items.length} ${items.length === 1 ? "ITEM" : "ITEMS"}`;

    if (items.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-gallery-state" style="grid-column: 1 / -1;">
          <i class="ph ph-package empty-gallery-icon"></i>
          <span class="empty-gallery-title">NO ITEMS YET</span>
          <span class="empty-gallery-subtitle">Assets for ${cat.name} are coming soon!</span>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      const isSelected = this.selectedAssetId === item.id;
      card.className = `asset-card ${isSelected ? "active" : ""}`;
      card.setAttribute("data-asset-id", item.id);
      card.setAttribute("title", `Drag to place or click to select: ${item.name}`);
      card.draggable = true;

      card.innerHTML = `
        <div class="asset-thumb-box">
          <img class="asset-thumb-img" src="${item.src}" alt="${item.name}" loading="lazy" draggable="false"
               onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div class="asset-thumb-placeholder" style="display: none;">
            <i class="ph ph-image"></i>
          </div>
        </div>
        <span class="asset-title">${item.name}</span>
      `;

      card.addEventListener("dragstart", (e) => {
        this.draggedItem = item;
        card.classList.add("dragging");
        try {
          e.dataTransfer.setData("application/json", JSON.stringify(item));
          e.dataTransfer.setData("text/plain", item.id);
          e.dataTransfer.effectAllowed = "copy";
        } catch (err) {
          console.warn("DragStart dataTransfer error:", err);
        }
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        this.draggedItem = null;
        if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.ghostPreview) {
          WorldObjectsManager.ghostPreview.active = false;
        }
      });

      card.addEventListener("click", () => {
        this.selectAsset(item);
        gridEl.querySelectorAll(".asset-card").forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-asset-id") === item.id);
        });
        
        // Click to add asset to canvas at current camera view center (with small random jitter)
        if (typeof WorldObjectsManager !== "undefined") {
          const jitterX = (Math.random() - 0.5) * 40;
          const jitterY = (Math.random() - 0.5) * 40;
          WorldObjectsManager.addItem(item, WorldConfig.panX + jitterX, WorldConfig.panY + jitterY);
        }
        
        SoundEngine.playChiptuneTone(680, "square", 0.05, 0.09);
      });

      gridEl.appendChild(card);
    });
  },

  selectAsset(item) {
    this.selectedAssetId = item ? item.id : null;
    this.selectedAsset = item || null;
    if (item && (item.type === "sprite" || item.poses || (item.id && item.id.startsWith("sprite_")))) {
      if (typeof SpritePosesController !== "undefined") {
        SpritePosesController.show(item);
      }
    }
  },

  getFallbackAssetsData() {
    return {
      sidefacing: [
        {
          id: "city",
          name: "City",
          icon: "ph-buildings",
          description: "Urban skylines & buildings",
          items: [
            { id: "city_1_comp", name: "City 1 Skyline", src: "assets/sidefacing-assets/city-backgrounds/city_1_composite.png" },
            { id: "city_2_comp", name: "City 2 Panorama", src: "assets/sidefacing-assets/city-backgrounds/city_2_composite.png" },
            { id: "city_3_comp", name: "City 3 Metropolis", src: "assets/sidefacing-assets/city-backgrounds/city_3_composite.png" }
          ]
        },
        {
          id: "desert",
          name: "Desert",
          icon: "ph-sun",
          description: "Golden sand dunes & oasis",
          items: [
            { id: "desert_1_comp", name: "Desert Oasis 1", src: "assets/sidefacing-assets/desert-oasis-background/desert_1_composite.png" },
            { id: "desert_2_comp", name: "Desert Oasis 2", src: "assets/sidefacing-assets/desert-oasis-background/desert_2_composite.png" }
          ]
        },
        {
          id: "forest",
          name: "Forest",
          icon: "ph-tree",
          description: "Lush trees & meadows",
          items: [
            { id: "forest_1_comp", name: "Forest Meadow 1", src: "assets/sidefacing-assets/forest-and-trees-backgrounds/forest_1_layer5_composite.png" },
            { id: "forest_2_comp", name: "Forest Woods 2", src: "assets/sidefacing-assets/forest-and-trees-backgrounds/forest_2_composite_hd.png" }
          ]
        },
        {
          id: "mountain",
          name: "Mountain",
          icon: "ph-mountains",
          description: "Rocky peaks & ranges",
          items: [
            { id: "mtn_1_comp", name: "Alpine Peak 1", src: "assets/sidefacing-assets/mountain-backgrounds/mountain_1_composite.png" },
            { id: "mtn_2_comp", name: "Alpine Ridge 2", src: "assets/sidefacing-assets/mountain-backgrounds/mountain_2_composite.png" }
          ]
        },
        {
          id: "ocean",
          name: "Ocean",
          icon: "ph-waves",
          description: "Seascapes & ocean waves",
          items: [
            { id: "ocean_1_comp", name: "Ocean Horizon 1", src: "assets/sidefacing-assets/ocean-and-clouds-backgrounds/ocean_1_composite_hd.png" }
          ]
        },
        {
          id: "post-war",
          name: "Post-War",
          icon: "ph-skull",
          description: "Apocalyptic ruins",
          items: [
            { id: "war_1_comp", name: "Warzone 1", src: "assets/sidefacing-assets/post-war-backgrounds/War1_Bright_War.png" }
          ]
        },
        {
          id: "street",
          name: "Street",
          icon: "ph-road-horizon",
          description: "2D streetscapes & shops",
          items: [
            { id: "street_1_comp", name: "Street 1", src: "assets/sidefacing-assets/street-2d-backgrounds/City1_Bright_City1.png" }
          ]
        },
        {
          id: "summer",
          name: "Summer",
          icon: "ph-sun-horizon",
          description: "Sunny villages & meadows",
          items: [
            { id: "summer_1_comp", name: "Summer Village 1", src: "assets/sidefacing-assets/summer-backgrounds/summer_1_composite_hd.png" }
          ]
        },
        {
          id: "sprites",
          name: "Sprites",
          icon: "ph-person-simple-walk",
          description: "Character sprites with multiple action poses and animations",
          folder: "sidefacing-sprites",
          items: [
            { id: "sprite_archer", name: "Archer", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_archer.png", defaultPose: "Idle" },
            { id: "sprite_swordsman", name: "Swordsman", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_swordsman.png", defaultPose: "Idle" },
            { id: "sprite_wizard", name: "Wizard", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_wizard.png", defaultPose: "Idle" }
          ]
        }
      ],
      topdown: [
        { id: "tiles", name: "Tiles & Roads", icon: "ph-grid-four", description: "Tropical land, cobblestone roads & paths", items: [] },
        { id: "structures", name: "Structures", icon: "ph-house-line", description: "Medieval city houses, castles & towers", items: [] },
        { id: "nature", name: "Nature & Rocks", icon: "ph-tree", description: "Boulders, moss stones & trees", items: [] },
        { id: "props", name: "Props & Decor", icon: "ph-cube", description: "City decor, stalls, furniture & pets", items: [] },
        { id: "dungeon", name: "Dungeon", icon: "ph-skull", description: "Dungeon walls, traps & chests", items: [] },
        {
          id: "sprites",
          name: "Sprites",
          icon: "ph-person-simple-walk",
          description: "Top-down character sprites & animals with 4-direction animations",
          items: [
            { id: "sprite_male_sword", name: "Male Warrior (Sword)", theme: "Top-Down RPG Hero", type: "sprite", src: "assets/sprites/topdown/male_sword/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_male_unarmed", name: "Male Adventurer (Unarmed)", theme: "Top-Down RPG Hero", type: "sprite", src: "assets/sprites/topdown/male_unarmed/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_boar", name: "Wild Boar", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/boar/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_deer", name: "Forest Deer", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/deer/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_fox", name: "Red Fox", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/fox/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_hare", name: "Field Hare", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/hare/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_black_grouse", name: "Black Grouse", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/black_grouse/single_frame.png", defaultPose: "Idle Front" }
          ]
        }
      ]
    };
  }
};

// ============================================================================
// 4B. MOBILE NAVIGATION & DRAWER CONTROLLER
// ============================================================================
const MobileNavigationController = {
  isDrawerOpen: false,

  init() {
    // 1. Header Drawer Toggle Button
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => this.toggleDrawer());
    }

    // 2. Mobile Bottom Nav Drawer Button
    const btnNavControls = document.getElementById("btn-mobile-nav-controls");
    if (btnNavControls) {
      btnNavControls.addEventListener("click", () => this.toggleDrawer());
    }

    // 3. Mobile Bottom Nav Canvas & Code Mode Buttons
    const btnNavCanvas = document.getElementById("btn-mobile-nav-canvas");
    if (btnNavCanvas) {
      btnNavCanvas.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("canvas");
        }
        this.closeDrawer();
      });
    }

    const btnNavCode = document.getElementById("btn-mobile-nav-code");
    if (btnNavCode) {
      btnNavCode.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("code");
        }
        this.closeDrawer();
      });
    }

    // 4. Drawer Close Buttons (Controls & Blocks Palette)
    const btnClose = document.getElementById("btn-close-controls-drawer");
    if (btnClose) {
      btnClose.addEventListener("click", () => this.closeDrawer());
    }

    const btnCloseBlocks = document.getElementById("btn-close-blocks-drawer");
    if (btnCloseBlocks) {
      btnCloseBlocks.addEventListener("click", () => this.closeDrawer());
    }

    // 5. Toggle Code Stage Preview Minimization (Mobile)
    const btnToggleStage = document.getElementById("btn-toggle-code-stage");
    if (btnToggleStage) {
      btnToggleStage.addEventListener("click", () => {
        const sidebar = document.getElementById("code-stage-sidebar");
        if (sidebar) {
          sidebar.classList.toggle("collapsed");
          const icon = btnToggleStage.querySelector("i");
          if (icon) {
            icon.className = sidebar.classList.contains("collapsed") ? "ph ph-caret-down" : "ph ph-caret-up";
          }
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
        }
      });
    }

    // 6. Sidebar Backdrop Click to Close
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeDrawer());
    }
  },

  openDrawer() {
    this.isDrawerOpen = true;
    const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
    const targetPane = isCode 
      ? document.getElementById("code-toolbox-pane") 
      : document.getElementById("controls-pane");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (targetPane) {
      targetPane.classList.add("drawer-open");
    }
    if (backdrop) {
      backdrop.style.display = "block";
      requestAnimationFrame(() => backdrop.classList.add("active"));
    }
    SoundEngine.playChiptuneTone(580, "square", 0.04, 0.08);
  },

  closeDrawer() {
    this.isDrawerOpen = false;
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (controlsPane) controlsPane.classList.remove("drawer-open");
    if (codeToolboxPane) codeToolboxPane.classList.remove("drawer-open");

    if (backdrop) {
      backdrop.classList.remove("active");
      setTimeout(() => {
        if (!this.isDrawerOpen) backdrop.style.display = "none";
      }, 250);
    }
  },

  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }
};

// ============================================================================
// 5. PANEL TAB CONTROLLER (CREATE vs LAYERS vs PROPS vs CONFIG)
// ============================================================================
const TabController = {
  currentTab: "create", // "create" | "layers" | "properties" | "config"

  init() {
    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        if (targetTab) this.setTab(targetTab);
      });
    });
  },

  setTab(tabId) {
    this.currentTab = tabId;

    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabBtns.forEach(btn => {
      const isTarget = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("active", isTarget);
      btn.setAttribute("aria-selected", isTarget ? "true" : "false");
    });

    tabPanes.forEach(pane => {
      const isTarget = pane.id === `tab-pane-${tabId}`;
      pane.classList.toggle("active", isTarget);
    });

    if (tabId === "layers" && typeof LayersController !== "undefined") {
      LayersController.update();
    } else if (tabId === "properties" && typeof PropertiesController !== "undefined") {
      PropertiesController.updateFromSelected(typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null);
    } else if (tabId === "config") {
      if (typeof ConfigController !== "undefined") ConfigController.syncUIFromWorldConfig();
      if (typeof U5Compiler !== "undefined") U5Compiler.updateStats();
    }

    SoundEngine.playChiptuneTone(380, "square", 0.06, 0.1);
  }
};

// ============================================================================
// 5B. LAYERS CONTROLLER (Visual Stacking Order, Drag-and-Drop Reordering, Visibility, Locking)
// ============================================================================
const LayersController = {

  init() {
    // 1. Header Quick Reordering Toolbar Buttons
    const btnTop = document.getElementById("btn-layer-top");
    const btnUp = document.getElementById("btn-layer-up");
    const btnDown = document.getElementById("btn-layer-down");
    const btnBot = document.getElementById("btn-layer-bot");

    if (btnTop) btnTop.addEventListener("click", () => WorldObjectsManager.bringToFront());
    if (btnUp) btnUp.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnDown) btnDown.addEventListener("click", () => WorldObjectsManager.sendBackward());
    if (btnBot) btnBot.addEventListener("click", () => WorldObjectsManager.sendToBack());

    // 2. Floating Action Dock Layer Actions (MOVE FRONT / MOVE BACK)
    const btnDockFront = document.getElementById("btn-dock-move-front");
    const btnDockBack = document.getElementById("btn-dock-move-back");

    if (btnDockFront) btnDockFront.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnDockBack) btnDockBack.addEventListener("click", () => WorldObjectsManager.sendBackward());

    // 3. Delegate Layer Item Card clicks, actions, and drag-and-drop
    const listEl = document.getElementById("layers-items-list");
    if (listEl) {
      listEl.addEventListener("click", (e) => {
        const card = e.target.closest(".layer-item-card");
        if (!card) return;
        const id = card.getAttribute("data-id");
        if (!id) return;

        const actionBtn = e.target.closest(".layer-btn");
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.getAttribute("data-action");
          if (action === "up") {
            this.moveItemUp(id);
          } else if (action === "down") {
            this.moveItemDown(id);
          } else if (action === "toggle-vis") {
            this.toggleVisibility(id);
          } else if (action === "toggle-lock") {
            this.toggleLock(id);
          } else if (action === "delete") {
            this.deleteItem(id);
          }
          return;
        }

        // Select the item on canvas and in inspector
        WorldObjectsManager.selectItem(id);
        SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });

      // Pointer-based drag reorder on layer drag handles
      let dragState = null;

      listEl.addEventListener("pointerdown", (e) => {
        const handle = e.target.closest(".layer-drag-handle");
        if (!handle) return;
        const card = handle.closest(".layer-item-card");
        if (!card) return;

        e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const cardRect = card.getBoundingClientRect();
        const listRect = listEl.getBoundingClientRect();

        // Store card width as CSS variable for the fixed-position dragged card
        card.style.setProperty("--drag-card-width", cardRect.width + "px");

        // Create a placeholder with the same height as the card
        const placeholder = document.createElement("div");
        placeholder.className = "layer-drop-placeholder";
        placeholder.style.height = cardRect.height + "px";

        // Calculate offset of pointer relative to card top-left
        const offsetX = e.clientX - cardRect.left;
        const offsetY = e.clientY - cardRect.top;

        // Insert placeholder before card, then make card fixed
        card.parentNode.insertBefore(placeholder, card);
        card.classList.add("layer-dragging");
        card.style.left = cardRect.left + "px";
        card.style.top = cardRect.top + "px";

        listEl.classList.add("is-sorting");

        dragState = {
          card,
          placeholder,
          pointerId: e.pointerId,
          offsetX,
          offsetY,
          startId: card.getAttribute("data-id"),
          scrollAreaRect: listRect
        };
      });

      listEl.addEventListener("pointermove", (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        e.preventDefault();

        const { card, placeholder, offsetX, offsetY, scrollAreaRect } = dragState;

        // Move the card with the pointer
        card.style.left = (e.clientX - offsetX) + "px";
        card.style.top = (e.clientY - offsetY) + "px";

        // Determine which sibling card we're hovering over
        const siblings = [...listEl.querySelectorAll(".layer-item-card:not(.layer-dragging)")];
        let insertBefore = null;

        for (const sib of siblings) {
          const sibRect = sib.getBoundingClientRect();
          const sibMidY = sibRect.top + sibRect.height / 2;
          if (e.clientY < sibMidY) {
            insertBefore = sib;
            break;
          }
        }

        // Move placeholder to the correct insertion point
        if (insertBefore) {
          listEl.insertBefore(placeholder, insertBefore);
        } else {
          // Insert after the last sibling (at the bottom)
          const lastSib = siblings[siblings.length - 1];
          if (lastSib && lastSib.nextSibling !== placeholder) {
            listEl.insertBefore(placeholder, lastSib.nextSibling);
          } else if (!lastSib) {
            listEl.appendChild(placeholder);
          }
        }
      });

      const finishDrag = (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;

        const { card, placeholder, startId } = dragState;
        
        // Determine where the placeholder ended up relative to other cards
        const allCards = [...listEl.querySelectorAll(".layer-item-card:not(.layer-dragging)")];
        const placeholderIndex = [...listEl.children].indexOf(placeholder);
        const cardsBeforePlaceholder = [...listEl.children]
          .slice(0, placeholderIndex)
          .filter(el => el.classList.contains("layer-item-card") && !el.classList.contains("layer-dragging"));

        // Remove drag classes and inline styles
        card.classList.remove("layer-dragging");
        card.style.removeProperty("left");
        card.style.removeProperty("top");
        card.style.removeProperty("--drag-card-width");
        listEl.classList.remove("is-sorting");

        // Move card into the placeholder position in the DOM
        placeholder.replaceWith(card);

        // Now figure out the final reorder:
        // The UI list is in reverse array order: top of list = highest array index (frontmost)
        // cardsBeforePlaceholder.length tells us how many cards are above this card in the UI
        const uiIndexFromTop = cardsBeforePlaceholder.length;
        const totalItems = WorldObjectsManager.items.length;
        const newArrayIndex = totalItems - 1 - uiIndexFromTop;

        const items = WorldObjectsManager.items;
        const fromIdx = items.findIndex(it => it.id === startId);

        if (fromIdx >= 0 && fromIdx !== newArrayIndex && newArrayIndex >= 0 && newArrayIndex < totalItems) {
          const [draggedItem] = items.splice(fromIdx, 1);
          const clampedIdx = Math.max(0, Math.min(items.length, newArrayIndex));
          items.splice(clampedIdx, 0, draggedItem);
          WorldObjectsManager.selectedId = startId;
          WorldObjectsManager.saveHistory();
          this.update();
          if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
          SoundEngine.playChiptuneTone(620, "square", 0.06, 0.1);
        }

        dragState = null;
      };

      listEl.addEventListener("pointerup", finishDrag);
      listEl.addEventListener("pointercancel", finishDrag);
    }
  },

  update() {
    const listEl = document.getElementById("layers-items-list");
    const emptyEl = document.getElementById("layers-empty-state");
    const countBadge = document.getElementById("layers-count-badge");
    const dockLayerGroup = document.getElementById("dock-layer-actions");

    const items = WorldObjectsManager.items;
    const selectedId = WorldObjectsManager.selectedId;

    // 1. Update Layer Count Badge
    if (countBadge) {
      countBadge.textContent = `${items.length} ${items.length === 1 ? "LAYER" : "LAYERS"}`;
    }

    // 2. Update Floating Dock Layer Action Group Visibility
    if (dockLayerGroup) {
      dockLayerGroup.style.display = selectedId ? "inline-flex" : "none";
    }

    // 3. Update Toolbar button states (TOP, UP, DOWN, BOT)
    const btnTop = document.getElementById("btn-layer-top");
    const btnUp = document.getElementById("btn-layer-up");
    const btnDown = document.getElementById("btn-layer-down");
    const btnBot = document.getElementById("btn-layer-bot");

    const selectedIndex = items.findIndex(it => it.id === selectedId);
    const hasSelection = selectedIndex >= 0;
    const canMoveUp = hasSelection && selectedIndex < items.length - 1;
    const canMoveDown = hasSelection && selectedIndex > 0;

    if (btnTop) btnTop.disabled = !canMoveUp;
    if (btnUp) btnUp.disabled = !canMoveUp;
    if (btnDown) btnDown.disabled = !canMoveDown;
    if (btnBot) btnBot.disabled = !canMoveDown;

    if (!listEl) return;

    // 4. Toggle empty state
    if (items.length === 0) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    // 5. Build Layer Cards in Reverse Array Order (index items.length - 1 at TOP = visually in front)
    let html = "";
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const isActive = item.id === selectedId;
      const isLocked = !!item.locked;
      const isHidden = !!item.hidden;
      const layerNum = i + 1; // 1-indexed

      const itemType = (item.type === "sprite" || item.poses || (item.assetId && item.assetId.startsWith("sprite_"))) 
        ? "Sprite" 
        : "Prop";
      const meta = `${Math.round(item.w)}x${Math.round(item.h)} • ${itemType}`;

      html += `
        <div class="layer-item-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isHidden ? 'hidden-layer' : ''}" 
             data-id="${item.id}">
          <div class="layer-card-left">
            <div class="layer-drag-handle" title="Drag to reorder layer">
              <i class="ph ph-dots-six-vertical"></i>
            </div>
            <div class="layer-order-badge" title="Layer #${layerNum}">#${layerNum}</div>
            <div class="layer-thumb-box">
              <img src="${item.src}" alt="${item.name}" class="layer-thumb-img" />
            </div>
            <div class="layer-info-wrap">
              <div class="layer-title-row">
                <span class="layer-title" title="${item.name}">${item.name}</span>
                ${item.isPlayable ? '<span class="layer-hero-badge" title="Designated Playable Character"><i class="ph ph-crown"></i> HERO</span>' : ''}
                ${item.isSolid ? '<span class="layer-solid-badge" title="Solid Obstacle"><i class="ph ph-shield"></i> SOLID</span>' : ''}
              </div>
              <span class="layer-meta">${meta}</span>
            </div>
          </div>
          <div class="layer-card-actions">
            <button class="layer-btn btn-layer-up" data-action="up" title="Bring Forward (1 Step Up)" ${i === items.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
              <i class="ph ph-caret-up"></i>
            </button>
            <button class="layer-btn btn-layer-down" data-action="down" title="Send Backward (1 Step Down)" ${i === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
              <i class="ph ph-caret-down"></i>
            </button>
            <button class="layer-btn btn-layer-vis ${isHidden ? 'is-hidden' : ''}" data-action="toggle-vis" title="${isHidden ? 'Show Layer (Visible on Canvas)' : 'Hide Layer (Hidden on Canvas)'}">
              <i class="ph ${isHidden ? 'ph-eye-slash' : 'ph-eye'}"></i>
            </button>
            <button class="layer-btn btn-layer-lock ${isLocked ? 'is-locked' : ''}" data-action="toggle-lock" title="${isLocked ? 'Unlock Layer (Enable Canvas Editing)' : 'Lock Layer (Freeze Canvas Position)'}">
              <i class="ph ${isLocked ? 'ph-lock-simple' : 'ph-lock-simple-open'}"></i>
            </button>
            <button class="layer-btn btn-layer-delete" data-action="delete" title="Delete Layer">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;
  },

  moveItemUp(id) {
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx >= 0 && idx < WorldObjectsManager.items.length - 1) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx + 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
    }
  },

  moveItemDown(id) {
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx > 0) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx - 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      SoundEngine.playChiptuneTone(420, "square", 0.05, 0.08);
    }
  },

  toggleVisibility(id) {
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    WorldObjectsManager.saveHistory();
    this.update();
    SoundEngine.playChiptuneTone(item.hidden ? 340 : 640, "square", 0.05, 0.08);
  },

  toggleLock(id) {
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.locked = !item.locked;
    WorldObjectsManager.saveHistory();
    this.update();
    SoundEngine.playChiptuneTone(item.locked ? 300 : 600, "square", 0.05, 0.08);
  },

  deleteItem(id) {
    WorldObjectsManager.items = WorldObjectsManager.items.filter(it => it.id !== id);
    if (WorldObjectsManager.selectedId === id) {
      WorldObjectsManager.selectedId = null;
      PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
    }
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof AppModeController !== "undefined") {
      AppModeController.renderObjectsList();
      AppModeController.updateTargetBadge();
    }
    SoundEngine.playChiptuneTone(220, "square", 0.08, 0.1);
  },

  reorderLayer(draggedId, targetId, placeAbove) {
    const items = WorldObjectsManager.items;
    const fromIdx = items.findIndex(it => it.id === draggedId);
    const toIdx = items.findIndex(it => it.id === targetId);

    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const [draggedItem] = items.splice(fromIdx, 1);
    const newTargetIdx = items.findIndex(it => it.id === targetId);

    // In UI, top is index items.length - 1 (frontmost).
    // So "placeAbove in UI" means place at higher array index (after newTargetIdx in array).
    const insertIdx = placeAbove ? newTargetIdx + 1 : newTargetIdx;
    items.splice(Math.max(0, Math.min(items.length, insertIdx)), 0, draggedItem);

    WorldObjectsManager.selectedId = draggedId;
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
    SoundEngine.playChiptuneTone(620, "square", 0.06, 0.1);
  }
};

// ============================================================================
// 6. CONFIG CONTROLLER (Sync UI & World Settings)
// ============================================================================
const ConfigController = {
  init() {
    // 1. Color Picker & Swatches
    const colorPicker = document.getElementById("cfg-bg-color-picker");
    const colorText = document.getElementById("cfg-bg-color-text");
    const colorPreview = document.getElementById("color-preview-box");
    const swatches = document.querySelectorAll(".swatch-btn");

    const updateColorUI = (hex) => {
      if (colorPicker) colorPicker.value = hex;
      if (colorText) colorText.value = hex.toUpperCase();
      if (colorPreview) colorPreview.style.backgroundColor = hex;
      swatches.forEach(s => {
        s.classList.toggle("active", s.getAttribute("data-color").toLowerCase() === hex.toLowerCase());
      });
      WorldConfig.setBgColor(hex);
    };

    if (colorPicker) {
      colorPicker.addEventListener("input", (e) => updateColorUI(e.target.value));
    }
    if (colorText) {
      colorText.addEventListener("change", (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith("#")) val = "#" + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          updateColorUI(val);
        }
      });
    }
    swatches.forEach(swatch => {
      swatch.addEventListener("click", () => {
        const hex = swatch.getAttribute("data-color");
        if (hex) {
          updateColorUI(hex);
          SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    });

    // 2. World Size Inputs & Presets
    const widthInput = document.getElementById("cfg-world-width");
    const heightInput = document.getElementById("cfg-world-height");
    const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

    const updateSizeInputs = (w, h) => {
      if (widthInput) widthInput.value = w;
      if (heightInput) heightInput.value = h;
      WorldConfig.setWorldSize(w, h);
      sizeChips.forEach(chip => {
        const cw = chip.getAttribute("data-w");
        const ch = chip.getAttribute("data-h");
        chip.classList.toggle("active", parseInt(cw) === w && parseInt(ch) === h);
      });
    };

    if (widthInput) {
      widthInput.addEventListener("input", (e) => {
        WorldConfig.setWorldSize(e.target.value, WorldConfig.worldHeight);
      });
    }
    if (heightInput) {
      heightInput.addEventListener("input", (e) => {
        WorldConfig.setWorldSize(WorldConfig.worldWidth, e.target.value);
      });
    }
    sizeChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const w = parseInt(chip.getAttribute("data-w"));
        const h = parseInt(chip.getAttribute("data-h"));
        if (w && h) {
          updateSizeInputs(w, h);
          SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    });

    // 3. Responsive Gameplay Layering & Auto Go Around
    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = WorldConfig.responsiveLayering !== false;
      layeringCheckbox.addEventListener("change", (e) => {
        WorldConfig.setResponsiveLayering(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
      });
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = WorldConfig.autoGoAround !== false;
      autoGoAroundCheckbox.addEventListener("change", (e) => {
        WorldConfig.setAutoGoAround(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.04, 0.08);
      });
    }

    // Set initial values from WorldConfig
    updateColorUI(WorldConfig.bgColor);
    updateSizeInputs(WorldConfig.worldWidth, WorldConfig.worldHeight);
  },

  syncUIFromWorldConfig() {
    const colorPicker = document.getElementById("cfg-bg-color-picker");
    const colorText = document.getElementById("cfg-bg-color-text");
    const colorPreview = document.getElementById("color-preview-box");
    const swatches = document.querySelectorAll(".swatch-btn");

    const hex = WorldConfig.bgColor;
    if (colorPicker) colorPicker.value = hex;
    if (colorText) colorText.value = hex.toUpperCase();
    if (colorPreview) colorPreview.style.backgroundColor = hex;
    swatches.forEach(s => {
      s.classList.toggle("active", s.getAttribute("data-color").toLowerCase() === hex.toLowerCase());
    });

    const widthInput = document.getElementById("cfg-world-width");
    const heightInput = document.getElementById("cfg-world-height");
    const sizeChips = document.querySelectorAll(".size-presets .preset-chip");

    if (widthInput) widthInput.value = WorldConfig.worldWidth;
    if (heightInput) heightInput.value = WorldConfig.worldHeight;
    sizeChips.forEach(chip => {
      const cw = parseInt(chip.getAttribute("data-w"));
      const ch = parseInt(chip.getAttribute("data-h"));
      chip.classList.toggle("active", cw === WorldConfig.worldWidth && ch === WorldConfig.worldHeight);
    });

    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = WorldConfig.responsiveLayering !== false;
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = WorldConfig.autoGoAround !== false;
    }
  }
};

// ============================================================================
// 6. PROPERTIES CONTROLLER & CROP ENGINE
// ============================================================================
const PropertiesController = {
  lockAspect: true,
  isUpdatingUI: false,

  init() {
    // 1. Name & ID
    const nameInput = document.getElementById("prop-name-input");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.name = e.target.value.trim() || "Asset";
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 2. Position Inputs (X, Y)
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");

    if (posX) {
      posX.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.x = parseInt(e.target.value) || 0;
          WorldObjectsManager.saveHistory();
        }
      });
    }

    if (posY) {
      posY.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.y = parseInt(e.target.value) || 0;
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 3. Dimension Inputs (W, H)
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");

    if (sizeW) {
      sizeW.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          const newW = Math.max(10, parseInt(e.target.value) || 10);
          if (this.lockAspect && item.w > 0) {
            const ratio = item.h / item.w;
            item.w = newW;
            item.h = Math.round(newW * ratio);
            if (sizeH) sizeH.value = item.h;
          } else {
            item.w = newW;
          }
          WorldObjectsManager.saveHistory();
        }
      });
    }

    if (sizeH) {
      sizeH.addEventListener("input", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          const newH = Math.max(10, parseInt(e.target.value) || 10);
          if (this.lockAspect && item.h > 0) {
            const ratio = item.w / item.h;
            item.h = newH;
            item.w = Math.round(newH * ratio);
            if (sizeW) sizeW.value = item.w;
          } else {
            item.h = newH;
          }
          WorldObjectsManager.saveHistory();
        }
      });
    }

    // 4. Aspect Ratio Lock Toggle
    const btnLock = document.getElementById("btn-lock-aspect");
    if (btnLock) {
      btnLock.addEventListener("click", () => {
        this.lockAspect = !this.lockAspect;
        btnLock.classList.toggle("active", this.lockAspect);
        btnLock.innerHTML = this.lockAspect 
          ? '<i class="ph ph-lock-simple"></i> LOCK' 
          : '<i class="ph ph-lock-simple-open"></i> FREE';
        SoundEngine.playChiptuneTone(this.lockAspect ? 560 : 380, "square", 0.05, 0.08);
      });
    }

    // Scale Preset Chips
    const scaleChips = document.querySelectorAll(".prop-scale-presets .prop-scale-chip");
    scaleChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const scale = parseFloat(chip.getAttribute("data-scale"));
        const item = WorldObjectsManager.getSelectedItem();
        if (item && scale && item.naturalW && item.naturalH) {
          const refW = item.crop && item.crop.isCropped ? item.crop.w : item.naturalW;
          const refH = item.crop && item.crop.isCropped ? item.crop.h : item.naturalH;
          item.w = Math.round(refW * scale);
          item.h = Math.round(refH * scale);
          this.updateFromSelected(item);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(600, "square", 0.05, 0.08);
        }
      });
    });

    // 5. Rotation Slider & Number Input
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");

    const updateRotation = (val) => {
      const item = WorldObjectsManager.getSelectedItem();
      if (item && !this.isUpdatingUI) {
        let deg = parseInt(val) || 0;
        deg = ((deg % 360) + 360) % 360;
        item.rotation = deg;
        if (rotSlider) rotSlider.value = deg;
        if (rotNum) rotNum.value = deg;
        WorldObjectsManager.saveHistory();
      }
    };

    if (rotSlider) {
      rotSlider.addEventListener("input", (e) => updateRotation(e.target.value));
    }
    if (rotNum) {
      rotNum.addEventListener("input", (e) => updateRotation(e.target.value));
    }

    // Rotation Preset Chips
    const rotChips = document.querySelectorAll(".prop-rotation-presets .prop-rot-chip");
    rotChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const deg = parseInt(chip.getAttribute("data-rot"));
        if (!isNaN(deg)) {
          updateRotation(deg);
          SoundEngine.playChiptuneTone(540, "square", 0.05, 0.08);
        }
      });
    });

    // Flip H & Flip V
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");

    if (btnFlipH) {
      btnFlipH.addEventListener("click", () => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item) {
          item.flipH = !item.flipH;
          btnFlipH.classList.toggle("active", item.flipH);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        }
      });
    }

    if (btnFlipV) {
      btnFlipV.addEventListener("click", () => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item) {
          item.flipV = !item.flipV;
          btnFlipV.classList.toggle("active", item.flipV);
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(480, "square", 0.05, 0.08);
        }
      });
    }

    // 6. Layer Order Buttons
    const btnFront = document.getElementById("btn-bring-front");
    const btnForward = document.getElementById("btn-bring-forward");
    const btnBackward = document.getElementById("btn-send-backward");
    const btnBack = document.getElementById("btn-send-back");

    if (btnFront) btnFront.addEventListener("click", () => WorldObjectsManager.bringToFront());
    if (btnForward) btnForward.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnBackward) btnBackward.addEventListener("click", () => WorldObjectsManager.sendBackward());
    if (btnBack) btnBack.addEventListener("click", () => WorldObjectsManager.sendToBack());

    // 7. Duplicate & Delete Buttons
    const btnDuplicate = document.getElementById("btn-duplicate-item");
    const btnDelete = document.getElementById("btn-delete-item");

    // 8. Playable Hero & Device Visibility Controls
    const chkPlayable = document.getElementById("prop-is-playable");
    if (chkPlayable) {
      chkPlayable.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.isPlayable = e.target.checked;
          if (item.isPlayable) {
            // Unmark other items so there is a primary designated player
            WorldObjectsManager.items.forEach(it => {
              if (it.id !== item.id) it.isPlayable = false;
            });
          }
          WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
          SoundEngine.playChiptuneTone(item.isPlayable ? 784 : 440, "triangle", 0.05, 0.1);
        }
      });
    }

    const selectDeviceVis = document.getElementById("prop-device-visibility");
    if (selectDeviceVis) {
      selectDeviceVis.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.deviceVisibility = e.target.value || "all";
          WorldObjectsManager.saveHistory();
          SoundEngine.playChiptuneTone(520, "square", 0.04, 0.08);
        }
      });
    }

    const selectCollision = document.getElementById("prop-collision-type");
    if (selectCollision) {
      selectCollision.addEventListener("change", (e) => {
        const item = WorldObjectsManager.getSelectedItem();
        if (item && !this.isUpdatingUI) {
          item.isSolid = (e.target.value === "solid");
          WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
          SoundEngine.playChiptuneTone(item.isSolid ? 620 : 440, "square", 0.04, 0.08);
        }
      });
    }

    // Initialize Crop Controller
    CropController.init();
  },

  updateFromSelected(item) {
    const emptyView = document.getElementById("prop-empty-state");
    const formView = document.getElementById("prop-inspector-form");

    if (!item) {
      if (emptyView) emptyView.style.display = "flex";
      if (formView) formView.style.display = "none";
      if (CropController.isActive) CropController.exitCrop(false);
      return;
    }

    if (emptyView) emptyView.style.display = "none";
    if (formView) formView.style.display = "flex";

    this.isUpdatingUI = true;

    const thumbImg = document.getElementById("prop-thumb-img");
    const nameInput = document.getElementById("prop-name-input");
    const idBadge = document.getElementById("prop-id-badge");
    const croppedBadge = document.getElementById("prop-cropped-badge");
    const posX = document.getElementById("prop-pos-x");
    const posY = document.getElementById("prop-pos-y");
    const sizeW = document.getElementById("prop-size-w");
    const sizeH = document.getElementById("prop-size-h");
    const rotSlider = document.getElementById("prop-rotation-slider");
    const rotNum = document.getElementById("prop-rotation-num");
    const btnFlipH = document.getElementById("btn-flip-h");
    const btnFlipV = document.getElementById("btn-flip-v");
    const chkPlayable = document.getElementById("prop-is-playable");
    const selectDeviceVis = document.getElementById("prop-device-visibility");
    const selectCollision = document.getElementById("prop-collision-type");

    const cropX = document.getElementById("prop-crop-x");
    const cropY = document.getElementById("prop-crop-y");
    const cropW = document.getElementById("prop-crop-w");
    const cropH = document.getElementById("prop-crop-h");

    if (thumbImg) thumbImg.src = item.src;
    if (nameInput) nameInput.value = item.name;
    if (idBadge) idBadge.textContent = `ID: ${item.id.substring(0, 14)}`;
    if (croppedBadge) croppedBadge.style.display = (item.crop && item.crop.isCropped) ? "inline-block" : "none";
    if (posX) posX.value = Math.round(item.x);
    if (posY) posY.value = Math.round(item.y);
    if (sizeW) sizeW.value = Math.round(item.w);
    if (sizeH) sizeH.value = Math.round(item.h);
    
    const deg = Math.round(item.rotation || 0);
    if (rotSlider) rotSlider.value = deg;
    if (rotNum) rotNum.value = deg;

    if (btnFlipH) btnFlipH.classList.toggle("active", !!item.flipH);
    if (btnFlipV) btnFlipV.classList.toggle("active", !!item.flipV);
    if (chkPlayable) chkPlayable.checked = !!item.isPlayable;
    if (selectDeviceVis) selectDeviceVis.value = item.deviceVisibility || "all";
    if (selectCollision) selectCollision.value = item.isSolid ? "solid" : "pass_through";

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const c = item.crop || { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    if (cropX) cropX.value = Math.round(c.x);
    if (cropY) cropY.value = Math.round(c.y);
    if (cropW) cropW.value = Math.round(c.w);
    if (cropH) cropH.value = Math.round(c.h);

    CropController.updateUI();

    this.isUpdatingUI = false;
  }
};

const CropController = {
  isActive: false,
  targetItemId: null,
  activeAspect: "free",
  savedCropBackup: null,
  savedItemDims: null,

  cropDragState: {
    isDragging: false,
    handle: null, // "nw", "n", "ne", "e", "se", "s", "sw", "w", "body"
    startX: 0,
    startY: 0,
    startLx: 0,
    startLy: 0,
    startCrop: { x: 0, y: 0, w: 0, h: 0 }
  },

  init() {
    const btnToggle = document.getElementById("btn-toggle-crop");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        const item = WorldObjectsManager.getSelectedItem();
        if (!item) return;
        if (this.isActive) {
          this.exitCrop(true);
        } else {
          this.startCrop(item.id);
        }
      });
    }

    const btnReset = document.getElementById("btn-reset-crop");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        this.resetCrop();
      });
    }

    const cropChips = document.querySelectorAll(".prop-crop-presets .prop-crop-chip");
    cropChips.forEach(chip => {
      chip.addEventListener("click", () => {
        cropChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.activeAspect = chip.getAttribute("data-aspect");
        this.applyAspectPreset(this.activeAspect);
      });
    });

    const cropX = document.getElementById("prop-crop-x");
    const cropY = document.getElementById("prop-crop-y");
    const cropW = document.getElementById("prop-crop-w");
    const cropH = document.getElementById("prop-crop-h");

    const onNumericCropChange = () => {
      const item = WorldObjectsManager.getSelectedItem();
      if (!item || PropertiesController.isUpdatingUI) return;
      if (!item.crop) {
        item.crop = { x: 0, y: 0, w: item.naturalW || item.w, h: item.naturalH || item.h, isCropped: false };
      }
      const nw = item.naturalW || item.w;
      const nh = item.naturalH || item.h;

      let cx = Math.max(0, Math.min(nw - 4, parseInt(cropX ? cropX.value : 0) || 0));
      let cy = Math.max(0, Math.min(nh - 4, parseInt(cropY ? cropY.value : 0) || 0));
      let cw = Math.max(4, Math.min(nw - cx, parseInt(cropW ? cropW.value : nw) || nw));
      let ch = Math.max(4, Math.min(nh - cy, parseInt(cropH ? cropH.value : nh) || nh));

      item.crop.x = cx;
      item.crop.y = cy;
      item.crop.w = cw;
      item.crop.h = ch;
      item.crop.isCropped = (cx > 0 || cy > 0 || cw < nw || ch < nh);
      WorldObjectsManager.saveHistory();
    };

    [cropX, cropY, cropW, cropH].forEach(input => {
      if (input) input.addEventListener("input", onNumericCropChange);
    });

    const btnApply = document.getElementById("btn-apply-crop");
    if (btnApply) {
      btnApply.addEventListener("click", () => {
        this.applyCrop();
      });
    }

    const btnCanvasApply = document.getElementById("btn-canvas-apply-crop");
    const btnCanvasCancel = document.getElementById("btn-canvas-cancel-crop");

    if (btnCanvasApply) btnCanvasApply.addEventListener("click", () => this.applyCrop());
    if (btnCanvasCancel) btnCanvasCancel.addEventListener("click", () => this.exitCrop(false));
  },

  startCrop(itemId) {
    const item = WorldObjectsManager.items.find(it => it.id === itemId);
    if (!item) return;

    this.isActive = true;
    this.targetItemId = itemId;
    WorldObjectsManager.selectItem(itemId);

    if (!item.crop) {
      item.crop = {
        x: 0,
        y: 0,
        w: item.naturalW || item.w,
        h: item.naturalH || item.h,
        isCropped: false
      };
    }

    this.savedCropBackup = { ...item.crop };
    this.savedItemDims = { w: item.w, h: item.h, x: item.x, y: item.y };

    this.updateUI();
    SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
  },

  applyCrop() {
    const item = WorldObjectsManager.getSelectedItem();
    if (!item) {
      this.exitCrop(false);
      return;
    }

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const isActuallyCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
    item.crop.isCropped = isActuallyCropped;

    if (isActuallyCropped) {
      const oldW = item.w;
      const oldH = item.h;
      const cx = item.x + oldW / 2;
      const cy = item.y + oldH / 2;

      const scaleX = oldW / nw;
      const scaleY = oldH / nh;
      const scale = (scaleX + scaleY) / 2;

      item.w = Math.max(20, Math.round(item.crop.w * scale));
      item.h = Math.max(20, Math.round(item.crop.h * scale));
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }

    this.exitCrop(true);
    WorldObjectsManager.saveHistory();
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(680, "square", 0.08, 0.12);
  },

  resetCrop() {
    const item = WorldObjectsManager.getSelectedItem();
    if (!item) return;

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;

    item.crop = {
      x: 0,
      y: 0,
      w: nw,
      h: nh,
      isCropped: false
    };

    const ratio = nw / nh;
    if (item.w / item.h !== ratio) {
      item.h = Math.round(item.w / ratio);
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }

    if (this.isActive) {
      this.exitCrop(true);
    }

    WorldObjectsManager.saveHistory();
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(420, "square", 0.08, 0.1);
  },

  exitCrop(keepChanges = true) {
    if (!keepChanges && this.savedCropBackup && this.targetItemId) {
      const item = WorldObjectsManager.items.find(it => it.id === this.targetItemId);
      if (item) {
        item.crop = { ...this.savedCropBackup };
        if (this.savedItemDims) {
          item.w = this.savedItemDims.w;
          item.h = this.savedItemDims.h;
          item.x = this.savedItemDims.x;
          item.y = this.savedItemDims.y;
        }
      }
    }

    this.isActive = false;
    this.targetItemId = null;
    this.cropDragState.isDragging = false;
    this.updateUI();

    const item = WorldObjectsManager.getSelectedItem();
    if (item) PropertiesController.updateFromSelected(item);
  },

  applyAspectPreset(aspect) {
    const item = WorldObjectsManager.getSelectedItem();
    if (!item) return;
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    if (!item.crop) {
      item.crop = { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    }

    if (aspect === "orig") {
      item.crop.x = 0;
      item.crop.y = 0;
      item.crop.w = nw;
      item.crop.h = nh;
    } else if (aspect === "1:1") {
      const size = Math.min(nw, nh);
      item.crop.w = size;
      item.crop.h = size;
      item.crop.x = Math.round((nw - size) / 2);
      item.crop.y = Math.round((nh - size) / 2);
    } else if (aspect === "4:3") {
      let w = nw;
      let h = Math.round(w * 3 / 4);
      if (h > nh) {
        h = nh;
        w = Math.round(h * 4 / 3);
      }
      item.crop.w = w;
      item.crop.h = h;
      item.crop.x = Math.round((nw - w) / 2);
      item.crop.y = Math.round((nh - h) / 2);
    } else if (aspect === "16:9") {
      let w = nw;
      let h = Math.round(w * 9 / 16);
      if (h > nh) {
        h = nh;
        w = Math.round(h * 16 / 9);
      }
      item.crop.w = w;
      item.crop.h = h;
      item.crop.x = Math.round((nw - w) / 2);
      item.crop.y = Math.round((nh - h) / 2);
    }

    item.crop.isCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
    PropertiesController.updateFromSelected(item);
    SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
  },

  getCropTransformTarget(item, wx, wy) {
    if (!item || !item.crop) return null;
    const { lx, ly } = WorldObjectsManager.worldToLocal(item, wx, wy);
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;

    const cx1 = -item.w / 2 + (item.crop.x / nw) * item.w;
    const cy1 = -item.h / 2 + (item.crop.y / nh) * item.h;
    const cw1 = (item.crop.w / nw) * item.w;
    const ch1 = (item.crop.h / nh) * item.h;

    const handleHitDist = 14 / WorldConfig.zoom;

    const handles = {
      nw: [cx1, cy1],
      n:  [cx1 + cw1 / 2, cy1],
      ne: [cx1 + cw1, cy1],
      e:  [cx1 + cw1, cy1 + ch1 / 2],
      se: [cx1 + cw1, cy1 + ch1],
      s:  [cx1 + cw1 / 2, cy1 + ch1],
      sw: [cx1, cy1 + ch1],
      w:  [cx1, cy1 + ch1 / 2]
    };

    for (const [key, [hx, hy]] of Object.entries(handles)) {
      if (Math.hypot(lx - hx, ly - hy) <= handleHitDist) {
        return { mode: "crop", handle: key, lx, ly };
      }
    }

    if (lx >= cx1 && lx <= cx1 + cw1 && ly >= cy1 && ly <= cy1 + ch1) {
      return { mode: "crop", handle: "body", lx, ly };
    }

    return null;
  },

  drawCropOverlay(item) {
    push();
    translate(item.x + item.w / 2, item.y + item.h / 2);
    rotate(radians(item.rotation || 0));
    scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const w = item.w;
    const h = item.h;

    const c = item.crop || { x: 0, y: 0, w: nw, h: nh };
    const cx1 = -w / 2 + (c.x / nw) * w;
    const cy1 = -h / 2 + (c.y / nh) * h;
    const cw1 = (c.w / nw) * w;
    const ch1 = (c.h / nh) * h;

    // 1. Darkened outer shroud
    fill(0, 0, 0, 160);
    noStroke();
    // Top strip
    rect(-w / 2, -h / 2, w, cy1 - (-h / 2));
    // Bottom strip
    rect(-w / 2, cy1 + ch1, w, (h / 2) - (cy1 + ch1));
    // Left strip
    rect(-w / 2, cy1, cx1 - (-w / 2), ch1);
    // Right strip
    rect(cx1 + cw1, cy1, (w / 2) - (cx1 + cw1), ch1);

    // 2. Rule of thirds grid
    stroke(255, 255, 255, 70);
    strokeWeight(1);
    line(cx1 + cw1 / 3, cy1, cx1 + cw1 / 3, cy1 + ch1);
    line(cx1 + (cw1 * 2) / 3, cy1, cx1 + (cw1 * 2) / 3, cy1 + ch1);
    line(cx1, cy1 + ch1 / 3, cx1 + cw1, cy1 + ch1 / 3);
    line(cx1, cy1 + (ch1 * 2) / 3, cx1 + cw1, cy1 + (ch1 * 2) / 3);

    // 3. Crop box border
    stroke(121, 247, 167);
    strokeWeight(2);
    noFill();
    rect(cx1, cy1, cw1, ch1);

    // 4. 8 Heavy Corner & Edge Brackets
    stroke(254, 204, 27);
    strokeWeight(3.5);
    strokeCap(SQUARE);
    const bLen = Math.min(16, Math.min(cw1, ch1) / 3);

    // NW
    line(cx1, cy1, cx1 + bLen, cy1);
    line(cx1, cy1, cx1, cy1 + bLen);
    // NE
    line(cx1 + cw1, cy1, cx1 + cw1 - bLen, cy1);
    line(cx1 + cw1, cy1, cx1 + cw1, cy1 + bLen);
    // SE
    line(cx1 + cw1, cy1 + ch1, cx1 + cw1 - bLen, cy1 + ch1);
    line(cx1 + cw1, cy1 + ch1, cx1 + cw1, cy1 + ch1 - bLen);
    // SW
    line(cx1, cy1 + ch1, cx1 + bLen, cy1 + ch1);
    line(cx1, cy1 + ch1, cx1, cy1 + ch1 - bLen);

    // Edges
    line(cx1 + cw1 / 2 - bLen / 2, cy1, cx1 + cw1 / 2 + bLen / 2, cy1);
    line(cx1 + cw1 / 2 - bLen / 2, cy1 + ch1, cx1 + cw1 / 2 + bLen / 2, cy1 + ch1);
    line(cx1, cy1 + ch1 / 2 - bLen / 2, cx1, cy1 + ch1 / 2 + bLen / 2);
    line(cx1 + cw1, cy1 + ch1 / 2 - bLen / 2, cx1 + cw1, cy1 + ch1 / 2 + bLen / 2);

    // 5. Crop Size Tag Badge
    const cropTag = `CROP: ${Math.round(c.w)}x${Math.round(c.h)} PX`;
    textSize(9);
    const tagW = textWidth(cropTag) + 12;
    fill(13, 2, 5, 230);
    stroke(121, 247, 167);
    strokeWeight(1);
    rect(cx1 + cw1 / 2 - tagW / 2, cy1 - 22, tagW, 16);

    fill(121, 247, 167);
    noStroke();
    textAlign(CENTER, CENTER);
    text(cropTag, cx1 + cw1 / 2, cy1 - 14);

    pop();
  },

  updateUI() {
    const btnToggle = document.getElementById("btn-toggle-crop");
    const labelToggle = document.getElementById("btn-toggle-crop-label");
    const floatBar = document.getElementById("floating-crop-bar");

    if (btnToggle) {
      btnToggle.classList.toggle("active", this.isActive);
      if (labelToggle) {
        labelToggle.textContent = this.isActive ? "EXIT CROP" : "CROP ON CANVAS";
      }
    }

    if (floatBar) {
      floatBar.style.display = this.isActive ? "flex" : "none";
    }
  }
};

// ============================================================================
// SPRITE POSES CONTROLLER (Floating Animated Poses Drawer)
// ============================================================================
const SpritePosesController = {
  panelEl: null,
  charNameEl: null,
  themeBadgeEl: null,
  countEl: null,
  gridEl: null,
  btnCloseEl: null,
  btnMinimizeEl: null,
  btnAutoplayToggleEl: null,
  autoplayLabelEl: null,
  activeItem: null,
  activeAnimators: [],
  loadedImages: {},

  init() {
    this.panelEl = document.getElementById("floating-sprite-poses-panel");
    this.charNameEl = document.getElementById("sprite-poses-char-name");
    this.themeBadgeEl = document.getElementById("sprite-poses-theme-badge");
    this.countEl = document.getElementById("sprite-poses-count");
    this.gridEl = document.getElementById("sprite-poses-grid");
    this.btnCloseEl = document.getElementById("btn-close-sprite-poses");
    this.btnMinimizeEl = document.getElementById("btn-minimize-sprite-poses");
    this.btnAutoplayToggleEl = document.getElementById("btn-toggle-sprite-autoplay");
    this.autoplayLabelEl = document.getElementById("sprite-autoplay-label");

    if (this.btnCloseEl) {
      this.btnCloseEl.addEventListener("click", () => {
        this.hide();
        SoundEngine.playChiptuneTone(380, "square", 0.05, 0.08);
      });
    }

    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.addEventListener("click", () => {
        this.toggleMinimize();
      });
    }

    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.addEventListener("click", () => {
        this.toggleAutoplay();
      });
    }

    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const spd = parseInt(chip.getAttribute("data-speed")) || 100;
        if (this.activeItem) {
          this.activeItem.animSpeed = spd;
          WorldObjectsManager.saveHistory();
        }
        speedChips.forEach(c => c.classList.toggle("active", c === chip));
        SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });
    });

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.panelEl && this.panelEl.style.display !== "none") {
        this.hide();
      }
    });
  },

  toggleMinimize() {
    if (!this.panelEl) return;
    const isMin = this.panelEl.classList.toggle("minimized");
    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.innerHTML = isMin ? '<i class="ph ph-caret-up"></i>' : '<i class="ph ph-caret-down"></i>';
    }
    SoundEngine.playChiptuneTone(isMin ? 440 : 580, "square", 0.05, 0.08);
  },

  toggleAutoplay() {
    if (!this.activeItem) return;
    this.activeItem.autoplay = !this.activeItem.autoplay;
    if (this.activeItem.autoplay && this.activeItem.poseData) {
      this.preparePoseAssetsForCanvas(this.activeItem, this.activeItem.poseData);
    }
    this.updateAutoplayUI();
    WorldObjectsManager.saveHistory();
    SoundEngine.playChiptuneTone(this.activeItem.autoplay ? 680 : 380, "square", 0.06, 0.1);
  },

  updateAutoplayUI() {
    const isAuto = this.activeItem ? !!this.activeItem.autoplay : false;
    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.classList.toggle("active", isAuto);
      const icon = this.btnAutoplayToggleEl.querySelector("i");
      if (icon) icon.className = `ph ${isAuto ? "ph-pause" : "ph-play"}`;
    }
    if (this.autoplayLabelEl) {
      this.autoplayLabelEl.textContent = isAuto ? "AUTOPLAY: ON" : "AUTOPLAY: OFF";
    }
    const currentSpd = this.activeItem ? (this.activeItem.animSpeed || 100) : 100;
    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      const chipSpd = parseInt(chip.getAttribute("data-speed")) || 100;
      chip.classList.toggle("active", chipSpd === currentSpd);
    });
  },

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

  preparePoseAssetsForCanvas(item, poseData) {
    if (!item || !poseData) return;
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
  },

  show(item) {
    if (!this.panelEl) return;
    if (!item) {
      this.hide();
      return;
    }

    // Retrieve pose dictionary if missing on canvas instance
    let poses = item.poses;
    let theme = item.theme || "";
    let name = item.name || "Sprite";

    if ((!poses || Object.keys(poses).length === 0) && typeof CreatePanelController !== "undefined" && CreatePanelController.assetsData) {
      const allCategories = (CreatePanelController.assetsData.sidefacing || []).concat(CreatePanelController.assetsData.topdown || []);
      for (const cat of allCategories) {
        const found = (cat.items || []).find(it => it.id === item.assetId || it.id === item.id);
        if (found && found.poses) {
          poses = found.poses;
          theme = found.theme || theme;
          name = found.name || name;
          item.poses = found.poses;
          item.theme = found.theme;
          item.type = "sprite";
          break;
        }
      }
    }

    if (!poses || Object.keys(poses).length === 0) {
      this.hide();
      return;
    }

    this.activeItem = item;
    // Default autoplay to false if undefined
    if (typeof item.autoplay === "undefined") {
      item.autoplay = false;
    }

    const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];
    const activePoseData = poses[currentPoseName] || poses[Object.keys(poses)[0]];
    if (activePoseData) {
      item.poseData = activePoseData;
      this.preparePoseAssetsForCanvas(item, activePoseData);
    }

    if (this.charNameEl) this.charNameEl.textContent = name.toUpperCase();
    if (this.themeBadgeEl) this.themeBadgeEl.textContent = (theme || "CHARACTER").toUpperCase();
    const poseKeys = Object.keys(poses);
    if (this.countEl) this.countEl.textContent = `${poseKeys.length} ${poseKeys.length === 1 ? "POSE" : "POSES"}`;

    this.updateAutoplayUI();
    this.renderPoseCards(item, poses);
    this.panelEl.style.display = "flex";
  },

  hide() {
    this.stopAllAnimators();
    if (this.panelEl) this.panelEl.style.display = "none";
    this.activeItem = null;
  },

  stopAllAnimators() {
    this.activeAnimators.forEach(stopFn => {
      try { stopFn(); } catch (e) {}
    });
    this.activeAnimators = [];
  },

  renderPoseCards(item, poses) {
    if (!this.gridEl) return;
    this.stopAllAnimators();
    this.gridEl.innerHTML = "";

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

      // Draw initial static frame 0
      const previewSrc = poseData.preview || (typeof poseData === "string" ? poseData : poseData.sheet || (poseData.frames && poseData.frames[0]));
      
      let staticImg = null;
      this.preloadImage(previewSrc).then(img => {
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

      // Hover Animation Controller
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
        if (frameCount <= 1) return;

        if (poseData.type === "frames" && Array.isArray(poseData.frames)) {
          // Sequence of individual frame images (e.g. Police)
          const loadedFrames = await Promise.all(poseData.frames.map(f => this.preloadImage(f)));
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
          }, 100); // 10 FPS
        } else {
          // Horizontal sprite sheet strip animation
          const sheetSrc = poseData.sheet || (typeof poseData === "string" ? poseData : null);
          if (!sheetSrc) return;
          const sheetImg = await this.preloadImage(sheetSrc);
          if (!isHovering || !sheetImg) return;

          const fw = poseData.frameWidth || poseData.frameHeight || 128;
          const fh = poseData.frameHeight || 128;

          animTimer = setInterval(() => {
            currentFrameIdx = (currentFrameIdx + 1) % frameCount;
            const sx = currentFrameIdx * fw;
            ctx.clearRect(0, 0, 128, 128);
            ctx.drawImage(sheetImg, sx, 0, fw, fh, 0, 0, 128, 128);
          }, 100); // 10 FPS
        }
      };

      card.addEventListener("mouseenter", () => {
        startAnimation();
      });

      card.addEventListener("mouseleave", () => {
        stopAnimation();
      });

      this.activeAnimators.push(stopAnimation);

      // Click to select pose
      card.addEventListener("click", () => {
        this.selectPose(item, poseName, poseData);
      });

      this.gridEl.appendChild(card);
    });
  },

  selectPose(item, poseName, poseData) {
    if (!item) return;

    item.currentPose = poseName;
    item.poseData = poseData;
    this.preparePoseAssetsForCanvas(item, poseData);

    // Update image src to the preview single frame of the chosen pose
    const newSrc = poseData.preview || (typeof poseData === "string" ? poseData : (poseData.frames && poseData.frames[0]) || poseData.sheet);
    if (newSrc) {
      item.src = newSrc;
      WorldObjectsManager.loadImageAsset(newSrc, (cacheEntry) => {
        if (cacheEntry.loaded && cacheEntry.img) {
          item.p5Img = cacheEntry.img;
          item.loaded = true;
          
          const oldNatH = item.naturalH || item.h || 70;
          const currentScale = (oldNatH > 0 && item.h > 0) ? (item.h / oldNatH) : 1.5;

          item.naturalW = cacheEntry.naturalW;
          item.naturalH = cacheEntry.naturalH;

          // Preserve exact character pixel scale and keep feet grounded at the bottom
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

    // Update active class on cards
    if (this.gridEl) {
      this.gridEl.querySelectorAll(".pose-card").forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-pose-name") === poseName);
      });
    }

    WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") {
      PropertiesController.updateFromSelected(item);
    }

    SoundEngine.playChiptuneTone(640, "square", 0.05, 0.1);
  }
};

// ============================================================================
// 7. WORLD OBJECTS & INTERACTIVE TRANSFORM GIZMO SYSTEM
// ============================================================================
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
const HistoryManager = {
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  updateUI() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");

    if (btnUndo) btnUndo.disabled = this.undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
  },

  pushState(state) {
    this.undoStack.push(state);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateUI();
  },

  undo() {
    if (this.undoStack.length === 0) return null;
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    this.updateUI();
    SoundEngine.playAction("undo");

    const prevState = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
    if (prevState && prevState.items) {
      WorldObjectsManager.deserialize(prevState.items);
    } else {
      WorldObjectsManager.deserialize([]);
    }
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }
    return currentState;
  },

  redo() {
    if (this.redoStack.length === 0) return null;
    const stateToRestore = this.redoStack.pop();
    this.undoStack.push(stateToRestore);
    this.updateUI();
    SoundEngine.playAction("redo");

    if (stateToRestore && stateToRestore.items) {
      WorldObjectsManager.deserialize(stateToRestore.items);
    }
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }
    return stateToRestore;
  },

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.updateUI();
  }
};

// ============================================================================
// 8. FULL-SCREEN CANVAS STAGE & RESIZING HELPERS
// ============================================================================
let mainCanvas;

function getStageDimensions() {
  if ((typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) || (typeof document !== "undefined" && document.body && document.body.classList.contains("mode-play"))) {
    return {
      w: window.innerWidth,
      h: window.innerHeight
    };
  }
  const container = document.getElementById("canvas-container");
  if (container) {
    return {
      w: container.clientWidth || 800,
      h: container.clientHeight || 600
    };
  }
  return { w: 800, h: 600 };
}

function resizeStageCanvas() {
  const dims = getStageDimensions();
  if (mainCanvas && (width !== dims.w || height !== dims.h)) {
    resizeCanvas(dims.w, dims.h);
    WorldConfig.clampPan();
  }
}

// ============================================================================
// 9. RESIZABLE SPLIT-PANE CONTROLLER
// ============================================================================
const SplitterController = {
  isDragging: false,
  minControlsWidth: 220,
  minStageWidth: 200,

  getActivePane() {
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      return document.getElementById("code-toolbox-pane");
    }
    return document.getElementById("controls-pane");
  },

  init() {
    const splitter = document.getElementById("pane-splitter");
    const controlsPane = document.getElementById("controls-pane");
    const workspaceContainer = document.getElementById("workspace-container");

    if (!splitter || !workspaceContainer) return;

    const savedCanvasWidth = localStorage.getItem("unifive_canvas_split_width") || localStorage.getItem("unifive_split_width");
    if (savedCanvasWidth && controlsPane) {
      controlsPane.style.width = savedCanvasWidth;
    }

    const startDrag = (e) => {
      this.isDragging = true;
      splitter.classList.add("dragging");
      document.body.classList.add("resizing");
      e.preventDefault();
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = workspaceContainer.getBoundingClientRect();
      let newWidth = clientX - rect.left;

      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      const minW = isCode ? 360 : this.minControlsWidth;
      const maxControlsWidth = rect.width - this.minStageWidth;
      newWidth = Math.max(minW, Math.min(maxControlsWidth, newWidth));

      const activePane = this.getActivePane();
      if (activePane) activePane.style.width = `${newWidth}px`;
      resizeStageCanvas();
    };

    const stopDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      splitter.classList.remove("dragging");
      document.body.classList.remove("resizing");
      const activePane = this.getActivePane();
      if (activePane) {
        const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
        const key = isCode ? "unifive_code_split_width" : "unifive_canvas_split_width";
        localStorage.setItem(key, activePane.style.width);
      }
      resizeStageCanvas();
    };

    // Mouse Events
    splitter.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);

    // Touch Events
    splitter.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("touchmove", doDrag, { passive: false });
    window.addEventListener("touchend", stopDrag);
  }
};

// ============================================================================
// 10. VARIABLE MANAGER (Variables Store, HUD Watchers & Creation Modal)
// ============================================================================
const VariableManager = {
  variables: [
    { id: "var_score", name: "score", scope: "global", targetId: null, value: 0, showWatcher: true }
  ],

  init() {
    this.initModalListeners();
  },

  getVariable(name, targetId = null) {
    if (!name) return null;
    const cleanName = String(name).toLowerCase().trim();
    // 1. Try local sprite variable first
    if (targetId) {
      const local = this.variables.find(v => v.name.toLowerCase() === cleanName && v.scope === "local" && v.targetId === targetId);
      if (local) return local;
    }
    // 2. Try global variable
    const global = this.variables.find(v => v.name.toLowerCase() === cleanName && v.scope === "global");
    if (global) return global;

    return this.variables.find(v => v.name.toLowerCase() === cleanName) || null;
  },

  setVariable(name, val, targetId = null) {
    let v = this.getVariable(name, targetId);
    if (!v) {
      v = this.createVariable(name, "global", val);
    }
    const num = Number(val);
    v.value = (!isNaN(num) && String(val).trim() !== "") ? num : val;
    return v.value;
  },

  changeVariable(name, delta, targetId = null) {
    let v = this.getVariable(name, targetId);
    if (!v) {
      v = this.createVariable(name, "global", 0);
    }
    const curNum = Number(v.value) || 0;
    const deltaNum = Number(delta) || 0;
    v.value = curNum + deltaNum;
    return v.value;
  },

  createVariable(name, scope = "global", initialVal = 0, targetId = null) {
    const trimmed = (name || "").trim();
    if (!trimmed) return null;

    const existing = this.variables.find(v => 
      v.name.toLowerCase() === trimmed.toLowerCase() && 
      (scope === "global" ? v.scope === "global" : (v.scope === "local" && v.targetId === targetId))
    );
    if (existing) return existing;

    const newVar = {
      id: "var_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      name: trimmed,
      scope: scope,
      targetId: scope === "local" ? targetId : null,
      value: initialVal,
      showWatcher: true
    };
    this.variables.push(newVar);

    if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
      AppModeController.selectCategory("variables");
    }
    return newVar;
  },

  deleteVariable(id) {
    const idx = this.variables.findIndex(v => v.id === id);
    if (idx >= 0) {
      this.variables.splice(idx, 1);
      if (typeof AppModeController !== "undefined" && AppModeController.activeCategory === "variables") {
        AppModeController.selectCategory("variables");
      }
    }
  },

  toggleWatcher(idOrName, forceState = null) {
    const v = this.variables.find(item => item.id === idOrName || item.name.toLowerCase() === String(idOrName).toLowerCase());
    if (v) {
      v.showWatcher = forceState !== null ? forceState : !v.showWatcher;
    }
  },

  drawWatchers() {
    const visibleVars = this.variables.filter(v => v.showWatcher);
    if (visibleVars.length === 0) return;

    push();
    resetMatrix();
    textSize(10);
    textAlign(LEFT, CENTER);
    let offsetY = 12;

    visibleVars.forEach(v => {
      const scopeTag = v.scope === "local" ? " [SPRITE]" : "";
      const label = `${v.name.toUpperCase()}${scopeTag}: ${v.value}`;
      const badgeW = textWidth(label) + 26;
      const badgeH = 22;

      // Badge pill background
      fill(26, 4, 11, 235);
      stroke(249, 115, 22);
      strokeWeight(1.5);
      rect(12, offsetY, badgeW, badgeH, 4);

      // Orange diamond bullet
      noStroke();
      fill(249, 115, 22);
      rect(19, offsetY + badgeH / 2 - 3, 6, 6);

      // Text
      fill(255, 235, 210);
      text(label, 30, offsetY + badgeH / 2);

      offsetY += badgeH + 6;
    });
    pop();
  },

  initModalListeners() {
    const modal = document.getElementById("modal-make-variable");
    const inputName = document.getElementById("input-new-var-name");
    const btnClose = document.getElementById("btn-close-var-modal");
    const btnCancel = document.getElementById("btn-cancel-var-modal");
    const btnCreate = document.getElementById("btn-create-var-modal");

    const openModal = () => {
      if (modal) modal.style.display = "flex";
      if (inputName) {
        inputName.value = "";
        setTimeout(() => inputName.focus(), 50);
      }
      SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
    };

    const closeModal = () => {
      if (modal) modal.style.display = "none";
    };

    const submitCreate = () => {
      const name = inputName ? inputName.value.trim() : "";
      if (!name) return;
      const scopeRadio = document.querySelector('input[name="var-scope"]:checked');
      const scope = scopeRadio ? scopeRadio.value : "global";
      const targetId = scope === "local" ? AppModeController.getActiveTargetId() : null;

      this.createVariable(name, scope, 0, targetId);
      closeModal();
      SoundEngine.playChiptuneTone(880, "square", 0.06, 0.12);
    };

    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);
    if (btnCreate) btnCreate.addEventListener("click", submitCreate);
    if (inputName) {
      inputName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitCreate();
        if (e.key === "Escape") closeModal();
      });
    }

    this.openModal = openModal;
    this.closeModal = closeModal;
  }
};

// ============================================================================
// 11. APP MODE CONTROLLER (Canvas Mode vs Visual Code Mode)
// ============================================================================
const AppModeController = {
  currentMode: "canvas", // "canvas" | "code"
  panX: 40,
  panY: 40,
  zoom: 1.0,
  isPanning: false,
  panStartX: 0,
  panStartY: 0,
  draggedPlacedBlock: null,
  activeCategory: "events",

  // Per-object script storage: { [targetId]: [ { id, blockId, name, hat, color, icon, x, y } ] }
  objectScripts: {},

  categories: {
    events: [
      { id: "when_flag", name: "when 🚩 clicked", hat: true, scope: "global", color: "#f59e0b", icon: "ph-flag" },
      { id: "when_key", name: "when [space] key pressed", hat: true, scope: "global", color: "#f59e0b", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "when_clicked", name: "when this sprite clicked", hat: true, scope: "object", color: "#f59e0b", icon: "ph-cursor-click" },
      { id: "when_became_playable", name: "when became playable", hat: true, scope: "sprite", color: "#f59e0b", icon: "ph-crown" },
      { id: "broadcast", name: "broadcast [message1]", scope: "global", color: "#f59e0b", icon: "ph-broadcast" },
      { id: "when_receive", name: "when I receive [message1]", hat: true, scope: "global", color: "#f59e0b", icon: "ph-bell-ringing" }
    ],
    motion: [
      { id: "move_x_steps", name: "move (10) steps x", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" },
      { id: "move_y_steps", name: "move (10) steps y", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-down-up" },
      { id: "turn_right", name: "turn ↻ (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-clockwise" },
      { id: "turn_left", name: "turn ↺ (15) degrees", scope: "object", color: "#3b82f6", icon: "ph-arrow-counter-clockwise" },
      { id: "goto_xy", name: "go to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-crosshair" },
      { id: "glide_xy", name: "glide (1) secs to x: (0) y: (0)", scope: "object", color: "#3b82f6", icon: "ph-paper-plane-tilt" },
      { id: "point_dir", name: "point in direction (90)", scope: "sprite", color: "#3b82f6", icon: "ph-compass" },
      { id: "bounce_edge", name: "if on edge, bounce", scope: "sprite", color: "#3b82f6", icon: "ph-arrows-left-right" }
    ],
    looks: [
      { id: "say_text", name: 'say ["Hello!"] for (2) secs', scope: "sprite", color: "#a855f7", icon: "ph-chat-circle-dots" },
      { id: "switch_costume", name: "switch pose to [Attack]", scope: "sprite", color: "#a855f7", icon: "ph-person-simple-walk" },
      { id: "next_costume", name: "next pose", scope: "sprite", color: "#a855f7", icon: "ph-arrow-fat-right" },
      { id: "change_size", name: "change size by (10)%", scope: "object", color: "#a855f7", icon: "ph-arrows-out-simple" },
      { id: "set_size", name: "set size to (100)%", scope: "object", color: "#a855f7", icon: "ph-frame-corners" },
      { id: "move_layer_front", name: "move (1) layer front", scope: "object", color: "#a855f7", icon: "ph-stack-overflow" },
      { id: "move_layer_back", name: "move (1) layer back", scope: "object", color: "#a855f7", icon: "ph-stack-simple" },
      { id: "go_to_layer", name: "go to [front] layer", scope: "object", color: "#a855f7", icon: "ph-layers-intersect", options: ["front", "back"] },
      { id: "show", name: "show", scope: "object", color: "#a855f7", icon: "ph-eye" },
      { id: "hide", name: "hide", scope: "object", color: "#a855f7", icon: "ph-eye-slash" }
    ],
    sound: [
      { id: "play_sound", name: "play sound [jump] until done", scope: "global", color: "#ec4899", icon: "ph-speaker-high", options: ["jump", "laser", "coin", "hit", "powerup"] },
      { id: "start_sound", name: "start sound [laser]", scope: "global", color: "#ec4899", icon: "ph-play", options: ["jump", "laser", "coin", "hit", "powerup"] },
      { id: "stop_all_sounds", name: "stop all sounds", scope: "global", color: "#ec4899", icon: "ph-stop" },
      { id: "change_volume", name: "change volume by (-10)", scope: "global", color: "#ec4899", icon: "ph-speaker-low" }
    ],
    control: [
      { id: "wait_secs", name: "wait (1) seconds", scope: "global", color: "#10b981", icon: "ph-timer" },
      { id: "repeat", name: "repeat (10) times", c_block: true, scope: "global", color: "#10b981", icon: "ph-repeat" },
      { id: "forever", name: "forever", c_block: true, scope: "global", color: "#10b981", icon: "ph-infinity" },
      { id: "if_then", name: "if <[touching edge]> then", c_block: true, scope: "global", color: "#10b981", icon: "ph-git-fork", isConditionBlock: true },
      { id: "if_else", name: "if <[touching edge]> then", e_block: true, scope: "global", color: "#10b981", icon: "ph-git-branch", isConditionBlock: true },
      { id: "set_playable_char", name: "set playable character to [this sprite]", scope: "sprite", color: "#10b981", icon: "ph-user-focus", isPlayableCharSelector: true },
      { id: "set_player_control", name: "set player control to [enabled]", scope: "global", color: "#10b981", icon: "ph-game-controller", options: ["enabled", "disabled"] },
      { id: "stop_all", name: "stop [all scripts]", cap: true, scope: "global", color: "#10b981", icon: "ph-stop-circle" }
    ],
    sensing: [
      { id: "touching_object", name: "touching [edge]?", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-intersect", isTouchingSelector: true },
      { id: "touching_solid", name: "touching solid object?", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-shield-check" },
      { id: "distance_to_object", name: "distance to [hero] < (50)", isBoolean: true, scope: "object", color: "#0284c7", icon: "ph-ruler", isDistanceSelector: true },
      { id: "key_pressed_check", name: "key [space] pressed?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-keyboard", options: ["space", "up arrow", "down arrow", "left arrow", "right arrow", "any"] },
      { id: "mouse_down_check", name: "mouse down?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-cursor-click" },
      { id: "is_mobile_sensing", name: "is mobile device?", isBoolean: true, scope: "global", color: "#0284c7", icon: "ph-device-mobile" },
      { id: "is_playable_sensing", name: "is playable hero?", isBoolean: true, scope: "sprite", color: "#0284c7", icon: "ph-game-controller" }
    ],
    operators: [
      { id: "op_add", name: "( ) + ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-plus", opType: "+" },
      { id: "op_subtract", name: "( ) - ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-minus", opType: "-" },
      { id: "op_multiply", name: "( ) * ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-x", opType: "*" },
      { id: "op_divide", name: "( ) / ( )", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-divide", opType: "/" },
      { id: "op_random", name: "pick random (1) to (10)", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-shuffle", isRandom: true },
      { id: "op_gt", name: "<( ) > (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-right", opType: ">" },
      { id: "op_lt", name: "<( ) < (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-caret-left", opType: "<" },
      { id: "op_eq", name: "<( ) = (50)>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-equals", opType: "=" },
      { id: "op_and", name: "<<> and <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-intersect", opType: "and" },
      { id: "op_or", name: "<<> or <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-circles-three", opType: "or" },
      { id: "op_not", name: "<not <>>", isBoolean: true, isLogical: true, scope: "universal", color: "#22c55e", icon: "ph-prohibit", opType: "not" },
      { id: "op_join", name: "join [apple] [banana]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-link" },
      { id: "op_letter_of", name: "letter (1) of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-text-aa" },
      { id: "op_length_of", name: "length of [apple]", isReporter: true, scope: "universal", color: "#22c55e", icon: "ph-ruler" },
      { id: "op_contains", name: "<[apple] contains [a]?>", isBoolean: true, scope: "universal", color: "#22c55e", icon: "ph-magnifying-glass", opType: "contains" }
    ],
    variables: [
      { id: "set_var", name: "set [score] to (0)", scope: "global", color: "#f97316", icon: "ph-textbox", isVarSetter: true },
      { id: "change_var", name: "change [score] by (1)", scope: "global", color: "#f97316", icon: "ph-plus-circle", isVarChanger: true },
      { id: "show_var", name: "show variable [score]", scope: "global", color: "#f97316", icon: "ph-eye", isVarSelector: true },
      { id: "hide_var", name: "hide variable [score]", scope: "global", color: "#f97316", icon: "ph-eye-slash", isVarSelector: true }
    ]
  },

  getActiveTargetId() {
    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    return sel ? sel.id : "global_stage";
  },

  getActiveTargetInfo() {
    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!sel) {
      return { id: "global_stage", name: "Stage (Global)", type: "stage", isStage: true, isSprite: false, isProp: false };
    }
    const isSprite = sel.type === "sprite" || (sel.assetId && sel.assetId.startsWith("sprite_")) || (sel.poses && Object.keys(sel.poses).length > 0) || !!sel.isCharacter || !!sel.isPlayable;
    return {
      id: sel.id,
      name: sel.name || "Object",
      type: isSprite ? "sprite" : (sel.type || "prop"),
      isStage: false,
      isSprite: isSprite,
      isProp: !isSprite
    };
  },

  isBlockAvailableForTarget(block, targetInfo) {
    if (!targetInfo) targetInfo = this.getActiveTargetInfo();
    const scope = block.scope || "global";
    if (scope === "universal" || scope === "global") {
      return true;
    }
    if (targetInfo.isStage) {
      return scope === "global" || scope === "universal";
    }
    if (targetInfo.isProp) {
      return scope === "global" || scope === "universal" || scope === "object";
    }
    if (targetInfo.isSprite) {
      return true;
    }
    return true;
  },

  getCurrentScripts() {
    const targetId = this.getActiveTargetId();
    if (!this.objectScripts[targetId]) {
      this.objectScripts[targetId] = [];
    }
    return this.objectScripts[targetId];
  },

  getBlockElement(blockId) {
    if (!blockId) return null;
    const workspace = document.getElementById("code-workspace-blocks");
    if (workspace) {
      const el = workspace.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
      if (el) return el;
    }
    return document.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
  },

  getBranchHeight(startBlockId, map) {
    if (!startBlockId || !map.has(startBlockId)) return 24;
    let totalH = 0;
    let currId = startBlockId;
    const visited = new Set();
    while (currId && map.has(currId) && !visited.has(currId)) {
      visited.add(currId);
      const b = map.get(currId);
      const bH = this.getFullBlockHeight(b, map);
      totalH += (totalH === 0 ? bH : (bH - 2));
      currId = b.nextId;
    }
    return Math.max(24, totalH);
  },

  getFullBlockHeight(block, map) {
    if (!block) return 34;
    if (block.c_block) {
      const headerH = 34;
      const bodyH = this.getBranchHeight(block.childId, map || new Map());
      const footerH = 14;
      return headerH + bodyH + footerH - 4;
    }
    if (block.e_block) {
      const headerH = 34;
      const ifBodyH = this.getBranchHeight(block.childId_if, map || new Map());
      const dividerH = 26;
      const elseBodyH = this.getBranchHeight(block.childId_else, map || new Map());
      const footerH = 14;
      return headerH + ifBodyH + dividerH + elseBodyH + footerH - 6;
    }
    if (block.hat) return 38;
    return 34;
  },

  getBlockDimensions(block) {
    if (!block) return { w: 140, h: 34 };
    const scripts = this.getCurrentScripts();
    const map = new Map(scripts.map(b => [b.id, b]));
    const h = this.getFullBlockHeight(block, map);
    const el = block.id ? this.getBlockElement(block.id) : null;
    if (el && el.offsetWidth > 0) {
      return { w: el.offsetWidth, h: h };
    }
    const len = (block.name || "").length;
    const estW = Math.max(140, Math.min(270, len * 9 + 40));
    return { w: estW, h: h };
  },

  // Returns all blocks in the connected downstream stack starting from rootBlock
  getConnectedStack(rootBlock) {
    const scripts = this.getCurrentScripts();
    const map = new Map(scripts.map(b => [b.id, b]));
    const stack = [];
    const visited = new Set();

    const collect = (node) => {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);
      stack.push(node);

      // Collect inside C-block body
      if (node.c_block && node.childId && map.has(node.childId)) {
        collect(map.get(node.childId));
      }

      // Collect inside E-block branches
      if (node.e_block) {
        if (node.childId_if && map.has(node.childId_if)) {
          collect(map.get(node.childId_if));
        }
        if (node.childId_else && map.has(node.childId_else)) {
          collect(map.get(node.childId_else));
        }
      }

      // Collect downstream connected next block
      if (node.nextId && map.has(node.nextId)) {
        collect(map.get(node.nextId));
      }
    };

    collect(rootBlock);
    return stack;
  },

  // Find nearest magnetic snap target near (draggedX, draggedY)
  findSnapTarget(draggedBlock, draggedX, draggedY, excludeIds = new Set(), ignoreTargetId = null) {
    const scripts = this.getCurrentScripts();
    if (!scripts || scripts.length === 0) return null;

    const map = new Map(scripts.map(b => [b.id, b]));
    const draggedDims = this.getBlockDimensions(draggedBlock);
    let bestTarget = null;
    let minDistance = 999999;

    const snapThresholdX = 65;
    const snapThresholdY = 32;

    for (let i = 0; i < scripts.length; i++) {
      const target = scripts[i];
      if (excludeIds.has(target.id)) continue;
      if (draggedBlock.id && target.id === draggedBlock.id) continue;

      const fullTargetH = this.getFullBlockHeight(target, map);

      // If we just detached from this target, ignore snapping back to it while pulling away
      if (ignoreTargetId && target.id === ignoreTargetId) {
        if (Math.hypot(draggedX - target.x, draggedY - target.y) < 55) {
          continue;
        }
      }

      // 1. SNAP INSIDE C-BLOCK MOUTH (Takes priority when dragged over mouth area)
      if (target.c_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
        if (!target.childId && draggedY < target.y + fullTargetH - 14) {
          const snapX = target.x + 16;
          const snapY = target.y + 32;

          const dx = Math.abs(draggedX - snapX);
          const dy = Math.abs(draggedY - snapY);

          if (dx <= 80 && dy <= 45) {
            const dist = dx + dy;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside",
                snapX: snapX,
                snapY: snapY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 2. SNAP INSIDE DUAL-MOUTH E-BLOCK (IF vs ELSE MOUTHS)
      if (target.e_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
        const ifBodyH = this.getBranchHeight(target.childId_if, map);
        
        // Top If-branch mouth
        if (!target.childId_if && draggedY < target.y + 30 + ifBodyH) {
          const snapIfX = target.x + 16;
          const snapIfY = target.y + 32;
          const dxIf = Math.abs(draggedX - snapIfX);
          const dyIf = Math.abs(draggedY - snapIfY);

          if (dxIf <= 80 && dyIf <= 45) {
            const dist = dxIf + dyIf;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside_if",
                snapX: snapIfX,
                snapY: snapIfY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }

        // Bottom Else-branch mouth
        if (!target.childId_else && draggedY >= target.y + 30 + ifBodyH && draggedY < target.y + fullTargetH - 14) {
          const snapElseX = target.x + 16;
          const snapElseY = target.y + 54 + ifBodyH;
          const dxElse = Math.abs(draggedX - snapElseX);
          const dyElse = Math.abs(draggedY - snapElseY);

          if (dxElse <= 80 && dyElse <= 45) {
            const dist = dxElse + dyElse;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "inside_else",
                snapX: snapElseX,
                snapY: snapElseY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 3. SNAP UNDERNEATH TARGET BLOCK (At bottom of regular block or bottom footer of C/E-block)
      if (!target.cap && !draggedBlock.hat && !draggedBlock.isBoolean) {
        // For C-block or E-block, bottom snap is only active near the actual footer bar
        const isMouthContainer = target.c_block || target.e_block;
        const isNearFooterOrRegular = !isMouthContainer || (draggedY >= target.y + fullTargetH - 26);

        if (isNearFooterOrRegular) {
          const snapX = target.x;
          const snapY = target.y + fullTargetH - 2;

          const dx = Math.abs(draggedX - snapX);
          const dy = Math.abs(draggedY - snapY);

          if (dx <= snapThresholdX && dy <= snapThresholdY) {
            const dist = dx + dy;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "bottom",
                snapX: snapX,
                snapY: snapY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }
      }

      // 4. SNAP ABOVE TARGET BLOCK
      if (!target.hat && !draggedBlock.cap && !draggedBlock.isBoolean) {
        const snapX = target.x;
        const snapY = target.y - draggedDims.h + 2;

        const dx = Math.abs(draggedX - snapX);
        const dy = Math.abs(draggedY - snapY);

        if (dx <= snapThresholdX && dy <= snapThresholdY) {
          const dist = dx + dy;
          if (dist < minDistance) {
            minDistance = dist;
            bestTarget = {
              target: target,
              position: "top",
              snapX: snapX,
              snapY: snapY,
              snapW: draggedDims.w,
              snapH: draggedDims.h
            };
          }
        }
      }

      // 5. SNAP INTO CONDITION SOCKET (For if_then, if_else, logical blocks when dragging boolean blocks)
      const isDraggedBool = !!(draggedBlock.isBoolean || draggedBlock.boolean || draggedBlock.color === "#0284c7" || (draggedBlock.id && draggedBlock.id.startsWith("op_") && (draggedBlock.isBoolean || draggedBlock.opType)));
      if (isDraggedBool) {
        if (target.isConditionBlock || target.c_block || target.e_block) {
          const snapCondX = target.x + 36;
          const snapCondY = target.y + 2;
          const dxCond = Math.abs(draggedX - snapCondX);
          const dyCond = Math.abs(draggedY - snapCondY);

          if (dxCond <= 75 && dyCond <= 32) {
            const dist = dxCond + dyCond;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "condition",
                snapX: snapCondX,
                snapY: snapCondY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        } else if (target.isLogical) {
          if (target.opType === "not") {
            const snapCondX = target.x + 38;
            const snapCondY = target.y + 2;
            const dxCond = Math.abs(draggedX - snapCondX);
            const dyCond = Math.abs(draggedY - snapCondY);

            if (dxCond <= 60 && dyCond <= 32) {
              const dist = dxCond + dyCond;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "condition",
                  snapX: snapCondX,
                  snapY: snapCondY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          } else {
            // Left condition socket
            const snapLeftX = target.x + 10;
            const snapLeftY = target.y + 2;
            const dxLeft = Math.abs(draggedX - snapLeftX);
            const dyLeft = Math.abs(draggedY - snapLeftY);

            if (dxLeft <= 45 && dyLeft <= 32) {
              const dist = dxLeft + dyLeft;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "left_condition",
                  snapX: snapLeftX,
                  snapY: snapLeftY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }

            // Right condition socket
            const snapRightX = target.x + 65;
            const snapRightY = target.y + 2;
            const dxRight = Math.abs(draggedX - snapRightX);
            const dyRight = Math.abs(draggedY - snapRightY);

            if (dxRight <= 45 && dyRight <= 32) {
              const dist = dxRight + dyRight;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "right_condition",
                  snapX: snapRightX,
                  snapY: snapRightY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }
        }
      }
    }

    return bestTarget;
  },

  showSnapIndicator(snapTarget) {
    let indicator = document.getElementById("code-snap-ghost-indicator");
    const workspace = document.getElementById("code-workspace-blocks");

    document.querySelectorAll(".snap-target-highlight").forEach(el => {
      el.classList.remove("snap-target-highlight");
    });

    if (!snapTarget) {
      if (indicator) indicator.style.display = "none";
      return;
    }

    if (!indicator && workspace) {
      indicator = document.createElement("div");
      indicator.id = "code-snap-ghost-indicator";
      indicator.className = "code-snap-ghost-indicator";
      workspace.appendChild(indicator);
    }

    if (indicator) {
      indicator.style.left = `${snapTarget.snapX}px`;
      indicator.style.top = `${snapTarget.snapY}px`;
      const isInside = snapTarget.position === "inside" || snapTarget.position === "inside_if" || snapTarget.position === "inside_else";
      indicator.style.width = isInside ? `${Math.max(110, snapTarget.snapW - 20)}px` : `${Math.max(100, snapTarget.snapW)}px`;
      indicator.style.height = isInside ? `26px` : `${Math.max(30, snapTarget.snapH)}px`;
      indicator.style.display = "block";
    }

    if (snapTarget.target && snapTarget.target.id) {
      const targetEl = this.getBlockElement(snapTarget.target.id);
      if (targetEl) {
        if (snapTarget.position === "condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot[data-slot="condition"], .code-condition-slot:not([data-slot])');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else if (snapTarget.position === "left_condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot.left-slot, .code-condition-slot[data-slot="left"]');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else if (snapTarget.position === "right_condition") {
          const slotEl = targetEl.querySelector('.code-condition-slot.right-slot, .code-condition-slot[data-slot="right"]');
          if (slotEl) slotEl.classList.add("snap-target-highlight");
        } else {
          targetEl.classList.add("snap-target-highlight");
        }
      }
    }
  },

  createBlockElement(block, isWorkspace = false) {
    const blockEl = document.createElement("div");
    let blockTypeClass = "stack-block";
    if (block.hat) blockTypeClass = "hat-block";
    else if (block.cap) blockTypeClass = "cap-block";
    else if (block.c_block) blockTypeClass = "c-block";
    else if (block.e_block) blockTypeClass = "e-block";
    else if (block.isReporter || block.reporter) blockTypeClass = "reporter-block";
    else if (block.isBoolean || block.boolean || (block.id && block.id.startsWith("op_") && (block.isBoolean || block.opType === ">" || block.opType === "<" || block.opType === "=" || block.opType === "contains" || block.isLogical))) blockTypeClass = "boolean-block";

    blockEl.className = `code-block-item ${blockTypeClass}`;
    blockEl.style.setProperty("--block-bg", block.color || "#22c55e");
    if (block.id) {
      blockEl.setAttribute("data-block-id", block.id);
    }

    // Dynamic variable dropdown options
    let varOptionsHtml = "";
    if (typeof VariableManager !== "undefined" && VariableManager.variables) {
      varOptionsHtml = VariableManager.variables.map(v => `<option value="${v.name}">${v.name}</option>`).join("");
    }
    if (!varOptionsHtml) varOptionsHtml = '<option value="score">score</option>';

    // Dynamic objects placed on canvas
    const activeTargetId = this.getActiveTargetId();
    const placedObjectNames = [];
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      WorldObjectsManager.items.forEach(it => {
        if (it.id !== activeTargetId && it.name) {
          placedObjectNames.push(it.name);
        }
      });
    }

    let formattedHtml = block.name;

    if (block.isLogical) {
      if (block.opType === "and" || block.opType === "or") {
        formattedHtml = `
          <span class="code-condition-slot logical-slot left-slot" data-slot="left"></span>
          <span class="logical-op-text">${block.opType}</span>
          <span class="code-condition-slot logical-slot right-slot" data-slot="right"></span>
        `;
      } else if (block.opType === "not") {
        formattedHtml = `
          <span class="logical-op-text">not</span>
          <span class="code-condition-slot logical-slot" data-slot="condition"></span>
        `;
      }
    } else if (block.isVarSetter || block.isVarChanger || block.isVarSelector) {
      formattedHtml = block.name
        .replace(/\[score\]/g, `<select class="code-block-select">${varOptionsHtml}</select>`)
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${varOptionsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isTouchingSelector) {
      const touchingOpts = ["edge", "solid", "hero", "mouse-pointer", "any object", ...placedObjectNames];
      const optsHtml = touchingOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isDistanceSelector) {
      const distOpts = ["hero", "mouse-pointer", "nearest solid", ...placedObjectNames];
      const optsHtml = distOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isPlayableCharSelector) {
      const charOpts = ["this sprite", "None", ...placedObjectNames];
      const optsHtml = charOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else if (block.isConditionBlock) {
      if (block.conditionBlock) {
        formattedHtml = block.name.replace(/<\s*\[?(.*?)\]?\s*>/g, `<span class="code-condition-slot has-nested-block" data-slot="condition"></span>`);
      } else {
        const condOpts = [
          "touching edge",
          "touching solid",
          "touching hero",
          "touching mouse-pointer",
          "touching any object",
          ...placedObjectNames.map(n => `touching ${n}`),
          "distance to hero < 50",
          "key space pressed",
          "key up arrow pressed",
          "key down arrow pressed",
          "key left arrow pressed",
          "key right arrow pressed",
          "mouse down",
          "is mobile",
          "is playable",
          "score > 5",
          "health < 20"
        ];
        const optsHtml = condOpts.map(opt => `<option value="${opt}">${opt}</option>`).join("");
        formattedHtml = block.name
          .replace(/<\s*\[?(.*?)\]?\s*>/g, `<span class="code-condition-slot" data-slot="condition"><select class="code-block-select">${optsHtml}</select></span>`)
          .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
      }
    } else if (block.options) {
      const optsHtml = block.options.map(opt => `<option value="${opt}">${opt}</option>`).join("");
      formattedHtml = block.name
        .replace(/\[(.*?)\]/g, `<select class="code-block-select">${optsHtml}</select>`)
        .replace(/\((\d*)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    } else {
      formattedHtml = block.name
        .replace(/^<\s*/, '')
        .replace(/\s*>$/, '')
        .replace(/\((.*?)\)/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>')
        .replace(/\[(.*?)\]/g, '<span class="code-block-input" contenteditable="true" spellcheck="false">$1</span>');
    }

    if (block.e_block) {
      blockEl.innerHTML = `
        <div class="e-block-header">
          <i class="ph ${block.icon || 'ph-git-branch'}"></i>
          <span>${formattedHtml}</span>
          ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
        </div>
        <div class="e-block-body e-block-body-if"></div>
        <div class="e-block-divider">
          <span>else</span>
        </div>
        <div class="e-block-body e-block-body-else"></div>
        <div class="e-block-footer"></div>
      `;
    } else if (block.c_block) {
      blockEl.innerHTML = `
        <div class="c-block-header">
          <i class="ph ${block.icon || 'ph-code'}"></i>
          <span>${formattedHtml}</span>
          ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
        </div>
        <div class="c-block-body"></div>
        <div class="c-block-footer"></div>
      `;
    } else {
      blockEl.innerHTML = `
        <i class="ph ${block.icon || 'ph-code'}"></i>
        <span>${formattedHtml}</span>
        ${isWorkspace ? '<button class="code-block-delete-btn" title="Delete Block">✕</button>' : ''}
      `;
    }

    // Attach condition block (single)
    if (block.conditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="condition"], .code-condition-slot:not([data-slot])');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.conditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          // Drag nested condition block OUT of socket
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.conditionBlock));
            delete block.conditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Condition Block";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.conditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Attach left condition block (for op_and, op_or)
    if (block.leftConditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="left"]');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.leftConditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.leftConditionBlock));
            delete block.leftConditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Left Condition";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.leftConditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Attach right condition block (for op_and, op_or)
    if (block.rightConditionBlock) {
      const slotEl = blockEl.querySelector('.code-condition-slot[data-slot="right"]');
      if (slotEl) {
        slotEl.innerHTML = "";
        const condData = { ...block.rightConditionBlock, isBoolean: true };
        const nestedEl = this.createBlockElement(condData, false);
        nestedEl.classList.add("nested-condition-block", "boolean-block");
        nestedEl.classList.remove("stack-block");
        nestedEl.querySelectorAll(".code-block-delete-btn").forEach(b => b.remove());

        if (isWorkspace) {
          nestedEl.addEventListener("mousedown", (e) => {
            if (e.target.closest(".nested-block-eject-btn")) return;
            e.stopPropagation();
            e.preventDefault();

            const condToExtract = JSON.parse(JSON.stringify(block.rightConditionBlock));
            delete block.rightConditionBlock;

            const dropZone = document.getElementById("code-drop-zone");
            const rect = dropZone ? dropZone.getBoundingClientRect() : { left: 0, top: 0 };
            const worldX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);

            condToExtract.id = condToExtract.id || ("block_" + Date.now() + "_" + Math.floor(Math.random() * 10000));
            condToExtract.x = worldX - 20;
            condToExtract.y = worldY - 10;
            condToExtract.nextId = null;
            condToExtract.prevId = null;
            condToExtract.isBoolean = true;

            const scripts = this.getCurrentScripts();
            scripts.push(condToExtract);
            this.renderScriptsForActiveTarget();

            const extractedEl = this.getBlockElement(condToExtract.id);
            if (extractedEl) {
              extractedEl.classList.add("dragging");
              this.draggedPlacedBlock = {
                block: condToExtract,
                elt: extractedEl,
                stack: [condToExtract],
                stackItems: [{
                  block: condToExtract,
                  elt: extractedEl,
                  initialX: condToExtract.x,
                  initialY: condToExtract.y
                }],
                stackIds: new Set([condToExtract.id]),
                mouseStartX: e.clientX,
                mouseStartY: e.clientY,
                initialX: condToExtract.x,
                initialY: condToExtract.y,
                detachedFromId: block.id
              };
            }
            SoundEngine.playChiptuneTone(740, "triangle", 0.04, 0.1);
          });

          const ejectBtn = document.createElement("button");
          ejectBtn.className = "nested-block-eject-btn";
          ejectBtn.innerHTML = "✕";
          ejectBtn.title = "Remove Right Condition";
          ejectBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            delete block.rightConditionBlock;
            this.renderScriptsForActiveTarget();
            SoundEngine.playAction("delete");
          });
          nestedEl.appendChild(ejectBtn);
        }
        slotEl.appendChild(nestedEl);
      }
    }

    // Set saved input values if available
    if (isWorkspace && block.inputs && Array.isArray(block.inputs)) {
      setTimeout(() => {
        const inputEls = blockEl.querySelectorAll(".code-block-input, .code-block-select");
        inputEls.forEach((inp, idx) => {
          if (block.inputs[idx] !== undefined) {
            if (inp.tagName === "SELECT") {
              inp.value = block.inputs[idx];
            } else {
              inp.textContent = block.inputs[idx];
            }
          }
        });
      }, 0);
    }

    // Save inputs on change
    blockEl.querySelectorAll(".code-block-input, .code-block-select").forEach((inp, idx) => {
      const save = () => {
        if (!block.inputs) block.inputs = [];
        block.inputs[idx] = inp.value || inp.textContent.trim();
      };
      inp.addEventListener("input", save);
      inp.addEventListener("change", save);
    });

    return blockEl;
  },

  init() {
    // 1. Header mode buttons
    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");

    if (btnCanvas) {
      btnCanvas.addEventListener("click", () => this.setMode("canvas"));
    }
    if (btnCode) {
      btnCode.addEventListener("click", () => this.setMode("code"));
    }

    // 2. Code Toolbox category buttons
    const catButtons = document.querySelectorAll(".code-cat-btn");
    catButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-category");
        this.selectCategory(cat);
      });
    });

    // 3. Infinite Canvas Pan & Drop Interactions
    const dropZone = document.getElementById("code-drop-zone");
    if (dropZone) {
      dropZone.addEventListener("mousedown", (e) => {
        if (e.target.closest(".code-block-item") || e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) {
          return;
        }
        this.isPanning = true;
        this.panStartX = e.clientX - this.panX;
        this.panStartY = e.clientY - this.panY;
        dropZone.classList.add("panning");
      });

      dropZone.addEventListener("wheel", (e) => {
        e.preventDefault();
        const rect = dropZone.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.12 : 0.89;
        const newZoom = Math.min(2.5, Math.max(0.35, this.zoom * factor));

        this.panX = mx - (mx - this.panX) * (newZoom / this.zoom);
        this.panY = my - (my - this.panY) * (newZoom / this.zoom);
        this.zoom = newZoom;
        this.updateWorkspaceTransform();
      }, { passive: false });

      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (raw) {
            const blockTemplate = JSON.parse(raw);
            const isBool = !!(blockTemplate.isBoolean || blockTemplate.boolean || blockTemplate.color === "#0284c7" || (blockTemplate.id && blockTemplate.id.startsWith("op_") && (blockTemplate.isBoolean || blockTemplate.opType)));
            const hitEl = document.elementFromPoint(e.clientX, e.clientY);
            const condSlot = hitEl ? hitEl.closest(".code-condition-slot") : null;
            const parentBlockEl = hitEl ? (condSlot ? condSlot.closest(".code-block-item") : hitEl.closest(".c-block, .e-block, .boolean-block, .code-block-item")) : null;

            if (isBool && parentBlockEl) {
              const parentId = parentBlockEl.getAttribute("data-block-id");
              const scripts = this.getCurrentScripts();
              const parentBlock = scripts.find(b => b.id === parentId);
              if (parentBlock) {
                const condData = {
                  ...blockTemplate,
                  id: "cond_" + Date.now() + "_" + Math.floor(Math.random() * 1000)
                };
                if (condSlot && condSlot.getAttribute("data-slot") === "left") {
                  parentBlock.leftConditionBlock = condData;
                } else if (condSlot && condSlot.getAttribute("data-slot") === "right") {
                  parentBlock.rightConditionBlock = condData;
                } else {
                  parentBlock.conditionBlock = condData;
                }
                SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
                setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
                this.renderScriptsForActiveTarget();
                return;
              }
            }

            const rect = dropZone.getBoundingClientRect();
            const worldCursorX = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
            const worldCursorY = Math.round((e.clientY - rect.top - this.panY) / this.zoom);
            const bDims = this.getBlockDimensions(blockTemplate);
            const worldTopLeftX = worldCursorX - Math.round(bDims.w / 2);
            const worldTopLeftY = worldCursorY - Math.round(bDims.h / 2);

            let snap = this.findSnapTarget(blockTemplate, worldTopLeftX, worldTopLeftY, new Set());
            if (!snap) snap = this.findSnapTarget(blockTemplate, worldCursorX, worldCursorY, new Set());

            this.addBlockToWorkspace(blockTemplate, snap ? snap.snapX : worldTopLeftX, snap ? snap.snapY : worldTopLeftY, snap);
          }
        } catch (err) {}
      });
    }

    // Global mouse move & up listeners for canvas panning & placed block dragging
    window.addEventListener("mousemove", (e) => {
      if (this.isPanning) {
        this.panX = e.clientX - this.panStartX;
        this.panY = e.clientY - this.panStartY;
        this.updateWorkspaceTransform();
      } else if (this.draggedPlacedBlock) {
        const dp = this.draggedPlacedBlock;
        const dx = (e.clientX - dp.mouseStartX) / this.zoom;
        const dy = (e.clientY - dp.mouseStartY) / this.zoom;
        const moveDistSq = dx * dx + dy * dy;

        // Disconnect only after moving past drag threshold (4px)
        if (moveDistSq >= 16 && !dp.hasDisconnected) {
          dp.hasDisconnected = true;
          const block = dp.block;
          const scripts = this.getCurrentScripts();
          const isExtractSingle = dp.isExtractSingle;
          let detachedFromId = null;

          // Disconnect from upstream parent
          if (block.prevId) {
            detachedFromId = block.prevId;
            const parent = scripts.find(b => b.id === block.prevId);
            if (parent && parent.nextId === block.id) {
              parent.nextId = isExtractSingle ? (block.nextId || null) : null;
            }
            block.prevId = null;
          }
          if (block.parentCBlockId) {
            detachedFromId = block.parentCBlockId;
            const parentC = scripts.find(b => b.id === block.parentCBlockId);
            if (parentC && parentC.childId === block.id) {
              parentC.childId = isExtractSingle ? (block.nextId || null) : null;
            }
            block.parentCBlockId = null;
          }
          if (block.parentEBlockId) {
            detachedFromId = block.parentEBlockId;
            const parentE = scripts.find(b => b.id === block.parentEBlockId);
            if (parentE) {
              if (parentE.childId_if === block.id) parentE.childId_if = isExtractSingle ? (block.nextId || null) : null;
              if (parentE.childId_else === block.id) parentE.childId_else = isExtractSingle ? (block.nextId || null) : null;
            }
            block.parentEBlockId = null;
            block.parentEBranch = null;
          }

          // If extracting single block, bridge downstream block to old parent
          if (isExtractSingle && block.nextId) {
            const nextB = scripts.find(b => b.id === block.nextId);
            if (nextB) {
              nextB.prevId = detachedFromId;
            }
            block.nextId = null;
          }

          dp.detachedFromId = detachedFromId;

          // Mark dragging visually
          for (let i = 0; i < dp.stackItems.length; i++) {
            if (dp.stackItems[i].elt) dp.stackItems[i].elt.classList.add("dragging");
          }

          if (detachedFromId) {
            this.layoutConnectedStacks();
          }
        }

        if (dp.hasDisconnected) {
          const stackItems = dp.stackItems;
          const rootBlock = dp.block;

          for (let i = 0; i < stackItems.length; i++) {
            const item = stackItems[i];
            item.block.x = Math.round(item.initialX + dx);
            item.block.y = Math.round(item.initialY + dy);
            if (item.elt) {
              item.elt.style.left = `${item.block.x}px`;
              item.elt.style.top = `${item.block.y}px`;
            }
          }

          const snapTarget = this.findSnapTarget(
            rootBlock,
            rootBlock.x,
            rootBlock.y,
            dp.stackIds,
            dp.detachedFromId
          );
          this.activeSnapTarget = snapTarget;
          this.showSnapIndicator(snapTarget);

          const dropZoneEl = document.getElementById("code-drop-zone");
          if (dropZoneEl) {
            const rect = dropZoneEl.getBoundingClientRect();
            const isOutside = (
              e.clientX < rect.left ||
              e.clientX > rect.right ||
              e.clientY < rect.top ||
              e.clientY > rect.bottom
            );
            for (let i = 0; i < stackItems.length; i++) {
              if (stackItems[i].elt) {
                stackItems[i].elt.classList.toggle("delete-candidate", isOutside);
              }
            }
          }
        }
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (this.isPanning) {
        this.isPanning = false;
        if (dropZone) dropZone.classList.remove("panning");
      }
      if (this.draggedPlacedBlock) {
        const dp = this.draggedPlacedBlock;

        if (!dp.hasDisconnected) {
          for (let i = 0; i < dp.stackItems.length; i++) {
            if (dp.stackItems[i].elt) {
              dp.stackItems[i].elt.classList.remove("dragging", "delete-candidate");
            }
          }
          this.draggedPlacedBlock = null;
          return;
        }

        const dropZoneEl = document.getElementById("code-drop-zone");
        let isOutside = false;
        if (dropZoneEl) {
          const rect = dropZoneEl.getBoundingClientRect();
          isOutside = (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          );
        }

        const stackItems = dp.stackItems;
        const rootBlock = dp.block;

        if (isOutside) {
          const scripts = this.getCurrentScripts();
          const idsToDelete = new Set(stackItems.map(item => item.block.id));
          const remaining = scripts.filter(b => !idsToDelete.has(b.id));
          scripts.length = 0;
          scripts.push(...remaining);
          this.renderScriptsForActiveTarget();
          SoundEngine.playAction("delete");
        } else if (this.activeSnapTarget) {
          const snap = this.activeSnapTarget;
          const shiftX = snap.snapX - rootBlock.x;
          const shiftY = snap.snapY - rootBlock.y;

          for (let i = 0; i < stackItems.length; i++) {
            const item = stackItems[i];
            item.block.x += shiftX;
            item.block.y += shiftY;
            if (item.elt) {
              item.elt.style.left = `${item.block.x}px`;
              item.elt.style.top = `${item.block.y}px`;
              item.elt.classList.remove("dragging", "delete-candidate");
            }
          }

          if (snap.position === "bottom") {
            const target = snap.target;
            const oldNextId = target.nextId;
            target.nextId = rootBlock.id;
            rootBlock.prevId = target.id;

            if (oldNextId) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldNextId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldNextId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "top") {
            const target = snap.target;
            const lastInStack = stackItems[stackItems.length - 1].block;
            if (target.prevId) {
              const scripts = this.getCurrentScripts();
              const targetParent = scripts.find(b => b.id === target.prevId);
              if (targetParent) {
                targetParent.nextId = rootBlock.id;
                rootBlock.prevId = targetParent.id;
              }
            }
            lastInStack.nextId = target.id;
            target.prevId = lastInStack.id;
          } else if (snap.position === "inside") {
            const oldChildId = snap.target.childId;
            snap.target.childId = rootBlock.id;
            rootBlock.parentCBlockId = snap.target.id;
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "inside_if") {
            const oldChildId = snap.target.childId_if;
            snap.target.childId_if = rootBlock.id;
            rootBlock.parentEBlockId = snap.target.id;
            rootBlock.parentEBranch = "if";
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "inside_else") {
            const oldChildId = snap.target.childId_else;
            snap.target.childId_else = rootBlock.id;
            rootBlock.parentEBlockId = snap.target.id;
            rootBlock.parentEBranch = "else";
            if (oldChildId && oldChildId !== rootBlock.id) {
              const lastInStack = stackItems[stackItems.length - 1].block;
              lastInStack.nextId = oldChildId;
              const scripts = this.getCurrentScripts();
              const oldChild = scripts.find(b => b.id === oldChildId);
              if (oldChild) oldChild.prevId = lastInStack.id;
            }
          } else if (snap.position === "condition") {
            const target = snap.target;
            target.conditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.conditionBlock.x;
            delete target.conditionBlock.y;
            delete target.conditionBlock.nextId;
            delete target.conditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          } else if (snap.position === "left_condition") {
            const target = snap.target;
            target.leftConditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.leftConditionBlock.x;
            delete target.leftConditionBlock.y;
            delete target.leftConditionBlock.nextId;
            delete target.leftConditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          } else if (snap.position === "right_condition") {
            const target = snap.target;
            target.rightConditionBlock = JSON.parse(JSON.stringify(rootBlock));
            delete target.rightConditionBlock.x;
            delete target.rightConditionBlock.y;
            delete target.rightConditionBlock.nextId;
            delete target.rightConditionBlock.prevId;

            const scripts = this.getCurrentScripts();
            const idsToDelete = new Set(stackItems.map(item => item.block.id));
            const remaining = scripts.filter(b => !idsToDelete.has(b.id));
            scripts.length = 0;
            scripts.push(...remaining);
          }

          SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
          setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);

          this.renderScriptsForActiveTarget();
        } else {
          for (let i = 0; i < stackItems.length; i++) {
            if (stackItems[i].elt) {
              stackItems[i].elt.classList.remove("dragging", "delete-candidate");
            }
          }
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
          this.renderScriptsForActiveTarget();
        }

        this.showSnapIndicator(null);
        this.activeSnapTarget = null;
        this.draggedPlacedBlock = null;
      }
    });

    // 4. Zoom & Center Controls
    const btnZoomIn = document.getElementById("btn-code-zoom-in");
    const btnZoomOut = document.getElementById("btn-code-zoom-out");
    const btnCenter = document.getElementById("btn-code-center");

    if (btnZoomIn) {
      btnZoomIn.addEventListener("click", () => {
        this.zoom = Math.min(2.5, this.zoom * 1.2);
        this.updateWorkspaceTransform();
      });
    }
    if (btnZoomOut) {
      btnZoomOut.addEventListener("click", () => {
        this.zoom = Math.max(0.35, this.zoom / 1.2);
        this.updateWorkspaceTransform();
      });
    }
    if (btnCenter) {
      btnCenter.addEventListener("click", () => {
        this.panX = 40;
        this.panY = 40;
        this.zoom = 1.0;
        this.updateWorkspaceTransform();
        SoundEngine.playChiptuneTone(600, "sine", 0.05, 0.08);
      });
    }

    // 5. Clear buttons
    const btnClear = document.getElementById("btn-code-clear");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        const scripts = this.getCurrentScripts();
        scripts.length = 0;
        this.renderScriptsForActiveTarget();
        SoundEngine.playAction("delete");
      });
    }

    this.selectCategory("events");
    this.updateWorkspaceTransform();
  },

  updateWorkspaceTransform() {
    const workspace = document.getElementById("code-workspace-blocks");
    const dropZone = document.getElementById("code-drop-zone");
    const zoomLabel = document.getElementById("code-zoom-level");

    if (workspace) {
      workspace.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
      workspace.style.transformOrigin = "0 0";
    }

    if (dropZone) {
      const bgSize = 24 * this.zoom;
      dropZone.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
      dropZone.style.backgroundSize = `${bgSize}px ${bgSize}px`;
    }

    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
    }
  },

  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    const codeStageLayout = document.getElementById("code-stage-layout");
    const canvasContainer = document.getElementById("canvas-container");
    const stagePane = document.getElementById("stage-pane");
    const codePreviewBox = document.getElementById("code-preview-canvas-box");
    const floatingDock = document.getElementById("floating-dock");
    const cropBar = document.getElementById("floating-crop-bar");
    const spritePanel = document.getElementById("floating-sprite-poses-panel");

    if (btnCanvas) btnCanvas.classList.toggle("active", mode === "canvas");
    if (btnCode) btnCode.classList.toggle("active", mode === "code");

    const mobileBtnCanvas = document.getElementById("btn-mobile-nav-canvas");
    const mobileBtnCode = document.getElementById("btn-mobile-nav-code");
    if (mobileBtnCanvas) mobileBtnCanvas.classList.toggle("active", mode === "canvas");
    if (mobileBtnCode) mobileBtnCode.classList.toggle("active", mode === "code");

    if (typeof MobileNavigationController !== "undefined") {
      MobileNavigationController.closeDrawer();
    }

    if (mode === "code") {
      document.body.classList.add("mode-code");
      document.body.classList.remove("mode-canvas");

      // Reset Section 2 preview camera to auto-fit
      PreviewConfig.reset();

      const isMobile = window.innerWidth <= 860;

      // Hide canvas left drawer, show code toolbox
      if (isMobile) {
        if (controlsPane) {
          controlsPane.style.removeProperty("display");
          controlsPane.style.removeProperty("width");
        }
        if (codeToolboxPane) {
          codeToolboxPane.style.removeProperty("display");
          codeToolboxPane.style.removeProperty("width");
        }
      } else {
        if (controlsPane) controlsPane.style.display = "none";
        if (codeToolboxPane) {
          codeToolboxPane.style.display = "flex";
          const savedCodeWidth = localStorage.getItem("unifive_code_split_width");
          codeToolboxPane.style.width = savedCodeWidth && parseInt(savedCodeWidth) >= 360 ? savedCodeWidth : "410px";
        }
      }

      // Show 3-section layout
      if (codeStageLayout) codeStageLayout.style.display = isMobile ? "block" : "flex";

      // Reparent canvas-container to Section 2 preview box
      if (canvasContainer && codePreviewBox) {
        codePreviewBox.appendChild(canvasContainer);
      }

      // Hide floating canvas dock / crop / sprite poses
      if (floatingDock) floatingDock.style.display = "none";
      if (cropBar) cropBar.style.display = "none";
      if (spritePanel) spritePanel.style.display = "none";

      SoundEngine.playChiptuneTone(520, "sine", 0.08, 0.1);

      this.renderObjectsList();
      this.updateTargetBadge();
      this.renderScriptsForActiveTarget();
      this.updateWorkspaceTransform();
    } else {
      document.body.classList.remove("mode-code");
      document.body.classList.add("mode-canvas");

      // Stop scripts execution when returning to canvas mode if needed
      if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
        CodeRuntimeEngine.stopAll();
      }

      const isMobile = window.innerWidth <= 860;

      // Show canvas left drawer, hide code toolbox
      if (isMobile) {
        if (controlsPane) {
          controlsPane.style.removeProperty("display");
          controlsPane.style.removeProperty("width");
        }
        if (codeToolboxPane) {
          codeToolboxPane.style.removeProperty("display");
          codeToolboxPane.style.removeProperty("width");
        }
      } else {
        if (controlsPane) {
          controlsPane.style.display = "flex";
          const savedWidth = localStorage.getItem("unifive_split_width");
          if (savedWidth) controlsPane.style.width = savedWidth;
        }
        if (codeToolboxPane) codeToolboxPane.style.display = "none";
      }

      // Hide 3-section layout
      if (codeStageLayout) codeStageLayout.style.display = "none";

      // Reparent canvas-container back to stage-pane
      if (canvasContainer && stagePane) {
        stagePane.insertBefore(canvasContainer, stagePane.firstChild);
      }

      // Restore floating dock
      if (floatingDock) floatingDock.style.display = "flex";

      // Re-show sprite poses panel if sprite selected
      const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
      if (sel && (sel.type === "sprite" || sel.poses || (sel.assetId && sel.assetId.startsWith("sprite_")))) {
        if (typeof SpritePosesController !== "undefined") {
          SpritePosesController.show(sel);
        }
      }

      WorldConfig.clampPan();
      SoundEngine.playChiptuneTone(440, "sine", 0.08, 0.1);
    }

    // Trigger canvas dimension recalculation & redraw
    setTimeout(() => {
      resizeStageCanvas();
      if (this.currentMode === "canvas") {
        WorldConfig.clampPan();
      }
    }, 60);
  },

  isCodeMode() {
    return this.currentMode === "code";
  },

  selectCategory(catKey) {
    this.activeCategory = catKey;
    const catButtons = document.querySelectorAll(".code-cat-btn");
    catButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-category") === catKey);
    });

    const catDot = document.getElementById("code-palette-cat-dot");
    const catTitle = document.getElementById("code-palette-title");
    const catCount = document.getElementById("code-palette-count");
    const blocksList = document.getElementById("code-blocks-list");

    const targetInfo = this.getActiveTargetInfo();
    const allBlocks = this.categories[catKey] || [];
    const blocks = allBlocks.filter(b => this.isBlockAvailableForTarget(b, targetInfo));

    const catBtn = document.querySelector(`.code-cat-btn[data-category="${catKey}"]`);
    const catColor = catBtn ? catBtn.style.getPropertyValue("--cat-color") : "#f59e0b";

    if (catDot) catDot.style.backgroundColor = catColor;
    if (catTitle) catTitle.textContent = catKey.toUpperCase();
    if (catCount) catCount.textContent = `${blocks.length} ${blocks.length === 1 ? 'BLOCK' : 'BLOCKS'}`;

    if (!blocksList) return;
    blocksList.innerHTML = "";

    // If VARIABLES category: Render + MAKE A VARIABLE button & Variable List
    if (catKey === "variables") {
      const makeVarBtn = document.createElement("button");
      makeVarBtn.className = "btn-make-variable";
      makeVarBtn.innerHTML = '<i class="ph ph-plus-circle"></i><span>MAKE A VARIABLE</span>';
      makeVarBtn.addEventListener("click", () => VariableManager.openModal());
      blocksList.appendChild(makeVarBtn);

      const varsSection = document.createElement("div");
      varsSection.className = "vars-list-section";

      VariableManager.variables.forEach(v => {
        const row = document.createElement("div");
        row.className = "var-item-row";

        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.className = "var-checkbox-custom";
        chk.checked = v.showWatcher;
        chk.title = "Toggle watcher on stage";
        chk.addEventListener("change", (e) => {
          v.showWatcher = e.target.checked;
          SoundEngine.playChiptuneTone(v.showWatcher ? 640 : 360, "square", 0.04, 0.08);
        });

        const pill = document.createElement("div");
        pill.className = "var-reporter-pill";
        pill.textContent = v.name;
        pill.title = `Variable: ${v.name} (Value: ${v.value})`;

        row.appendChild(chk);
        row.appendChild(pill);

        if (v.name !== "score") {
          const delBtn = document.createElement("button");
          delBtn.className = "var-delete-btn";
          delBtn.innerHTML = '<i class="ph ph-trash"></i>';
          delBtn.title = `Delete variable '${v.name}'`;
          delBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            VariableManager.deleteVariable(v.id);
            SoundEngine.playAction("delete");
          });
          row.appendChild(delBtn);
        }

        varsSection.appendChild(row);
      });

      blocksList.appendChild(varsSection);
    }

    if (blocks.length === 0 && catKey !== "variables") {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "code-palette-empty-category";
      emptyDiv.innerHTML = `
        <i class="ph ph-prohibit"></i>
        <span>NO <strong>${catKey.toUpperCase()}</strong> BLOCKS</span>
        <small>${targetInfo.isStage ? "Motion & character blocks are not applicable to the global stage backdrop. Select an object or character on the canvas to use them." : "These blocks are only available for animated character sprites."}</small>
      `;
      blocksList.appendChild(emptyDiv);
      return;
    }

    blocks.forEach(block => {
      const blockEl = this.createBlockElement(block, false);

      // Drag block from palette to infinite workspace
      blockEl.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        const ghost = this.createBlockElement(block, false);
        ghost.classList.add("code-drag-ghost");
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        document.body.appendChild(ghost);

        let hasMoved = false;

        const onMove = (moveEv) => {
          hasMoved = true;
          ghost.style.left = `${moveEv.clientX}px`;
          ghost.style.top = `${moveEv.clientY}px`;

          const dropZone = document.getElementById("code-drop-zone");
          if (dropZone) {
            const rect = dropZone.getBoundingClientRect();
            if (
              moveEv.clientX >= rect.left &&
              moveEv.clientX <= rect.right &&
              moveEv.clientY >= rect.top &&
              moveEv.clientY <= rect.bottom
            ) {
              const bDims = this.getBlockDimensions(block);
              const worldCursorX = Math.round((moveEv.clientX - rect.left - this.panX) / this.zoom);
              const worldCursorY = Math.round((moveEv.clientY - rect.top - this.panY) / this.zoom);

              const worldTopLeftX = worldCursorX - Math.round(bDims.w / 2);
              const worldTopLeftY = worldCursorY - Math.round(bDims.h / 2);

              let snap = this.findSnapTarget(block, worldTopLeftX, worldTopLeftY, new Set());
              if (!snap) {
                snap = this.findSnapTarget(block, worldCursorX, worldCursorY, new Set());
              }
              this.activePaletteSnap = snap;
              this.showSnapIndicator(snap);
            } else {
              this.activePaletteSnap = null;
              this.showSnapIndicator(null);
            }
          }
        };

        const onUp = (upEv) => {
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
          this.showSnapIndicator(null);

          const dropZone = document.getElementById("code-drop-zone");
          if (!dropZone) return;
          const rect = dropZone.getBoundingClientRect();

          if (!hasMoved) {
            const spawnX = Math.round((-this.panX + rect.width / 2 - 80) / this.zoom + (Math.random() * 40 - 20));
            const spawnY = Math.round((-this.panY + rect.height / 2 - 20) / this.zoom + (Math.random() * 40 - 20));
            this.addBlockToWorkspace(block, spawnX, spawnY);
          } else if (
            upEv.clientX >= rect.left &&
            upEv.clientX <= rect.right &&
            upEv.clientY >= rect.top &&
            upEv.clientY <= rect.bottom
          ) {
            if (this.activePaletteSnap) {
              const snap = this.activePaletteSnap;
              this.addBlockToWorkspace(block, snap.snapX, snap.snapY, snap);
              SoundEngine.playChiptuneTone(880, "triangle", 0.04, 0.15);
              setTimeout(() => SoundEngine.playChiptuneTone(1174, "triangle", 0.06, 0.15), 40);
            } else {
              const bDims = this.getBlockDimensions(block);
              const worldX = Math.round((upEv.clientX - rect.left - this.panX) / this.zoom) - Math.round(bDims.w / 2);
              const worldY = Math.round((upEv.clientY - rect.top - this.panY) / this.zoom) - Math.round(bDims.h / 2);
              this.addBlockToWorkspace(block, worldX, worldY);
            }
          }
          this.activePaletteSnap = null;
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
      });

      blocksList.appendChild(blockEl);
    });
  },

  addBlockToWorkspace(blockTemplate, x = 60, y = 60, snapTarget = null) {
    const scripts = this.getCurrentScripts();
    const placedBlock = {
      id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      blockId: blockTemplate.id || blockTemplate.blockId,
      name: blockTemplate.name,
      hat: !!blockTemplate.hat,
      cap: !!blockTemplate.cap,
      c_block: !!blockTemplate.c_block,
      e_block: !!blockTemplate.e_block,
      isReporter: !!(blockTemplate.isReporter || blockTemplate.reporter),
      isBoolean: !!(blockTemplate.isBoolean || blockTemplate.boolean || blockTemplate.color === "#0284c7" || (blockTemplate.id && blockTemplate.id.startsWith("op_") && (blockTemplate.isBoolean || blockTemplate.opType === ">" || blockTemplate.opType === "<" || blockTemplate.opType === "=" || blockTemplate.opType === "contains" || blockTemplate.isLogical))),
      isLogical: !!blockTemplate.isLogical,
      opType: blockTemplate.opType || null,
      isRandom: !!blockTemplate.isRandom,
      isConditionBlock: !!blockTemplate.isConditionBlock,
      isTouchingSelector: !!blockTemplate.isTouchingSelector,
      isDistanceSelector: !!blockTemplate.isDistanceSelector,
      isPlayableCharSelector: !!blockTemplate.isPlayableCharSelector,
      options: blockTemplate.options ? [...blockTemplate.options] : null,
      isVarSetter: !!blockTemplate.isVarSetter,
      isVarChanger: !!blockTemplate.isVarChanger,
      isVarSelector: !!blockTemplate.isVarSelector,
      color: blockTemplate.color,
      icon: blockTemplate.icon,
      x: x,
      y: y,
      inputs: blockTemplate.inputs ? [...blockTemplate.inputs] : [],
      nextId: null,
      prevId: null,
      childId: null,
      childId_if: null,
      childId_else: null
    };

    if (snapTarget && snapTarget.target) {
      if (snapTarget.position === "condition") {
        snapTarget.target.conditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.conditionBlock.x;
        delete snapTarget.target.conditionBlock.y;
        delete snapTarget.target.conditionBlock.nextId;
        delete snapTarget.target.conditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "left_condition") {
        snapTarget.target.leftConditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.leftConditionBlock.x;
        delete snapTarget.target.leftConditionBlock.y;
        delete snapTarget.target.leftConditionBlock.nextId;
        delete snapTarget.target.leftConditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "right_condition") {
        snapTarget.target.rightConditionBlock = JSON.parse(JSON.stringify(placedBlock));
        delete snapTarget.target.rightConditionBlock.x;
        delete snapTarget.target.rightConditionBlock.y;
        delete snapTarget.target.rightConditionBlock.nextId;
        delete snapTarget.target.rightConditionBlock.prevId;
        this.renderScriptsForActiveTarget();
        return;
      }
      if (snapTarget.position === "bottom") {
        const target = snapTarget.target;
        const oldNextId = target.nextId;
        target.nextId = placedBlock.id;
        placedBlock.prevId = target.id;
        if (oldNextId) {
          placedBlock.nextId = oldNextId;
          const oldChild = scripts.find(b => b.id === oldNextId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "top") {
        const target = snapTarget.target;
        if (target.prevId) {
          const parent = scripts.find(b => b.id === target.prevId);
          if (parent) {
            parent.nextId = placedBlock.id;
            placedBlock.prevId = parent.id;
          }
        }
        placedBlock.nextId = target.id;
        target.prevId = placedBlock.id;
      } else if (snapTarget.position === "inside") {
        const oldChildId = snapTarget.target.childId;
        snapTarget.target.childId = placedBlock.id;
        placedBlock.parentCBlockId = snapTarget.target.id;
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "inside_if") {
        const oldChildId = snapTarget.target.childId_if;
        snapTarget.target.childId_if = placedBlock.id;
        placedBlock.parentEBlockId = snapTarget.target.id;
        placedBlock.parentEBranch = "if";
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      } else if (snapTarget.position === "inside_else") {
        const oldChildId = snapTarget.target.childId_else;
        snapTarget.target.childId_else = placedBlock.id;
        placedBlock.parentEBlockId = snapTarget.target.id;
        placedBlock.parentEBranch = "else";
        if (oldChildId && oldChildId !== placedBlock.id) {
          placedBlock.nextId = oldChildId;
          const oldChild = scripts.find(b => b.id === oldChildId);
          if (oldChild) oldChild.prevId = placedBlock.id;
        }
      }
    }

    scripts.push(placedBlock);
    this.renderScriptsForActiveTarget();
    if (!snapTarget) {
      SoundEngine.playChiptuneTone(680, "square", 0.05, 0.08);
    }
  },

  deleteSingleBlock(blockId) {
    const scripts = this.getCurrentScripts();
    const idx = scripts.findIndex(b => b.id === blockId);
    if (idx === -1) return;

    const block = scripts[idx];
    const prevBlock = block.prevId ? scripts.find(b => b.id === block.prevId) : null;
    const nextBlock = block.nextId ? scripts.find(b => b.id === block.nextId) : null;
    const parentC = block.parentCBlockId ? scripts.find(b => b.id === block.parentCBlockId) : null;
    const parentE = block.parentEBlockId ? scripts.find(b => b.id === block.parentEBlockId) : null;

    // Bridge the parent to the next block (or null)
    if (prevBlock && prevBlock.nextId === block.id) {
      prevBlock.nextId = nextBlock ? nextBlock.id : null;
    }
    if (parentC && parentC.childId === block.id) {
      parentC.childId = nextBlock ? nextBlock.id : null;
    }
    if (parentE) {
      if (parentE.childId_if === block.id) {
        parentE.childId_if = nextBlock ? nextBlock.id : null;
      }
      if (parentE.childId_else === block.id) {
        parentE.childId_else = nextBlock ? nextBlock.id : null;
      }
    }

    // Bridge the next block to the parent
    if (nextBlock) {
      nextBlock.prevId = prevBlock ? prevBlock.id : null;
      nextBlock.parentCBlockId = prevBlock ? (prevBlock.parentCBlockId || null) : (parentC ? parentC.id : null);
      nextBlock.parentEBlockId = prevBlock ? (prevBlock.parentEBlockId || null) : (parentE ? parentE.id : null);
      nextBlock.parentEBranch = prevBlock ? (prevBlock.parentEBranch || null) : (parentE ? block.parentEBranch : null);

      if (!prevBlock && !parentC && !parentE) {
        nextBlock.x = block.x;
        nextBlock.y = block.y;
      }
    }

    // Remove ONLY this single block from the scripts array
    scripts.splice(idx, 1);
    this.renderScriptsForActiveTarget();
    SoundEngine.playAction("delete");
  },

  renderScriptsForActiveTarget() {
    const workspace = document.getElementById("code-workspace-blocks");
    const emptyState = document.getElementById("code-workspace-empty");
    if (!workspace) return;

    const scripts = this.getCurrentScripts();
    if (typeof U5Compiler !== "undefined") U5Compiler.updateStats();

    if (scripts.length === 0) {
      workspace.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    workspace.innerHTML = "";

    scripts.forEach((block) => {
      const blockEl = this.createBlockElement(block, true);
      blockEl.style.left = `${block.x}px`;
      blockEl.style.top = `${block.y}px`;

      // Delete single block button
      const deleteBtn = blockEl.querySelector(".code-block-delete-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          this.deleteSingleBlock(block.id);
        });
      }

      // Drag to move placed block and its connected stack freely anywhere on the canvas
      blockEl.addEventListener("mousedown", (e) => {
        if (e.target.closest(".code-block-delete-btn") || e.target.closest(".code-block-input") || e.target.closest(".code-block-select") || e.target.closest(".nested-block-eject-btn")) {
          return;
        }
        e.stopPropagation();

        const isExtractSingle = e.altKey || e.shiftKey;
        const stack = isExtractSingle ? [block] : this.getConnectedStack(block);
        const stackItems = stack.map(b => {
          const el = this.getBlockElement(b.id);
          return {
            block: b,
            elt: el,
            initialX: b.x,
            initialY: b.y
          };
        });

        this.draggedPlacedBlock = {
          block: block,
          elt: blockEl,
          stack: stack,
          stackItems: stackItems,
          stackIds: new Set(stack.map(b => b.id)),
          mouseStartX: e.clientX,
          mouseStartY: e.clientY,
          initialX: block.x,
          initialY: block.y,
          isExtractSingle: isExtractSingle,
          hasDisconnected: false,
          detachedFromId: null
        };
      });

      workspace.appendChild(blockEl);
    });

    // Automatically align all connected block chains and nested C/E loops flush
    this.layoutConnectedStacks();
    requestAnimationFrame(() => this.layoutConnectedStacks());
  },

  layoutConnectedStacks() {
    const scripts = this.getCurrentScripts();
    if (!scripts || scripts.length === 0) return;

    const map = new Map(scripts.map(b => [b.id, b]));
    const visited = new Set();

    // Find root blocks (blocks with no parent above or enclosing them)
    const roots = scripts.filter(b => !b.prevId && !b.parentCBlockId && !b.parentEBlockId);

    const layoutNode = (node, curX, curY) => {
      if (!node || visited.has(node.id)) return;
      visited.add(node.id);

      curX = typeof curX === "number" && !isNaN(curX) ? curX : 60;
      curY = typeof curY === "number" && !isNaN(curY) ? curY : 60;

      node.x = curX;
      node.y = curY;

      const el = this.getBlockElement(node.id);
      if (el) {
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
      }

      if (node.c_block) {
        const bodyH = this.getBranchHeight(node.childId, map);
        if (el) {
          const bodyEl = el.querySelector(".c-block-body");
          if (bodyEl) {
            bodyEl.style.height = `${bodyH}px`;
            bodyEl.style.minHeight = `${bodyH}px`;
          }
        }
        // Layout inner C-block children
        if (node.childId && map.has(node.childId)) {
          let childNode = map.get(node.childId);
          let childY = curY + 32;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
      } else if (node.e_block) {
        const ifBodyH = this.getBranchHeight(node.childId_if, map);
        const elseBodyH = this.getBranchHeight(node.childId_else, map);
        if (el) {
          const bodyIfEl = el.querySelector(".e-block-body-if");
          if (bodyIfEl) {
            bodyIfEl.style.height = `${ifBodyH}px`;
            bodyIfEl.style.minHeight = `${ifBodyH}px`;
          }
          const bodyElseEl = el.querySelector(".e-block-body-else");
          if (bodyElseEl) {
            bodyElseEl.style.height = `${elseBodyH}px`;
            bodyElseEl.style.minHeight = `${elseBodyH}px`;
          }
        }
        // Layout inner If-branch children
        if (node.childId_if && map.has(node.childId_if)) {
          let childNode = map.get(node.childId_if);
          let childY = curY + 32;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
        // Layout inner Else-branch children
        if (node.childId_else && map.has(node.childId_else)) {
          let childNode = map.get(node.childId_else);
          let childY = curY + 32 + ifBodyH + 24;
          while (childNode && !visited.has(childNode.id)) {
            layoutNode(childNode, curX + 16, childY);
            const childDims = this.getBlockDimensions(childNode);
            childY += childDims.h - 2;
            childNode = childNode.nextId ? map.get(childNode.nextId) : null;
          }
        }
      }

      // Layout downstream connected next block (attached to bottom footer of this block)
      if (node.nextId && map.has(node.nextId)) {
        const nextNode = map.get(node.nextId);
        const fullH = this.getFullBlockHeight(node, map);
        const nextY = curY + fullH - 2;
        layoutNode(nextNode, curX, nextY);
      }
    };

    roots.forEach(root => {
      layoutNode(root, root.x, root.y);
    });

    // Fallback for any unvisited blocks
    scripts.forEach(b => {
      if (!visited.has(b.id)) {
        layoutNode(b, b.x, b.y);
      }
    });
  },

  updateTargetBadge() {
    const targetBadge = document.getElementById("code-target-badge");
    const targetName = document.getElementById("code-target-name");
    const targetIcon = document.getElementById("code-target-icon");

    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (sel) {
      if (targetName) targetName.textContent = sel.name.toUpperCase();
      if (targetIcon) {
        if (sel.type === "sprite" || (sel.assetId && sel.assetId.startsWith("sprite_"))) {
          targetIcon.className = "ph ph-person-simple-walk";
        } else {
          targetIcon.className = "ph ph-cube";
        }
      }
    } else {
      if (targetName) targetName.textContent = "STAGE (GLOBAL)";
      if (targetIcon) targetIcon.className = "ph ph-globe";
    }

    this.renderScriptsForActiveTarget();
    this.selectCategory(this.activeCategory || "events");
  },

  renderObjectsList() {
    const listEl = document.getElementById("code-objects-list");
    const countBadge = document.getElementById("code-objects-count-badge");
    if (!listEl) return;

    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) {
      listEl.innerHTML = "";
      return;
    }

    const items = WorldObjectsManager.items;
    if (countBadge) countBadge.textContent = `${items.length} ${items.length === 1 ? 'OBJECT' : 'OBJECTS'}`;

    if (items.length === 0) {
      listEl.innerHTML = `
        <div class="code-objects-empty">
          <i class="ph ph-cube"></i>
          <span>No objects on canvas</span>
          <small>Switch to Canvas mode to add sprites and props</small>
        </div>
      `;
      return;
    }

    listEl.innerHTML = "";

    // 1. Stage Card (Global Target)
    const isStageSelected = !WorldObjectsManager.selectedId;
    const stageCard = document.createElement("div");
    stageCard.className = `code-object-card ${isStageSelected ? 'active' : ''}`;
    stageCard.innerHTML = `
      <div class="code-obj-thumb-box" style="background-color: #1e1b4b; display: flex; align-items: center; justify-content: center;">
        <i class="ph ph-globe" style="font-size: 1.3rem; color: #a5b4fc;"></i>
      </div>
      <div class="code-obj-info">
        <div class="code-obj-title-row">
          <span class="code-obj-name">GLOBAL STAGE</span>
          <span class="code-obj-type-tag" style="background-color: #312e81; color: #c7d2fe; border-color: #4338ca;">BACKDROP</span>
        </div>
        <div class="code-obj-coords-row">
          <span class="code-obj-coord">World: <strong>5760x1080</strong></span>
          <span class="code-obj-coord">Global Scripts</span>
        </div>
      </div>
    `;
    stageCard.addEventListener("click", () => {
      WorldObjectsManager.selectedId = null;
      this.renderObjectsList();
      this.updateTargetBadge();
      SoundEngine.playAction("select");
    });
    listEl.appendChild(stageCard);

    // 2. Placed Canvas Items (Sprites & Props)
    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = `code-object-card ${item.id === WorldObjectsManager.selectedId ? 'active' : ''}`;
      card.setAttribute("data-id", item.id);

      const isSprite = item.type === "sprite" || (item.assetId && item.assetId.startsWith("sprite_")) || item.poses;
      const typeLabel = isSprite ? "SPRITE" : (item.type || "PROP");

      card.innerHTML = `
        <div class="code-obj-thumb-box">
          <img class="code-obj-thumb-img" src="${item.thumb || item.src}" alt="${item.name}">
        </div>
        <div class="code-obj-info">
          <div class="code-obj-title-row">
            <span class="code-obj-name" title="${item.name}">${item.name}</span>
            ${item.isPlayable ? '<span class="code-obj-hero-badge" title="Designated Playable Character"><i class="ph ph-crown"></i> HERO</span>' : ''}
            ${item.isSolid ? '<span class="code-obj-solid-badge" title="Solid Obstacle"><i class="ph ph-shield"></i> SOLID</span>' : ''}
            <span class="code-obj-type-tag">${typeLabel}</span>
          </div>
          <div class="code-obj-coords-row">
            <span class="code-obj-coord">X: <strong>${Math.round(item.x)}</strong></span>
            <span class="code-obj-coord">Y: <strong>${Math.round(item.y)}</strong></span>
            <span class="code-obj-coord">L: <strong>#${index + 1}</strong></span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (WorldObjectsManager.selectedId === item.id) {
          WorldObjectsManager.selectedId = null;
        } else {
          WorldObjectsManager.selectItem(item.id);
        }
        this.renderObjectsList();
        this.updateTargetBadge();
        SoundEngine.playAction("select");
      });

      listEl.appendChild(card);
    });
  }
};

// ============================================================================
// 12. CODE RUNTIME ENGINE & BLOCK INTERPRETER
// ============================================================================
const CodeRuntimeEngine = {
  isRunning: false,
  activeThreads: [],

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  init() {
    const btnRun = document.getElementById("btn-code-run");
    if (btnRun) {
      btnRun.addEventListener("click", () => this.toggleRun());
    }

    // Spacebar listener for 'when [space] key pressed'
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.contentEditable === "true") return;
      if (this.isRunning) {
        const keyName = e.code === "Space" ? "space" : e.key.toLowerCase();
        this.triggerEvent("when_key", keyName);
      }
    });
  },

  toggleRun() {
    if (this.isRunning) {
      this.stopAll();
    } else {
      this.start("when_flag");
    }
  },

  start(trigger = "when_flag", arg = null) {
    this.isRunning = true;
    this.updateRunButtonUI(true);

    SoundEngine.playChiptuneTone(523, "square", 0.08, 0.12);
    setTimeout(() => SoundEngine.playChiptuneTone(659, "square", 0.08, 0.12), 60);
    setTimeout(() => SoundEngine.playChiptuneTone(784, "square", 0.12, 0.15), 120);

    this.triggerEvent(trigger, arg);
  },

  stopAll() {
    this.isRunning = false;
    this.activeThreads = [];
    this.updateRunButtonUI(false);

    document.querySelectorAll(".code-block-item.executing-halo").forEach(el => {
      el.classList.remove("executing-halo");
    });

    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      WorldObjectsManager.items.forEach(it => {
        if (it.speechBubble) delete it.speechBubble;
      });
    }

    SoundEngine.playChiptuneTone(330, "square", 0.08, 0.12);
    setTimeout(() => SoundEngine.playChiptuneTone(220, "square", 0.12, 0.12), 70);
  },

  updateRunButtonUI(running) {
    const btnRun = document.getElementById("btn-code-run");
    if (!btnRun) return;
    if (running) {
      btnRun.classList.remove("btn-run");
      btnRun.classList.add("btn-stop");
      btnRun.innerHTML = '<i class="ph ph-stop-fill"></i><span>STOP</span>';
    } else {
      btnRun.classList.remove("btn-stop");
      btnRun.classList.add("btn-run");
      btnRun.innerHTML = '<i class="ph ph-play-fill"></i><span>RUN</span>';
    }
  },

  triggerEvent(triggerType, eventArg = null, specificTargetId = null) {
    if (!this.isRunning) return;

    const allTargets = specificTargetId ? [specificTargetId] : Object.keys(AppModeController.objectScripts || {});
    const activeTargetId = AppModeController.getActiveTargetId();
    if (!specificTargetId && !allTargets.includes(activeTargetId)) allTargets.push(activeTargetId);

    allTargets.forEach(targetId => {
      const scripts = AppModeController.objectScripts[targetId] || [];
      const targetItem = typeof WorldObjectsManager !== "undefined"
        ? WorldObjectsManager.items.find(it => it.id === targetId)
        : null;

      scripts.forEach(block => {
        if (this.isEventHatMatch(block, triggerType, eventArg)) {
          this.launchThread(block, targetItem, targetId);
        }
      });
    });
  },

  isEventHatMatch(block, triggerType, eventArg) {
    if (triggerType === "when_flag" && block.blockId === "when_flag") return true;
    if (triggerType === "when_clicked" && block.blockId === "when_clicked") return true;
    if (triggerType === "when_became_playable" && block.blockId === "when_became_playable") return true;
    if (triggerType === "when_key" && block.blockId === "when_key") {
      const inputVal = this.getBlockInput(block, 0) || "space";
      if (inputVal.toLowerCase() === (eventArg || "").toLowerCase() || inputVal.toLowerCase() === "any") return true;
    }
    if (triggerType === "when_receive" && block.blockId === "when_receive") {
      const msg = this.getBlockInput(block, 0) || "message1";
      if (msg.toLowerCase() === (eventArg || "").toLowerCase()) return true;
    }
    return false;
  },

  broadcast(messageName) {
    this.triggerEvent("when_receive", messageName);
  },

  launchThread(rootBlock, targetItem, targetId) {
    const thread = this.runScriptThread(rootBlock, targetItem, targetId);
    this.activeThreads.push(thread);
    thread.finally(() => {
      const idx = this.activeThreads.indexOf(thread);
      if (idx >= 0) this.activeThreads.splice(idx, 1);
    });
  },

  async runScriptThread(rootBlock, targetItem, targetId) {
    let curr = rootBlock;
    const scripts = AppModeController.objectScripts[targetId] || AppModeController.getCurrentScripts();

    while (curr && this.isRunning) {
      const nextId = curr.nextId;
      await this.executeBlock(curr, targetItem);
      if (!this.isRunning) break;

      if (nextId) {
        curr = scripts.find(b => b.id === nextId) || null;
      } else {
        curr = null;
      }
    }
  },

  async executeBlock(block, targetItem) {
    if (!this.isRunning || !block) return;

    const blockEl = AppModeController.getBlockElement(block.id);
    if (blockEl) blockEl.classList.add("executing-halo");

    try {
      switch (block.blockId) {
        // ================= MOTION =================
        case "move_x_steps":
        case "move_steps_x": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 0;
          if (targetItem) {
            targetItem.x = Math.round(targetItem.x + steps);
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
          }
          await this.sleep(16);
          break;
        }
        case "move_y_steps":
        case "move_steps_y": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 0;
          if (targetItem) {
            targetItem.y = Math.round(targetItem.y + steps);
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
          }
          await this.sleep(16);
          break;
        }
        case "move_steps": {
          const steps = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10;
          if (targetItem) {
            const rotRad = ((targetItem.rotation || 0) - 90) * Math.PI / 180;
            targetItem.x = Math.round(targetItem.x + steps * Math.cos(rotRad));
            targetItem.y = Math.round(targetItem.y + steps * Math.sin(rotRad));
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
          }
          await this.sleep(16);
          break;
        }
        case "turn_right": {
          const deg = Number(this.evalBlockInput(block, 0, targetItem, 15)) || 15;
          if (targetItem) {
            targetItem.rotation = Math.round((targetItem.rotation || 0) + deg) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "turn_left": {
          const deg = Number(this.evalBlockInput(block, 0, targetItem, 15)) || 15;
          if (targetItem) {
            targetItem.rotation = Math.round((targetItem.rotation || 0) - deg + 360) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "goto_xy": {
          const gx = Number(this.evalBlockInput(block, 0, targetItem, 0)) || 0;
          const gy = Number(this.evalBlockInput(block, 1, targetItem, 0)) || 0;
          if (targetItem) {
            targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, gx));
            targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, gy));
          }
          await this.sleep(16);
          break;
        }
        case "glide_xy": {
          const secs = Math.max(0.1, Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1);
          const gx = Number(this.evalBlockInput(block, 1, targetItem, 0)) || 0;
          const gy = Number(this.evalBlockInput(block, 2, targetItem, 0)) || 0;
          if (targetItem) {
            const startX = targetItem.x;
            const startY = targetItem.y;
            const targetX = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, gx));
            const targetY = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, gy));
            const durationMs = secs * 1000;
            const startTime = Date.now();

            while (this.isRunning && Date.now() - startTime < durationMs) {
              const progress = Math.min(1, (Date.now() - startTime) / durationMs);
              targetItem.x = Math.round(startX + (targetX - startX) * progress);
              targetItem.y = Math.round(startY + (targetY - startY) * progress);
              await this.sleep(16);
            }
            targetItem.x = targetX;
            targetItem.y = targetY;
          }
          break;
        }
        case "point_dir": {
          const dir = Number(this.evalBlockInput(block, 0, targetItem, 90)) || 90;
          if (targetItem) {
            targetItem.rotation = ((dir % 360) + 360) % 360;
          }
          await this.sleep(16);
          break;
        }
        case "bounce_edge": {
          if (targetItem) {
            let bounced = false;
            if (targetItem.x <= 0 || targetItem.x + targetItem.w >= WorldConfig.worldWidth) {
              targetItem.rotation = (360 - (targetItem.rotation || 0)) % 360;
              targetItem.x = Math.max(0, Math.min(WorldConfig.worldWidth - targetItem.w, targetItem.x));
              bounced = true;
            }
            if (targetItem.y <= 0 || targetItem.y + targetItem.h >= WorldConfig.worldHeight) {
              targetItem.rotation = (180 - (targetItem.rotation || 0) + 360) % 360;
              targetItem.y = Math.max(0, Math.min(WorldConfig.worldHeight - targetItem.h, targetItem.y));
              bounced = true;
            }
            if (bounced) SoundEngine.playChiptuneTone(400, "triangle", 0.04, 0.1);
          }
          await this.sleep(16);
          break;
        }

        // ================= LOOKS =================
        case "say_text": {
          const text = String(this.evalBlockInput(block, 0, targetItem, "Hello!"));
          const secs = Number(this.evalBlockInput(block, 1, targetItem, 2)) || 2;
          if (targetItem) {
            targetItem.speechBubble = {
              text: text,
              expiresAt: Date.now() + secs * 1000
            };
          }
          await this.sleep(secs * 1000);
          break;
        }
        case "switch_costume": {
          const poseName = String(this.evalBlockInput(block, 0, targetItem, "Attack"));
          if (targetItem && targetItem.poses && targetItem.poses[poseName]) {
            SpritePosesController.selectPose(targetItem, poseName, targetItem.poses[poseName]);
          }
          await this.sleep(16);
          break;
        }
        case "next_costume": {
          if (targetItem && targetItem.poses) {
            const poseKeys = Object.keys(targetItem.poses);
            if (poseKeys.length > 0) {
              const curIdx = poseKeys.indexOf(targetItem.currentPose || poseKeys[0]);
              const nextIdx = (curIdx + 1) % poseKeys.length;
              const nextPose = poseKeys[nextIdx];
              SpritePosesController.selectPose(targetItem, nextPose, targetItem.poses[nextPose]);
            }
          }
          await this.sleep(16);
          break;
        }
        case "change_size": {
          const deltaPct = Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10;
          if (targetItem) {
            const factor = (100 + deltaPct) / 100;
            targetItem.w = Math.max(16, Math.round(targetItem.w * factor));
            targetItem.h = Math.max(16, Math.round(targetItem.h * factor));
          }
          await this.sleep(16);
          break;
        }
        case "set_size": {
          const pct = Number(this.evalBlockInput(block, 0, targetItem, 100)) || 100;
          if (targetItem) {
            const nw = targetItem.naturalW || targetItem.w;
            const nh = targetItem.naturalH || targetItem.h;
            targetItem.w = Math.max(16, Math.round(nw * (pct / 100)));
            targetItem.h = Math.max(16, Math.round(nh * (pct / 100)));
          }
          await this.sleep(16);
          break;
        }
        case "move_layer_front": {
          const count = Math.max(1, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1));
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            WorldObjectsManager.moveLayerFront(targetItem.id, count);
          }
          await this.sleep(16);
          break;
        }
        case "move_layer_back": {
          const count = Math.max(1, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1));
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            WorldObjectsManager.moveLayerBack(targetItem.id, count);
          }
          await this.sleep(16);
          break;
        }
        case "go_to_layer": {
          const dest = String(this.evalBlockInput(block, 0, targetItem, "front")).toLowerCase();
          if (targetItem && typeof WorldObjectsManager !== "undefined") {
            if (dest === "back") {
              WorldObjectsManager.sendToBack(targetItem.id);
            } else {
              WorldObjectsManager.bringToFront(targetItem.id);
            }
          }
          await this.sleep(16);
          break;
        }
        case "show": {
          if (targetItem) targetItem.hidden = false;
          await this.sleep(16);
          break;
        }
        case "hide": {
          if (targetItem) targetItem.hidden = true;
          await this.sleep(16);
          break;
        }

        // ================= SENSING =================
        case "touching_object": {
          const objTarget = String(this.evalBlockInput(block, 0, targetItem, "edge"));
          this.evaluateCondition(`touching ${objTarget}`, targetItem);
          await this.sleep(16);
          break;
        }
        case "touching_solid": {
          this.evaluateCondition("touching solid", targetItem);
          await this.sleep(16);
          break;
        }
        case "distance_to_object": {
          const objTarget = String(this.evalBlockInput(block, 0, targetItem, "hero"));
          const distVal = Number(this.evalBlockInput(block, 1, targetItem, 50)) || 50;
          this.evaluateCondition(`distance to ${objTarget} < ${distVal}`, targetItem);
          await this.sleep(16);
          break;
        }

        // ================= SOUND =================
        case "play_sound": {
          const soundName = String(this.evalBlockInput(block, 0, targetItem, "jump")).toLowerCase();
          SoundEngine.playSoundEffect(soundName);
          await this.sleep(200);
          break;
        }
        case "start_sound": {
          const soundName = String(this.evalBlockInput(block, 0, targetItem, "laser")).toLowerCase();
          SoundEngine.playSoundEffect(soundName);
          await this.sleep(16);
          break;
        }
        case "stop_all_sounds": {
          if (SoundEngine.audioCtx) SoundEngine.audioCtx.suspend().then(() => SoundEngine.audioCtx.resume());
          await this.sleep(16);
          break;
        }
        case "change_volume": {
          await this.sleep(16);
          break;
        }

        // ================= CONTROL =================
        case "wait_secs": {
          const secs = Math.max(0.01, Number(this.evalBlockInput(block, 0, targetItem, 1)) || 1);
          await this.sleep(secs * 1000);
          break;
        }
        case "repeat": {
          const times = Math.max(0, Math.floor(Number(this.evalBlockInput(block, 0, targetItem, 10)) || 10));
          const childId = block.childId;
          if (childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === childId);
            for (let i = 0; i < times && this.isRunning; i++) {
              if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              await this.sleep(16);
            }
          } else {
            await this.sleep(16);
          }
          break;
        }
        case "forever": {
          const childId = block.childId;
          if (childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === childId);
            while (this.isRunning) {
              if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              await this.sleep(16);
            }
          } else {
            while (this.isRunning) {
              await this.sleep(50);
            }
          }
          break;
        }
        case "if_then": {
          let isTrue = false;
          if (block.conditionBlock) {
            isTrue = this.evaluateConditionBlock(block.conditionBlock, targetItem);
          } else {
            const condRaw = String(this.evalBlockInput(block, 0, targetItem, "touching edge"));
            isTrue = this.evaluateCondition(condRaw, targetItem);
          }
          if (isTrue && block.childId) {
            const scripts = AppModeController.getCurrentScripts();
            const childBlock = scripts.find(b => b.id === block.childId);
            if (childBlock) await this.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
          }
          await this.sleep(16);
          break;
        }
        case "if_else": {
          let isTrue = false;
          if (block.conditionBlock) {
            isTrue = this.evaluateConditionBlock(block.conditionBlock, targetItem);
          } else {
            const condRaw = String(this.evalBlockInput(block, 0, targetItem, "touching edge"));
            isTrue = this.evaluateCondition(condRaw, targetItem);
          }
          const scripts = AppModeController.getCurrentScripts();
          if (isTrue && block.childId_if) {
            const childIf = scripts.find(b => b.id === block.childId_if);
            if (childIf) await this.runScriptThread(childIf, targetItem, targetItem ? targetItem.id : "global_stage");
          } else if (!isTrue && block.childId_else) {
            const childElse = scripts.find(b => b.id === block.childId_else);
            if (childElse) await this.runScriptThread(childElse, targetItem, targetItem ? targetItem.id : "global_stage");
          }
          await this.sleep(16);
          break;
        }
        case "set_playable_char": {
          const chosen = String(this.evalBlockInput(block, 0, targetItem, "this sprite"));
          if (typeof GamePlayerEngine !== "undefined") {
            if (chosen === "this sprite" || !chosen) {
              if (targetItem) GamePlayerEngine.setPlayableCharacter(targetItem.id);
            } else if (chosen === "None" || chosen === "none") {
              GamePlayerEngine.setPlayableCharacter(null);
            } else {
              GamePlayerEngine.setPlayableCharacter(chosen);
            }
          }
          await this.sleep(16);
          break;
        }
        case "set_player_control": {
          const modeVal = String(this.evalBlockInput(block, 0, targetItem, "enabled"));
          if (typeof GamePlayerEngine !== "undefined") {
            GamePlayerEngine.setPlayerControlEnabled(modeVal.toLowerCase() === "enabled");
          }
          await this.sleep(16);
          break;
        }
        case "stop_all": {
          this.stopAll();
          break;
        }

        // ================= VARIABLES =================
        case "set_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          const val = this.evalBlockInput(block, 1, targetItem, 0);
          VariableManager.setVariable(varName, val, targetItem ? targetItem.id : null);
          await this.sleep(16);
          break;
        }
        case "change_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          const delta = this.evalBlockInput(block, 1, targetItem, 1);
          VariableManager.changeVariable(varName, delta, targetItem ? targetItem.id : null);
          await this.sleep(16);
          break;
        }
        case "show_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          VariableManager.toggleWatcher(varName, true);
          await this.sleep(16);
          break;
        }
        case "hide_var": {
          const varName = String(this.evalBlockInput(block, 0, targetItem, "score"));
          VariableManager.toggleWatcher(varName, false);
          await this.sleep(16);
          break;
        }

        // ================= EVENTS =================
        case "broadcast": {
          const msg = String(this.evalBlockInput(block, 0, targetItem, "message1"));
          this.broadcast(msg);
          await this.sleep(16);
          break;
        }

        default:
          await this.sleep(16);
      }
    } finally {
      if (blockEl) blockEl.classList.remove("executing-halo");
    }
  },

  getBlockInput(block, index = 0) {
    const el = AppModeController.getBlockElement(block.id);
    if (el) {
      const inputs = el.querySelectorAll(".code-block-input, .code-block-select");
      if (inputs && inputs[index]) {
        return inputs[index].value || inputs[index].textContent.trim();
      }
    }
    if (block.inputs && block.inputs[index] !== undefined) {
      return block.inputs[index];
    }
    return null;
  },

  evalBlockInput(block, index, targetItem, fallback = "") {
    const raw = this.getBlockInput(block, index);
    if (raw === null || raw === undefined || raw === "") return fallback;
    const trimmed = String(raw).trim();

    const v = VariableManager.getVariable(trimmed, targetItem ? targetItem.id : null);
    if (v) return v.value;

    return trimmed;
  },

  checkOverlap(a, b) {
    if (!a || !b) return false;
    const pad = 2;
    return (
      a.x < b.x + b.w - pad &&
      a.x + a.w > b.x + pad &&
      a.y < b.y + b.h - pad &&
      a.y + a.h > b.y + pad
    );
  },

  evaluateCondition(conditionStr, targetItem) {
    const cond = (conditionStr || "").trim();
    const condLower = cond.toLowerCase();
    if (condLower === "true" || condLower === "") return true;
    if (condLower === "false") return false;

    // Mobile sensing
    if (condLower.includes("is mobile") || condLower.includes("mobile device")) {
      return typeof MobileControlsManager !== "undefined" ? MobileControlsManager.isMobile() : false;
    }

    // Playable hero sensing
    if (condLower.includes("is playable") || condLower.includes("playable hero")) {
      if (typeof GamePlayerEngine !== "undefined" && targetItem) {
        return GamePlayerEngine.activePlayableId === targetItem.id;
      }
      return targetItem ? !!targetItem.isPlayable : false;
    }

    // Mouse down sensing
    if (condLower.includes("mouse down") || condLower === "mouse down?") {
      return (typeof mouseIsPressed !== "undefined" && mouseIsPressed) ||
             (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isMouseDown);
    }

    // Key pressed sensing
    if (condLower.includes("key") && condLower.includes("pressed")) {
      const matchKey = condLower.match(/key\s*\[?([a-zA-Z0-9_\s-]+)\]?\s*pressed/);
      let keyName = matchKey ? matchKey[1].trim() : "space";
      if (keyName === "space") {
        return (typeof isSpacePressed !== "undefined" && isSpacePressed) ||
               (typeof keyIsDown !== "undefined" && keyIsDown(32)) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.[" "] || GamePlayerEngine.keysPressed?.["space"]));
      }
      if (keyName === "up arrow" || keyName === "up") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(38) || keyIsDown(87))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowUp"] || GamePlayerEngine.keysPressed?.["w"] || GamePlayerEngine.keysPressed?.["W"]));
      }
      if (keyName === "down arrow" || keyName === "down") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(40) || keyIsDown(83))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowDown"] || GamePlayerEngine.keysPressed?.["s"] || GamePlayerEngine.keysPressed?.["S"]));
      }
      if (keyName === "left arrow" || keyName === "left") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(37) || keyIsDown(65))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowLeft"] || GamePlayerEngine.keysPressed?.["a"] || GamePlayerEngine.keysPressed?.["A"]));
      }
      if (keyName === "right arrow" || keyName === "right") {
        return (typeof keyIsDown !== "undefined" && (keyIsDown(39) || keyIsDown(68))) ||
               (typeof GamePlayerEngine !== "undefined" && (GamePlayerEngine.keysPressed?.["ArrowRight"] || GamePlayerEngine.keysPressed?.["d"] || GamePlayerEngine.keysPressed?.["D"]));
      }
      if (keyName === "any") {
        return (typeof keyIsPressed !== "undefined" && keyIsPressed) ||
               (typeof GamePlayerEngine !== "undefined" && Object.values(GamePlayerEngine.keysPressed || {}).some(Boolean));
      }
    }

    // Touching sensing
    if (condLower.startsWith("touching") || condLower.includes("touching")) {
      if (!targetItem) return false;
      const targetSpec = condLower.replace(/^touching\s*/, "").replace(/\?$/, "").replace(/[\[\]]/g, "").trim();

      if (targetSpec === "edge") {
        return targetItem.x <= 10 || targetItem.x + targetItem.w >= WorldConfig.worldWidth - 10 ||
               targetItem.y <= 10 || targetItem.y + targetItem.h >= WorldConfig.worldHeight - 10;
      }

      if (targetSpec === "mouse-pointer" || targetSpec === "mouse") {
        const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
        const my = (typeof mouseY !== "undefined" ? mouseY : 0);
        const wx = (mx - WorldConfig.panX) / WorldConfig.zoom;
        const wy = (my - WorldConfig.panY) / WorldConfig.zoom;
        return wx >= targetItem.x && wx <= targetItem.x + targetItem.w &&
               wy >= targetItem.y && wy <= targetItem.y + targetItem.h;
      }

      if (targetSpec === "solid" || targetSpec === "solid object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden || !other.isSolid) return false;
          return this.checkOverlap(targetItem, other);
        });
      }

      if (targetSpec === "hero") {
        let hero = null;
        if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem) {
          hero = GamePlayerEngine.getActivePlayableItem();
        }
        if (!hero && typeof WorldObjectsManager !== "undefined") {
          hero = WorldObjectsManager.items.find(it => it.isPlayable);
        }
        if (hero && hero.id !== targetItem.id) {
          return this.checkOverlap(targetItem, hero);
        }
        return false;
      }

      if (targetSpec === "any" || targetSpec === "any object") {
        if (typeof WorldObjectsManager === "undefined") return false;
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden) return false;
          return this.checkOverlap(targetItem, other);
        });
      }

      // Check specific object name or id
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
        return WorldObjectsManager.items.some(other => {
          if (other.id === targetItem.id || other.hidden) return false;
          const otherName = (other.name || "").toLowerCase();
          if (other.id === targetSpec || otherName === targetSpec || otherName.includes(targetSpec) || targetSpec.includes(otherName)) {
            return this.checkOverlap(targetItem, other);
          }
          return false;
        });
      }
    }

    // Distance to sensing
    if (condLower.startsWith("distance to") || condLower.includes("distance to")) {
      if (!targetItem) return false;
      const matchDist = condLower.match(/distance\s*to\s*\[?([a-zA-Z0-9_\s-]+)\]?\s*(<|>|<=|>=|==|=)\s*(\d+)/);
      if (matchDist) {
        const targetSpec = matchDist[1].trim();
        const op = matchDist[2];
        const threshold = Number(matchDist[3]);

        let otherX = 0, otherY = 0, found = false;
        if (targetSpec === "mouse-pointer" || targetSpec === "mouse") {
          const mx = (typeof mouseX !== "undefined" ? mouseX : 0);
          const my = (typeof mouseY !== "undefined" ? mouseY : 0);
          otherX = (mx - WorldConfig.panX) / WorldConfig.zoom;
          otherY = (my - WorldConfig.panY) / WorldConfig.zoom;
          found = true;
        } else if (targetSpec === "hero") {
          let hero = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.getActivePlayableItem()) ||
                     (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items.find(it => it.isPlayable));
          if (hero && hero.id !== targetItem.id) {
            otherX = hero.x + hero.w / 2;
            otherY = hero.y + hero.h / 2;
            found = true;
          }
        } else if (typeof WorldObjectsManager !== "undefined") {
          const other = WorldObjectsManager.items.find(it => it.id !== targetItem.id && (it.id === targetSpec || (it.name && it.name.toLowerCase().includes(targetSpec))));
          if (other) {
            otherX = other.x + other.w / 2;
            otherY = other.y + other.h / 2;
            found = true;
          }
        }

        if (found) {
          const cx = targetItem.x + targetItem.w / 2;
          const cy = targetItem.y + targetItem.h / 2;
          const dist = Math.hypot(cx - otherX, cy - otherY);
          if (op === "<") return dist < threshold;
          if (op === ">") return dist > threshold;
          if (op === "<=") return dist <= threshold;
          if (op === ">=") return dist >= threshold;
          if (op === "==" || op === "=") return Math.abs(dist - threshold) < 5;
        }
      }
    }

    const match = cond.match(/^([a-zA-Z0-9_-]+)\s*(>|<|>=|<=|==|=)\s*([a-zA-Z0-9_.-]+)$/);
    if (match) {
      const leftVal = this.resolveValue(match[1], targetItem);
      const op = match[2];
      const rightVal = this.resolveValue(match[3], targetItem);

      const lNum = Number(leftVal);
      const rNum = Number(rightVal);

      if (!isNaN(lNum) && !isNaN(rNum)) {
        if (op === ">") return lNum > rNum;
        if (op === "<") return lNum < rNum;
        if (op === ">=") return lNum >= rNum;
        if (op === "<=") return lNum <= rNum;
        if (op === "==" || op === "=") return lNum === rNum;
      } else {
        if (op === "==" || op === "=") return String(leftVal) === String(rightVal);
      }
    }

    return true;
  },

  evaluateConditionBlock(condBlock, targetItem) {
    if (!condBlock) return false;
    const bid = condBlock.blockId || condBlock.id;
    const inputs = condBlock.inputs || [];

    // 1. SENSING BOOLEANS
    if (bid === "touching_object") {
      const target = inputs[0] || "edge";
      return this.evaluateCondition(`touching ${target}`, targetItem);
    }
    if (bid === "touching_solid") {
      return this.evaluateCondition("touching solid", targetItem);
    }
    if (bid === "distance_to_object") {
      const target = inputs[0] || "hero";
      const dist = inputs[1] || 50;
      return this.evaluateCondition(`distance to ${target} < ${dist}`, targetItem);
    }
    if (bid === "key_pressed_check") {
      const keyName = inputs[0] || "space";
      return this.evaluateCondition(`key ${keyName} pressed`, targetItem);
    }
    if (bid === "mouse_down_check") {
      return this.evaluateCondition("mouse down", targetItem);
    }
    if (bid === "is_mobile_sensing") {
      return this.evaluateCondition("is mobile", targetItem);
    }
    if (bid === "is_playable_sensing") {
      return this.evaluateCondition("is playable", targetItem);
    }

    // 2. LOGICAL OPERATOR BOOLEANS (and, or, not)
    if (bid === "op_and" || condBlock.opType === "and") {
      const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
      const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
      return leftVal && rightVal;
    }
    if (bid === "op_or" || condBlock.opType === "or") {
      const leftVal = condBlock.leftConditionBlock ? this.evaluateConditionBlock(condBlock.leftConditionBlock, targetItem) : false;
      const rightVal = condBlock.rightConditionBlock ? this.evaluateConditionBlock(condBlock.rightConditionBlock, targetItem) : false;
      return leftVal || rightVal;
    }
    if (bid === "op_not" || condBlock.opType === "not") {
      const innerVal = condBlock.conditionBlock ? this.evaluateConditionBlock(condBlock.conditionBlock, targetItem) : false;
      return !innerVal;
    }

    // 3. COMPARISON OPERATOR BOOLEANS (>, <, =, contains)
    if (bid === "op_gt" || condBlock.opType === ">") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
      return l > r;
    }
    if (bid === "op_lt" || condBlock.opType === "<") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem)) || 0;
      return l < r;
    }
    if (bid === "op_eq" || condBlock.opType === "=") {
      const l = this.resolveValue(inputs[0] !== undefined ? inputs[0] : "", targetItem);
      const r = this.resolveValue(inputs[1] !== undefined ? inputs[1] : 50, targetItem);
      return String(l) === String(r);
    }
    if (bid === "op_contains" || condBlock.opType === "contains") {
      const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "a", targetItem));
      return l.includes(r);
    }

    const fallbackCond = inputs[0] || condBlock.name || "true";
    return this.evaluateCondition(fallbackCond, targetItem);
  },

  evaluateReporterBlock(repBlock, targetItem) {
    if (!repBlock) return 0;
    const bid = repBlock.blockId || repBlock.id;
    const inputs = repBlock.inputs || [];

    if (bid === "op_add" || repBlock.opType === "+") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l + r;
    }
    if (bid === "op_subtract" || repBlock.opType === "-") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l - r;
    }
    if (bid === "op_multiply" || repBlock.opType === "*") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 0, targetItem)) || 0;
      return l * r;
    }
    if (bid === "op_divide" || repBlock.opType === "/") {
      const l = Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 0, targetItem)) || 0;
      const r = Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 1, targetItem)) || 0;
      return r !== 0 ? l / r : 0;
    }
    if (bid === "op_random" || repBlock.isRandom) {
      const min = Math.ceil(Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1);
      const max = Math.floor(Number(this.resolveValue(inputs[1] !== undefined ? inputs[1] : 10, targetItem)) || 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    if (bid === "op_join") {
      const l = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      const r = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "banana", targetItem));
      return l + r;
    }
    if (bid === "op_letter_of") {
      const idx = (Number(this.resolveValue(inputs[0] !== undefined ? inputs[0] : 1, targetItem)) || 1) - 1;
      const str = String(this.resolveValue(inputs[1] !== undefined ? inputs[1] : "apple", targetItem));
      return str[idx] || "";
    }
    if (bid === "op_length_of") {
      const str = String(this.resolveValue(inputs[0] !== undefined ? inputs[0] : "apple", targetItem));
      return str.length;
    }

    return 0;
  },

  resolveValue(identifier, targetItem) {
    if (identifier === null || identifier === undefined) return "";
    if (typeof identifier === "object" && identifier.isReporter) {
      return this.evaluateReporterBlock(identifier, targetItem);
    }
    const str = String(identifier).trim();
    if (targetItem) {
      if (str === "x position" || str === "x") return targetItem.x;
      if (str === "y position" || str === "y") return targetItem.y;
      if (str === "width") return targetItem.w;
      if (str === "height") return targetItem.h;
      if (str === "direction") return targetItem.rotation || 0;
      if (str === "size") return targetItem.scale || 100;
    }
    const v = typeof VariableManager !== "undefined" ? VariableManager.getVariable(str, targetItem ? targetItem.id : null) : null;
    if (v !== null && v !== undefined) return v.value;
    const num = Number(str);
    if (!isNaN(num) && str !== "") return num;
    return str;
  }
};

// ============================================================================
// 10B. U5 COMPILER & COMPRESSION ENGINE (UNIFIVE Creative Package)
// ============================================================================
const U5Compiler = {
  isCompiling: false,
  isLoading: false,

  init() {
    // 1. Unified Header File Dropdown (SAVE & LOAD)
    const btnFileMenu = document.getElementById("btn-file-menu");
    const fileDropdownMenu = document.getElementById("file-dropdown-menu");
    const btnFileSaveU5 = document.getElementById("btn-file-save-u5");
    const btnFileExportPng = document.getElementById("btn-file-export-png");
    const btnFileLoadPreset = document.getElementById("btn-file-load-preset");
    const btnFileLoadFile = document.getElementById("btn-file-load-file");
    const inputLoad = document.getElementById("input-load-u5");

    const toggleFileMenu = (show = null) => {
      if (!fileDropdownMenu) return;
      const willShow = show !== null ? show : fileDropdownMenu.style.display === "none";
      fileDropdownMenu.style.display = willShow ? "flex" : "none";
      if (btnFileMenu) btnFileMenu.classList.toggle("active", willShow);
      if (willShow) SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
    };

    if (btnFileMenu) {
      btnFileMenu.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu();
      });
    }

    if (btnFileSaveU5) {
      btnFileSaveU5.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        this.openExportModal();
      });
    }

    if (btnFileExportPng) {
      btnFileExportPng.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        if (typeof saveWorkspace === "function") saveWorkspace();
      });
    }

    if (btnFileLoadPreset) {
      btnFileLoadPreset.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        this.openPresetsModal();
      });
    }

    if (btnFileLoadFile) {
      btnFileLoadFile.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFileMenu(false);
        if (inputLoad) inputLoad.click();
      });
    }

    // Close file dropdown when clicking outside
    window.addEventListener("click", (e) => {
      if (fileDropdownMenu && fileDropdownMenu.style.display !== "none") {
        if (!e.target.closest("#file-dropdown-wrapper")) {
          toggleFileMenu(false);
        }
      }
    });

    // 2. Config Tab Compile, Load & Presets Buttons
    const btnCfgExport = document.getElementById("btn-cfg-export-u5");
    const btnCfgImport = document.getElementById("btn-cfg-import-u5");
    const btnCfgPreset = document.getElementById("btn-cfg-load-preset");

    if (btnCfgExport) {
      btnCfgExport.addEventListener("click", () => this.openExportModal());
    }
    if (btnCfgImport) {
      btnCfgImport.addEventListener("click", () => {
        if (inputLoad) inputLoad.click();
      });
    }
    if (btnCfgPreset) {
      btnCfgPreset.addEventListener("click", () => this.openPresetsModal());
    }

    // 3. Presets Browser Modal Controls
    const btnClosePresets = document.getElementById("btn-close-presets-modal");
    const btnCancelPresets = document.getElementById("btn-cancel-presets-modal");
    if (btnClosePresets) btnClosePresets.addEventListener("click", () => this.closePresetsModal());
    if (btnCancelPresets) btnCancelPresets.addEventListener("click", () => this.closePresetsModal());

    // 4. Export Modal Controls
    const modalExport = document.getElementById("modal-export-u5");
    const btnCloseModal = document.getElementById("btn-close-export-modal");
    const btnCancelModal = document.getElementById("btn-cancel-export-modal");
    const btnConfirmExport = document.getElementById("btn-confirm-export-u5");
    const inputTitle = document.getElementById("input-export-title");
    const inputAuthor = document.getElementById("input-export-author");
    const inputVersion = document.getElementById("input-export-version");
    const inputDesc = document.getElementById("input-export-desc");

    if (btnCloseModal) btnCloseModal.addEventListener("click", () => this.closeExportModal());
    if (btnCancelModal) btnCancelModal.addEventListener("click", () => this.closeExportModal());
    if (btnConfirmExport) {
      btnConfirmExport.addEventListener("click", () => {
        const metadata = {
          title: (inputTitle && inputTitle.value.trim()) || "My_Project",
          author: (inputAuthor && inputAuthor.value.trim()) || "Player",
          version: (inputVersion && inputVersion.value.trim()) || "1.0.0",
          description: (inputDesc && inputDesc.value.trim()) || ""
        };
        this.compileWithWorker(metadata);
      });
    }

    if (inputTitle) {
      inputTitle.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          if (btnConfirmExport) btnConfirmExport.click();
        }
        if (e.key === "Escape") this.closeExportModal();
      });
    }

    // 4. Hidden File Input Change
    if (inputLoad) {
      inputLoad.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          this.decompressAndLoad(file);
          inputLoad.value = ""; // Reset for re-selection
        }
      });
    }

    // 5. Drag & Drop .u5 File onto Window
    window.addEventListener("dragover", (e) => {
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes("Files")) {
        e.preventDefault();
      }
    });

    window.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith(".u5") || file.name.toLowerCase().endsWith(".json")) {
          e.preventDefault();
          this.decompressAndLoad(file);
        }
      }
    });

    // 6. Prompt user before page refresh or tab close if they have unsaved changes
    window.addEventListener("beforeunload", (e) => {
      const hasItems = typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items && WorldObjectsManager.items.length > 0;
      let hasScripts = false;
      if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
        hasScripts = Object.values(AppModeController.objectScripts).some(list => Array.isArray(list) && list.length > 0);
      }

      if (hasItems || hasScripts) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes! Make sure to export your work before closing.";
        return e.returnValue;
      }
    });

    this.updateStats();
  },

  openExportModal() {
    if (this.isCompiling) return;
    const modal = document.getElementById("modal-export-u5");
    const previewImg = document.getElementById("export-preview-img");
    const inputTitle = document.getElementById("input-export-title");
    const inputAuthor = document.getElementById("input-export-author");
    const inputVersion = document.getElementById("input-export-version");
    const workerStatus = document.getElementById("export-worker-status");
    const btnConfirm = document.getElementById("btn-confirm-export-u5");

    // Live Snapshot Thumbnail
    const thumbUrl = this.getCanvasThumbnailDataUrl(220, 136);
    if (previewImg && thumbUrl) {
      previewImg.src = thumbUrl;
    }

    // Meta Badges
    const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
    const metaPersp = document.getElementById("export-meta-perspective");
    const metaLayers = document.getElementById("export-meta-layers");
    const metaScripts = document.getElementById("export-meta-scripts");
    const metaWorld = document.getElementById("export-meta-world");

    const layerCount = WorldObjectsManager.items.length;
    let blockCount = 0;
    if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
      Object.values(AppModeController.objectScripts).forEach(list => {
        if (Array.isArray(list)) blockCount += list.length;
      });
    }

    if (metaPersp) metaPersp.innerHTML = `<i class="ph ph-compass"></i><span>${activeView === "topdown" ? "TOP-DOWN" : "SIDE-FACING"}</span>`;
    if (metaLayers) metaLayers.innerHTML = `<i class="ph ph-stack"></i><span>${layerCount} ${layerCount === 1 ? "LAYER" : "LAYERS"}</span>`;
    if (metaScripts) metaScripts.innerHTML = `<i class="ph ph-code"></i><span>${blockCount} ${blockCount === 1 ? "SCRIPT BLOCK" : "SCRIPT BLOCKS"}</span>`;
    if (metaWorld) metaWorld.innerHTML = `<i class="ph ph-bounding-box"></i><span>${WorldConfig.worldWidth} × ${WorldConfig.worldHeight}</span>`;

    // Populate default title if empty
    if (inputTitle && (!inputTitle.value || inputTitle.value.startsWith("Project_"))) {
      const timeTag = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
      inputTitle.value = `Project_${activeView}_${timeTag}`;
    }

    if (inputAuthor && !inputAuthor.value) {
      inputAuthor.value = "PixelMaster";
    }

    if (inputVersion && !inputVersion.value) {
      inputVersion.value = "1.0.0";
    }

    if (workerStatus) workerStatus.style.display = "none";
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>EXPORT .U5</span>';
    }

    if (modal) modal.style.display = "flex";
    if (inputTitle) {
      setTimeout(() => {
        inputTitle.focus();
        inputTitle.select();
      }, 50);
    }

    SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
  },

  closeExportModal() {
    if (this.isCompiling) return;
    const modal = document.getElementById("modal-export-u5");
    if (modal) modal.style.display = "none";
  },

  async openPresetsModal() {
    const modal = document.getElementById("modal-presets-browser");
    const gridEl = document.getElementById("presets-cards-grid");
    const statusEl = document.getElementById("presets-loading-status");
    if (!modal) return;

    modal.style.display = "flex";
    if (statusEl) statusEl.style.display = "none";
    SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);

    if (gridEl) {
      gridEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--gold-bright); font-family: var(--font-pixel);"><i class="ph ph-spinner ph-spin"></i> Loading presets catalog...</div>';

      let presetsList = [];
      try {
        let resp = await fetch("assets/presets/index.json");
        if (!resp.ok) resp = await fetch("../assets/presets/index.json");
        if (resp.ok) {
          const indexData = await resp.json();
          presetsList = indexData.presets || [];
        }
      } catch (e) {
        console.warn("Could not fetch assets/presets/index.json:", e);
      }

      if (!presetsList || presetsList.length === 0) {
        presetsList = [
          {
            id: "sidefacing_metropolis_quest",
            name: "Cyberpunk Metropolis Quest",
            perspective: "sidefacing",
            file: "assets/presets/sidefacing_metropolis_quest.json",
            thumbnail: "assets/sidefacing-assets/city-backgrounds/city_1_layer2_distant_skyline.png",
            author: "Paul Peter (@asterixh)",
            assetCount: 68,
            description: "A sprawling 3840x2160 cyberpunk city platformer preset with parallax towers, street traffic, vendors, police enforcers, and animated fantasy heroes."
          }
        ];
      }

      gridEl.innerHTML = "";
      presetsList.forEach(preset => {
        const card = document.createElement("div");
        card.className = "preset-card";
        const isSide = preset.perspective === "sidefacing";

        card.innerHTML = `
          <div class="preset-thumb-wrap">
            <img src="${preset.thumbnail || 'favicon-32x32.png'}" alt="${preset.name}" class="preset-thumb-img" onerror="this.src='favicon-32x32.png'" />
            <span class="preset-badge-tag">${isSide ? 'SIDE' : 'TOP'}</span>
          </div>
          <div class="preset-card-content">
            <span class="preset-card-title">${preset.name}</span>
            <span class="preset-card-desc">${preset.description || 'Pre-configured world template with multi-layered assets.'}</span>
            <div class="preset-card-pills">
              <span class="preset-pill"><i class="ph ph-stack"></i> ${preset.assetCount || 68} Assets</span>
              <span class="preset-pill"><i class="ph ph-compass"></i> ${isSide ? 'Side-Facing' : 'Top-Down'}</span>
              <span class="preset-pill"><i class="ph ph-user"></i> ${preset.author || 'Paul Peter'}</span>
            </div>
          </div>
          <button class="btn btn-pixel btn-load-preset" data-preset-file="${preset.file}">
            <i class="ph ph-rocket-launch"></i>
            <span>LOAD PRESET</span>
          </button>
        `;

        const btnLoad = card.querySelector(".btn-load-preset");
        if (btnLoad) {
          btnLoad.addEventListener("click", () => {
            this.loadPresetFile(preset.file || "assets/presets/sidefacing_metropolis_quest.json");
          });
        }

        gridEl.appendChild(card);
      });
    }
  },

  closePresetsModal() {
    const modal = document.getElementById("modal-presets-browser");
    if (modal) modal.style.display = "none";
  },

  async loadPresetFile(presetFilePath) {
    const statusEl = document.getElementById("presets-loading-status");
    const statusText = document.getElementById("presets-loading-text");
    if (statusEl) statusEl.style.display = "flex";
    if (statusText) statusText.textContent = "Fetching preset scene data...";
    SoundEngine.playAction("save");

    try {
      let resp = await fetch(presetFilePath);
      if (!resp.ok) resp = await fetch("../" + presetFilePath);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();

      if (statusText) statusText.textContent = "Unpacking layers & code scripts...";
      await this.decompressAndLoad(blob);
      this.closePresetsModal();
      SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
      setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.15, 0.2), 80);
    } catch (err) {
      console.error("Failed to load preset:", err);
      alert("Failed to load preset: " + err.message);
      if (statusEl) statusEl.style.display = "none";
    }
  },

  updateStats(customSizeText = null) {
    const statsText = document.getElementById("u5-stats-text");
    if (!statsText) return;

    const layerCount = WorldObjectsManager.items.length;
    let blockCount = 0;
    if (typeof AppModeController !== "undefined" && AppModeController.objectScripts) {
      Object.values(AppModeController.objectScripts).forEach(list => {
        if (Array.isArray(list)) blockCount += list.length;
      });
    }

    if (customSizeText) {
      statsText.textContent = `${layerCount} ${layerCount === 1 ? "Layer" : "Layers"} • ${blockCount} ${blockCount === 1 ? "Script Block" : "Script Blocks"} • ${customSizeText}`;
    } else {
      statsText.textContent = `${layerCount} ${layerCount === 1 ? "Layer" : "Layers"} • ${blockCount} ${blockCount === 1 ? "Script Block" : "Script Blocks"} • Standalone .U5`;
    }
  },

  async getImageDataUrl(src) {
    // 1. Try offscreen canvas extraction from cached p5.Image or Image element
    try {
      const entry = WorldObjectsManager.imageCache[src];
      let htmlImg = null;
      if (entry && entry.img) {
        if (entry.img.elt && entry.img.elt instanceof HTMLImageElement) {
          htmlImg = entry.img.elt;
        } else if (entry.img.canvas && entry.img.canvas instanceof HTMLCanvasElement) {
          return entry.img.canvas.toDataURL("image/png");
        }
      }

      if (htmlImg && htmlImg.complete && htmlImg.naturalWidth > 0) {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = htmlImg.naturalWidth;
        offCanvas.height = htmlImg.naturalHeight;
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(htmlImg, 0, 0);
        return offCanvas.toDataURL("image/png");
      }
    } catch (e) {
      console.warn("Direct canvas toDataURL extraction failed, falling back to fetch:", e);
    }

    // 2. Fetch as blob fallback
    try {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Could not bundle asset data URL for:", src, err);
      return null;
    }
  },

  async getAppIconDataUrl() {
    try {
      let resp = await fetch("icons/icon-128x128.png");
      if (!resp.ok) {
        resp = await fetch("../icons/icon-128x128.png");
      }
      if (resp.ok) {
        const blob = await resp.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    } catch (e) {}

    // Fallback: draw 32x32 pixel U5 icon directly on offscreen canvas
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#120308";
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = "#ad204d";
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);
      ctx.font = "bold 28px monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("U", 8, 44);
      ctx.fillStyle = "#fecc1b";
      ctx.fillText("5", 34, 44);
      return canvas.toDataURL("image/png");
    } catch (e) {
      return null;
    }
  },

  getCanvasThumbnailDataUrl(maxW = 320, maxH = 180) {
    try {
      if (mainCanvas && mainCanvas.elt) {
        const srcCanvas = mainCanvas.elt;
        const offCanvas = document.createElement("canvas");
        offCanvas.width = maxW;
        offCanvas.height = maxH;
        const ctx = offCanvas.getContext("2d");
        ctx.drawImage(srcCanvas, 0, 0, maxW, maxH);
        return offCanvas.toDataURL("image/png");
      }
    } catch (e) {
      console.warn("Could not generate canvas thumbnail:", e);
    }
    return null;
  },

  async compileWithWorker(customMeta = {}) {
    if (this.isCompiling) return;
    this.isCompiling = true;

    // Audio & UI Feedback
    SoundEngine.playAction("save");
    const btnHeader = document.getElementById("btn-export-u5");
    const btnCfg = document.getElementById("btn-cfg-export-u5");
    const workerStatus = document.getElementById("export-worker-status");
    const btnConfirm = document.getElementById("btn-confirm-export-u5");

    if (btnHeader) btnHeader.classList.add("btn-loading");
    if (btnCfg) {
      btnCfg.disabled = true;
      btnCfg.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>COMPILING...</span>';
    }
    if (workerStatus) workerStatus.style.display = "flex";
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>PACKAGING...</span>';
    }

    try {
      // 1. App Icon & Scene Thumbnail
      const appIcon = await this.getAppIconDataUrl();
      const thumbnail = this.getCanvasThumbnailDataUrl(320, 180);

      // 2. Collect Full Metadata
      const activeView = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
      const metadata = {
        title: customMeta.title || `Project_${activeView}`,
        author: customMeta.author || "Player",
        version: customMeta.version || "1.0.0",
        description: customMeta.description || "",
        perspective: activeView,
        generator: "UNIFIVE Studio v2.0",
        timestamp: Date.now(),
        exportedAt: new Date().toISOString(),
        icon: appIcon,
        thumbnail: thumbnail
      };

      // 3. Collect World Config
      const worldConfig = {
        worldWidth: WorldConfig.worldWidth || 2000,
        worldHeight: WorldConfig.worldHeight || 1500,
        bgColor: WorldConfig.bgColor || "#ffffff",
        panX: WorldConfig.panX || 1000,
        panY: WorldConfig.panY || 750,
        zoom: WorldConfig.zoom || 1.0,
        minZoom: WorldConfig.minZoom || 0.15,
        maxZoom: WorldConfig.maxZoom || 4.0
      };

      // 4. Collect Placed Layers
      const layers = WorldObjectsManager.serialize();

      // 5. Find ONLY used assets and convert to base64 Data URLs
      const usedAssetPaths = new Set();
      layers.forEach(item => {
        if (item.src) usedAssetPaths.add(item.src);
        if (item.poses && typeof item.poses === "object") {
          Object.values(item.poses).forEach(pose => {
            if (typeof pose === "string") usedAssetPaths.add(pose);
            else if (pose && pose.sheet) usedAssetPaths.add(pose.sheet);
            else if (pose && Array.isArray(pose.frames)) {
              pose.frames.forEach(f => { if (typeof f === "string") usedAssetPaths.add(f); });
            }
          });
        }
      });

      const bundledAssets = {};
      const assetPromises = Array.from(usedAssetPaths).map(async (src) => {
        const dataUrl = await this.getImageDataUrl(src);
        if (dataUrl) {
          bundledAssets[src] = dataUrl;
        }
      });
      await Promise.all(assetPromises);

      // 6. Collect Code Scripts & Variables
      const code = {
        objectScripts: (typeof AppModeController !== "undefined" && AppModeController.objectScripts) ? JSON.parse(JSON.stringify(AppModeController.objectScripts)) : {},
        variables: (typeof VariableManager !== "undefined" && VariableManager.variables) ? JSON.parse(JSON.stringify(VariableManager.variables)) : []
      };

      // 7. Assemble Full Payload (With Embedded Icon & Thumbnail)
      const payload = {
        format: "UNIFIVE_U5",
        version: "1.0.0",
        timestamp: Date.now(),
        icon: appIcon,
        thumbnail: thumbnail,
        metadata,
        worldConfig,
        layers,
        bundledAssets,
        code
      };

      // 8. Execute Background Worker for Serialization & Compression
      await new Promise((resolve, reject) => {
        const workerCode = `
          self.onmessage = async function(e) {
            const { type, payload } = e.data;
            if (type === 'COMPILE_U5') {
              try {
                const jsonStr = JSON.stringify(payload);
                const uint8 = new TextEncoder().encode(jsonStr);
                let finalBuffer;
                let isGzipped = false;

                if (typeof CompressionStream !== 'undefined') {
                  try {
                    const cs = new CompressionStream('gzip');
                    const writer = cs.writable.getWriter();
                    writer.write(uint8);
                    writer.close();
                    const resp = new Response(cs.readable);
                    const ab = await resp.arrayBuffer();
                    finalBuffer = ab;
                    isGzipped = true;
                  } catch (compErr) {
                    finalBuffer = uint8.buffer;
                  }
                } else {
                  finalBuffer = uint8.buffer;
                }

                self.postMessage({ success: true, buffer: finalBuffer, isGzipped: isGzipped }, [finalBuffer]);
              } catch (err) {
                self.postMessage({ success: false, error: err.message });
              }
            }
          };
        `;

        const workerBlob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (e) => {
          const { success, buffer, isGzipped, error } = e.data;
          worker.terminate();
          URL.revokeObjectURL(workerUrl);

          if (!success) {
            return reject(new Error(error || "Worker compilation failed"));
          }

          const finalBlob = new Blob([buffer], { type: "application/octet-stream" });
          const formattedSize = finalBlob.size > 1048576 
            ? (finalBlob.size / 1048576).toFixed(2) + " MB" 
            : (finalBlob.size / 1024).toFixed(1) + " KB";

          const cleanTitle = (metadata.title || `Project_${activeView}`).replace(/[^a-zA-Z0-9_-]/g, "_");
          const filename = `${cleanTitle}.u5`;

          const downloadUrl = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);

          this.updateStats(`${formattedSize} (${isGzipped ? "Compressed" : "Raw"})`);
          SoundEngine.playChiptuneTone(1046, "triangle", 0.1, 0.2);
          setTimeout(() => SoundEngine.playChiptuneTone(1318, "triangle", 0.12, 0.2), 80);

          resolve();
        };

        worker.onerror = (err) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          reject(err);
        };

        worker.postMessage({ type: "COMPILE_U5", payload: payload });
      });

    } catch (err) {
      console.error("Worker compilation failed:", err);
      alert("Project compilation failed: " + err.message);
    } finally {
      this.isCompiling = false;
      if (btnHeader) btnHeader.classList.remove("btn-loading");
      if (btnCfg) {
        btnCfg.disabled = false;
        btnCfg.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>COMPILE TO .U5</span>';
      }
      if (workerStatus) workerStatus.style.display = "none";
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.innerHTML = '<i class="ph ph-file-arrow-down"></i><span>EXPORT .U5</span>';
      }
      this.closeExportModal();
    }
  },

  async compileProject() {
    return this.openExportModal();
  },

  async decompressAndLoad(fileOrBlob) {
    if (this.isLoading) return;
    this.isLoading = true;

    const btnHeader = document.getElementById("btn-import-u5");
    const btnCfg = document.getElementById("btn-cfg-import-u5");
    if (btnHeader) btnHeader.classList.add("btn-loading");
    if (btnCfg) {
      btnCfg.disabled = true;
      btnCfg.innerHTML = '<i class="ph ph-spinner ph-spin"></i><span>OPENING...</span>';
    }

    try {
      const arrayBuffer = await fileOrBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let jsonStr;

      // 1. Attempt Decompression if GZIP magic header (0x1F 0x8B) is present
      const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
      if (isGzip && typeof DecompressionStream !== "undefined") {
        try {
          const ds = new DecompressionStream("gzip");
          const writer = ds.writable.getWriter();
          writer.write(bytes);
          writer.close();
          const decompressedBlob = await new Response(ds.readable).blob();
          jsonStr = await decompressedBlob.text();
        } catch (dsErr) {
          jsonStr = new TextDecoder().decode(arrayBuffer);
        }
      } else {
        jsonStr = new TextDecoder().decode(arrayBuffer);
      }

      // 2. Parse JSON
      const payload = JSON.parse(jsonStr);

      if (!payload || (payload.format !== "UNIFIVE_U5" && !payload.layers && !payload.worldConfig)) {
        throw new Error("Invalid .u5 file format. Missing UNIFIVE signature or layers.");
      }

      // 3. Perspective View Switch (if specified)
      if (payload.metadata && payload.metadata.perspective && typeof ViewController !== "undefined") {
        if (ViewController.currentView !== payload.metadata.perspective) {
          ViewController.setView(payload.metadata.perspective);
        }
      }

      // 4. Preload Bundled Assets into WorldObjectsManager.imageCache
      if (payload.bundledAssets && typeof payload.bundledAssets === "object") {
        const preloadPromises = Object.entries(payload.bundledAssets).map(([src, dataUrl]) => {
          return new Promise((resolve) => {
            if (typeof loadImage === "function") {
              loadImage(
                dataUrl,
                (p5Img) => {
                  WorldObjectsManager.imageCache[src] = {
                    img: p5Img,
                    loaded: true,
                    naturalW: p5Img.width || 320,
                    naturalH: p5Img.height || 180
                  };
                  resolve();
                },
                () => {
                  // Fallback HTML Image Element
                  const img = new Image();
                  img.onload = () => {
                    WorldObjectsManager.imageCache[src] = {
                      img: img,
                      loaded: true,
                      naturalW: img.naturalWidth || 320,
                      naturalH: img.naturalHeight || 180
                    };
                    resolve();
                  };
                  img.onerror = () => resolve();
                  img.src = dataUrl;
                }
              );
            } else {
              resolve();
            }
          });
        });
        await Promise.all(preloadPromises);
      }

      // 5. Restore World Config
      if (payload.worldConfig) {
        WorldConfig.worldWidth = payload.worldConfig.worldWidth || 2000;
        WorldConfig.worldHeight = payload.worldConfig.worldHeight || 1500;
        WorldConfig.bgColor = payload.worldConfig.bgColor || "#ffffff";
        WorldConfig.panX = payload.worldConfig.panX !== undefined ? payload.worldConfig.panX : (WorldConfig.worldWidth / 2);
        WorldConfig.panY = payload.worldConfig.panY !== undefined ? payload.worldConfig.panY : (WorldConfig.worldHeight / 2);
        WorldConfig.zoom = payload.worldConfig.zoom || 1.0;
        WorldConfig.clampPan();

        if (typeof ConfigController !== "undefined") {
          ConfigController.syncUIFromWorldConfig();
        }
      }

      // 6. Restore Layers (Stacking Order Preserved)
      if (Array.isArray(payload.layers)) {
        WorldObjectsManager.deserialize(payload.layers);
      }

      // 7. Restore Code Scripts & Variables
      const scriptsObj = (payload.code && payload.code.objectScripts) || payload.codeScripts || payload.objectScripts;
      if (scriptsObj && typeof AppModeController !== "undefined") {
        AppModeController.objectScripts = JSON.parse(JSON.stringify(scriptsObj));
      }

      if (typeof VariableManager !== "undefined") {
        const rawVars = (payload.code && payload.code.variables) || payload.variables;
        if (Array.isArray(rawVars)) {
          VariableManager.variables = rawVars;
        } else if (rawVars && typeof rawVars === "object") {
          VariableManager.variables = Object.entries(rawVars).map(([vName, vVal]) => ({
            id: "var_" + vName.toLowerCase().replace(/[^a-z0-9]/g, "_"),
            name: vName,
            scope: "global",
            targetId: null,
            value: Number(vVal) || vVal,
            showWatcher: true
          }));
        }
      }

      // 8. Refresh Views and Inspectors
      if (typeof LayersController !== "undefined") LayersController.update();
      if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
      if (typeof AppModeController !== "undefined") {
        AppModeController.renderObjectsList();
        AppModeController.updateTargetBadge();
        AppModeController.renderScriptsForActiveTarget();
      }

      WorldObjectsManager.saveHistory();
      this.updateStats();

      // Sound & Visual Confirmation
      SoundEngine.playAction("save");
      SoundEngine.playChiptuneTone(880, "square", 0.08, 0.15);
      setTimeout(() => SoundEngine.playChiptuneTone(1174, "square", 0.12, 0.18), 80);

    } catch (err) {
      console.error("Decompress & Load failed:", err);
      alert("Failed to load .u5 project: " + err.message);
    } finally {
      this.isLoading = false;
      if (btnHeader) btnHeader.classList.remove("btn-loading");
      if (btnCfg) {
        btnCfg.disabled = false;
        btnCfg.innerHTML = '<i class="ph ph-folder-open"></i><span>OPEN .U5 FILE</span>';
      }
    }
  }
};

// ============================================================================
// 11. P5.JS CANVAS LIFECYCLE & WORLD RENDERING
// ============================================================================
function setup() {
  // Initialize non-blocking background store (IndexedDB)
  AsyncSceneStore.init().then(() => {
    const activeView = ViewController.currentView || "sidefacing";
    AsyncSceneStore.loadSceneToActive(activeView);
  });

  WorldConfig.init();
  const dims = getStageDimensions();
  mainCanvas = createCanvas(dims.w, dims.h);
  WorldConfig.clampPan();
  
  const container = document.getElementById("canvas-container");
  if (container) {
    mainCanvas.parent("canvas-container");
  }
  // Crisp pixel rendering
  noSmooth();
  pixelDensity(1);

  initUIEventListeners();
  ViewController.init();
  MobileNavigationController.init();
  TabController.init();
  CreatePanelController.init();
  WorldObjectsManager.init();
  PropertiesController.init();
  LayersController.init();
  ConfigController.init();
  SpritePosesController.init();
  MouseToolController.init();
  SplitterController.init();
  AppModeController.init();
  VariableManager.init();
  CodeRuntimeEngine.init();
  U5Compiler.init();
  HistoryManager.updateUI();
  LayersController.update();

  // Mouse listeners on canvas
  const canvasEl = mainCanvas.elt;

  // Double Click: Enter Crop Mode on selected item
  canvasEl.addEventListener("dblclick", (e) => {
    if (MouseToolController.activeTool === "select" && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const cam = getActiveStageCamera();
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const hit = WorldObjectsManager.getItemAt(wx, wy);
      if (hit) {
        CropController.startCrop(hit.id);
      }
    }
  });

  canvasEl.addEventListener("mousedown", (e) => {
    const cam = getActiveStageCamera();

    // 0. GAME PLAYER Click-to-Broadcast / Touch Controls
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;
      PlayerInputManager.handleCanvasClick(wx, wy);
      return;
    }

    // 0. CROP MODE Interaction
    if (e.button === 0 && CropController.isActive && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem && selectedItem.id === CropController.targetItemId) {
        const target = CropController.getCropTransformTarget(selectedItem, wx, wy);
        if (target) {
          CropController.cropDragState.isDragging = true;
          CropController.cropDragState.handle = target.handle;
          CropController.cropDragState.startX = wx;
          CropController.cropDragState.startY = wy;
          CropController.cropDragState.startLx = target.lx;
          CropController.cropDragState.startLy = target.ly;
          CropController.cropDragState.startCrop = { ...selectedItem.crop };
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.06);
          return;
        }
      }
    }

    // 1. SELECT Tool: Transform Gizmo (Rotate / Resize / Move)
    if (e.button === 0 && MouseToolController.activeTool === "select" && !isSpacePressed) {
      const rect = canvasEl.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem) {
        const target = WorldObjectsManager.getTransformTarget(selectedItem, wx, wy);
        if (target) {
          if (target.mode === "locked_only") {
            SoundEngine.playChiptuneTone(320, "square", 0.05, 0.08);
            return;
          }

          const cx = selectedItem.x + selectedItem.w / 2;
          const cy = selectedItem.y + selectedItem.h / 2;

          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.mode = target.mode;
          WorldObjectsManager.dragState.handle = target.handle;
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = selectedItem.x;
          WorldObjectsManager.dragState.startItemY = selectedItem.y;
          WorldObjectsManager.dragState.startItemW = selectedItem.w;
          WorldObjectsManager.dragState.startItemH = selectedItem.h;
          WorldObjectsManager.dragState.anchorX = cx;
          WorldObjectsManager.dragState.anchorY = cy;
          WorldObjectsManager.dragState.initialAngle = selectedItem.rotation || 0;

          SoundEngine.playChiptuneTone(target.mode === "rotate" ? 640 : 540, "square", 0.05, 0.08);
          return;
        }
      }

      // If no gizmo handle hit, test all items in world
      const hit = WorldObjectsManager.getItemAt(wx, wy);
      if (hit) {
        WorldObjectsManager.selectItem(hit.id);
        const cx = hit.x + hit.w / 2;
        const cy = hit.y + hit.h / 2;

        if (!hit.locked) {
          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.mode = "move";
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = hit.x;
          WorldObjectsManager.dragState.startItemY = hit.y;
          WorldObjectsManager.dragState.startItemW = hit.w;
          WorldObjectsManager.dragState.startItemH = hit.h;
          WorldObjectsManager.dragState.anchorX = cx;
          WorldObjectsManager.dragState.anchorY = cy;
        }

        // Trigger 'when this sprite clicked' event if running
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("when_clicked", hit.id);
        }

        SoundEngine.playChiptuneTone(hit.locked ? 320 : 520, "square", 0.05, 0.08);
      } else {
        WorldObjectsManager.selectItem(null);
      }
      return;
    }

    // 2. MOVE Tool / Spacebar / Middle Click: Pan Canvas World
    if (e.button === 1 || (e.button === 0 && (MouseToolController.activeTool === "move" || isSpacePressed))) {
      WorldConfig.isPanning = true;
      WorldConfig.panStartX = e.clientX;
      WorldConfig.panStartY = e.clientY;
      WorldConfig.startPanX = cam.panX;
      WorldConfig.startPanY = cam.panY;
      
      const container = document.getElementById("canvas-container");
      if (container) container.classList.add("panning");
    }
  });

  window.addEventListener("mousemove", (e) => {
    const cam = getActiveStageCamera();

    // 0. Crop Dragging in CROP Mode
    if (CropController.cropDragState.isDragging && CropController.targetItemId && mainCanvas) {
      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem && selectedItem.crop) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;

        const { lx, ly } = WorldObjectsManager.worldToLocal(selectedItem, wx, wy);
        const ds = CropController.cropDragState;
        const nw = selectedItem.naturalW || selectedItem.w;
        const nh = selectedItem.naturalH || selectedItem.h;
        const scaleX = selectedItem.w / nw;
        const scaleY = selectedItem.h / nh;

        const dlx = (lx - ds.startLx) / scaleX;
        const dly = (ly - ds.startLy) / scaleY;

        let { x, y, w, h } = ds.startCrop;

        switch (ds.handle) {
          case "body":
            x = Math.max(0, Math.min(nw - w, Math.round(ds.startCrop.x + dlx)));
            y = Math.max(0, Math.min(nh - h, Math.round(ds.startCrop.y + dly)));
            break;
          case "se":
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "nw":
            const candX = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            const candY = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX;
            h = (ds.startCrop.y + ds.startCrop.h) - candY;
            x = candX;
            y = candY;
            break;
          case "ne":
            const candY_ne = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            h = (ds.startCrop.y + ds.startCrop.h) - candY_ne;
            y = candY_ne;
            break;
          case "sw":
            const candX_sw = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX_sw;
            x = candX_sw;
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "e":
            w = Math.max(8, Math.min(nw - x, Math.round(ds.startCrop.w + dlx)));
            break;
          case "w":
            const candX_w = Math.max(0, Math.min(ds.startCrop.x + ds.startCrop.w - 8, Math.round(ds.startCrop.x + dlx)));
            w = (ds.startCrop.x + ds.startCrop.w) - candX_w;
            x = candX_w;
            break;
          case "s":
            h = Math.max(8, Math.min(nh - y, Math.round(ds.startCrop.h + dly)));
            break;
          case "n":
            const candY_n = Math.max(0, Math.min(ds.startCrop.y + ds.startCrop.h - 8, Math.round(ds.startCrop.y + dly)));
            h = (ds.startCrop.y + ds.startCrop.h) - candY_n;
            y = candY_n;
            break;
        }

        selectedItem.crop.x = Math.round(x);
        selectedItem.crop.y = Math.round(y);
        selectedItem.crop.w = Math.round(w);
        selectedItem.crop.h = Math.round(h);
        selectedItem.crop.isCropped = (x > 0 || y > 0 || w < nw || h < nh);

        PropertiesController.updateFromSelected(selectedItem);
      }
      return;
    }

    // 1. Transforming Selected Item in SELECT Mode
    if (WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId && mainCanvas) {
      const selectedItem = WorldObjectsManager.getSelectedItem();
      if (selectedItem) {
        const rect = mainCanvas.elt.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = cam.panX + (sx - width / 2) / cam.zoom;
        const wy = cam.panY + (sy - height / 2) / cam.zoom;

        const ds = WorldObjectsManager.dragState;
        const cx = ds.anchorX;
        const cy = ds.anchorY;

        if (ds.mode === "rotate") {
          const rad = Math.atan2(wy - cy, wx - cx);
          let deg = (rad * 180 / Math.PI) + 90;
          deg = ((deg % 360) + 360) % 360;
          if (e.shiftKey) deg = Math.round(deg / 15) * 15;
          selectedItem.rotation = Math.round(deg);
          PropertiesController.updateFromSelected(selectedItem);
        } else if (ds.mode === "resize") {
          const { lx, ly } = WorldObjectsManager.worldToLocal(selectedItem, wx, wy);
          let w = ds.startItemW;
          let h = ds.startItemH;

          switch (ds.handle) {
            case "se": w = Math.round(lx * 2); h = Math.round(ly * 2); break;
            case "nw": w = Math.round(-lx * 2); h = Math.round(-ly * 2); break;
            case "ne": w = Math.round(lx * 2); h = Math.round(-ly * 2); break;
            case "sw": w = Math.round(-lx * 2); h = Math.round(ly * 2); break;
            case "e":  w = Math.round(lx * 2); break;
            case "w":  w = Math.round(-lx * 2); break;
            case "s":  h = Math.round(ly * 2); break;
            case "n":  h = Math.round(-ly * 2); break;
          }

          if (PropertiesController.lockAspect || e.shiftKey) {
            const ratio = ds.startItemW / ds.startItemH;
            if (ds.handle === "e" || ds.handle === "w") {
              h = Math.round(w / ratio);
            } else if (ds.handle === "n" || ds.handle === "s") {
              w = Math.round(h * ratio);
            } else {
              if (Math.abs(w / ds.startItemW) > Math.abs(h / ds.startItemH)) {
                h = Math.round(w / ratio);
              } else {
                w = Math.round(h * ratio);
              }
            }
          }

          w = Math.max(16, w);
          h = Math.max(16, h);

          selectedItem.w = w;
          selectedItem.h = h;
          selectedItem.x = Math.round(cx - w / 2);
          selectedItem.y = Math.round(cy - h / 2);
          PropertiesController.updateFromSelected(selectedItem);
        } else if (ds.mode === "move") {
          const dx = wx - ds.startX;
          const dy = wy - ds.startY;
          selectedItem.x = Math.round(Math.max(0, Math.min(WorldConfig.worldWidth - selectedItem.w, ds.startItemX + dx)));
          selectedItem.y = Math.round(Math.max(0, Math.min(WorldConfig.worldHeight - selectedItem.h, ds.startItemY + dy)));
          PropertiesController.updateFromSelected(selectedItem);
        }
      }
      return;
    }

    // 2. Canvas World Panning
    if (WorldConfig.isPanning) {
      if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
        const dx = (e.clientX - WorldConfig.panStartX) / cam.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / cam.zoom;
        PreviewConfig.panX = WorldConfig.startPanX - dx;
        PreviewConfig.panY = WorldConfig.startPanY - dy;
        PreviewConfig.isUserAdjusted = true;
      } else {
        const dx = (e.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
        const dy = (e.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
        WorldConfig.panX = WorldConfig.startPanX - dx;
        WorldConfig.panY = WorldConfig.startPanY - dy;
        WorldConfig.clampPan();
      }
    }
  });

  window.addEventListener("mouseup", () => {
    if (CropController.cropDragState.isDragging) {
      CropController.cropDragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }

    if (WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
      AsyncSceneStore.saveCurrentScene();
    }

    if (WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
      const container = document.getElementById("canvas-container");
      if (container) container.classList.remove("panning");
    }
  });

  // Touch panning & object interaction
  canvasEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasEl.getBoundingClientRect();
      const sx = touch.clientX - rect.left;
      const sy = touch.clientY - rect.top;
      const cam = getActiveStageCamera();
      const wx = cam.panX + (sx - width / 2) / cam.zoom;
      const wy = cam.panY + (sy - height / 2) / cam.zoom;

      if (MouseToolController.activeTool === "select") {
        const hit = WorldObjectsManager.getItemAt(wx, wy);
        if (hit) {
          WorldObjectsManager.selectedId = hit.id;
          WorldObjectsManager.dragState.isDragging = true;
          WorldObjectsManager.dragState.startX = wx;
          WorldObjectsManager.dragState.startY = wy;
          WorldObjectsManager.dragState.startItemX = hit.x;
          WorldObjectsManager.dragState.startItemY = hit.y;
          return;
        }
      }

      if (MouseToolController.activeTool === "move") {
        WorldConfig.isPanning = true;
        WorldConfig.panStartX = touch.clientX;
        WorldConfig.panStartY = touch.clientY;
        WorldConfig.startPanX = cam.panX;
        WorldConfig.startPanY = cam.panY;
      }
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const cam = getActiveStageCamera();

      if (WorldObjectsManager.dragState.isDragging && WorldObjectsManager.selectedId) {
        const selectedItem = WorldObjectsManager.getSelectedItem();
        if (selectedItem) {
          const rect = canvasEl.getBoundingClientRect();
          const sx = touch.clientX - rect.left;
          const sy = touch.clientY - rect.top;
          const wx = cam.panX + (sx - width / 2) / cam.zoom;
          const wy = cam.panY + (sy - height / 2) / cam.zoom;

          const dx = wx - WorldObjectsManager.dragState.startX;
          const dy = wy - WorldObjectsManager.dragState.startY;

          selectedItem.x = Math.round(Math.max(0, Math.min(WorldConfig.worldWidth - selectedItem.w, WorldObjectsManager.dragState.startItemX + dx)));
          selectedItem.y = Math.round(Math.max(0, Math.min(WorldConfig.worldHeight - selectedItem.h, WorldObjectsManager.dragState.startItemY + dy)));
        }
        return;
      }

      if (WorldConfig.isPanning) {
        if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
          const dx = (touch.clientX - WorldConfig.panStartX) / cam.zoom;
          const dy = (touch.clientY - WorldConfig.panStartY) / cam.zoom;
          PreviewConfig.panX = WorldConfig.startPanX - dx;
          PreviewConfig.panY = WorldConfig.startPanY - dy;
          PreviewConfig.isUserAdjusted = true;
        } else {
          const dx = (touch.clientX - WorldConfig.panStartX) / WorldConfig.zoom;
          const dy = (touch.clientY - WorldConfig.panStartY) / WorldConfig.zoom;
          WorldConfig.panX = WorldConfig.startPanX - dx;
          WorldConfig.panY = WorldConfig.startPanY - dy;
          WorldConfig.clampPan();
        }
      }
    }
  }, { passive: true });

  window.addEventListener("touchend", () => {
    if (WorldObjectsManager.dragState.isDragging) {
      WorldObjectsManager.dragState.isDragging = false;
      WorldObjectsManager.saveHistory();
    }
    if (WorldConfig.isPanning) {
      WorldConfig.isPanning = false;
    }
  });

  // Mouse wheel zoom
  canvasEl.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      const cam = getActiveStageCamera();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      PreviewConfig.zoom = Math.max(0.02, Math.min(3.0, cam.zoom * zoomFactor));
      PreviewConfig.isUserAdjusted = true;
    } else {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      WorldConfig.zoom = Math.max(WorldConfig.minZoom, Math.min(WorldConfig.maxZoom, WorldConfig.zoom * zoomFactor));
      WorldConfig.clampPan();
    }
  }, { passive: false });
}

function draw() {
  const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
  const isPlay = typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying;

  if (isPlay) {
    GamePlayerEngine.updateGameLoop();
  }

  // 1. Dark outer void canvas background
  background(isPlay ? 6 : (isCode ? 10 : 18), isPlay ? 2 : (isCode ? 3 : 4), isPlay ? 4 : (isCode ? 5 : 9));

  const cam = getActiveStageCamera();

  // 2. View Transformations
  push();
  translate(width / 2, height / 2);
  scale(cam.zoom);
  translate(-cam.panX, -cam.panY);

  // 3. Draw World Canvas Background
  fill(WorldConfig.bgColor);
  if (isPlay) {
    noStroke();
  } else {
    stroke(46, 8, 20);
    strokeWeight(3);
  }
  rect(0, 0, WorldConfig.worldWidth, WorldConfig.worldHeight);

  // 4. Subtle World Grid (if Grid Toggle is ON and not in Code Mode preview or Play mode)
  if (MouseToolController.showGrid && !isCode && !isPlay) {
    stroke(200, 200, 210, 45);
    strokeWeight(1);
    const gridSize = 64;
    for (let x = 0; x <= WorldConfig.worldWidth; x += gridSize) {
      line(x, 0, x, WorldConfig.worldHeight);
    }
    for (let y = 0; y <= WorldConfig.worldHeight; y += gridSize) {
      line(0, y, WorldConfig.worldWidth, y);
    }
  }

  // 5. Draw Placed World Objects & Drag Preview
  WorldObjectsManager.draw();

  // 6. World Origin Axes / Bounds Accent
  if (!isPlay) {
    stroke(173, 32, 77);
    strokeWeight(isCode ? 1.5 : 2);
    noFill();
    rect(0, 0, WorldConfig.worldWidth, WorldConfig.worldHeight);
  }

  pop();

  // 7. HUD Coordinates Overlay (Bottom Right - only in main Canvas mode)
  if (!isCode && !isPlay) {
    drawHUD();
  }

  // 8. Live Dynamic Variable Watcher HUD Badges (Top-Left of stage canvas)
  if (typeof VariableManager !== "undefined") {
    VariableManager.drawWatchers();
  }
}

function drawHUD() {
  push();
  const hudText = `WORLD: ${WorldConfig.worldWidth}x${WorldConfig.worldHeight} | ZOOM: ${Math.round(WorldConfig.zoom * 100)}%`;
  
  textSize(10);
  textAlign(RIGHT, BOTTOM);
  const pad = 10;
  
  // On mobile (<= 860px), lift HUD above mobile bottom nav bar (56px)
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 860;
  const bottomOffset = isMobile ? 68 : 14;
  const rectBottomOffset = isMobile ? 78 : 28;

  // HUD Pill
  fill(13, 2, 5, 190);
  stroke(46, 8, 20);
  strokeWeight(2);
  rect(width - textWidth(hudText) - pad * 2 - 10, height - rectBottomOffset, textWidth(hudText) + pad * 2, 20);

  noStroke();
  fill(201, 146, 162);
  text(hudText, width - pad - 10, height - bottomOffset);
  pop();
}

function windowResized() {
  resizeStageCanvas();
}

// ============================================================================
// 11. WORKSPACE CONTROLS & EVENT HANDLERS
// ============================================================================
function saveWorkspace() {
  SoundEngine.playAction("save");
  saveCanvas(mainCanvas, "unifive_pixel_workspace", "png");
}

function toggleFullscreenMode() {
  const btn = document.getElementById("btn-fullscreen");
  const icon = document.getElementById("fullscreen-icon");
  const label = document.getElementById("fullscreen-label");

  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-corners-in";
      if (label) label.textContent = "WINDOWED";
      setTimeout(resizeStageCanvas, 100);
    }).catch(err => {
      console.warn("Fullscreen error:", err);
    });
  } else {
    document.exitFullscreen().then(() => {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-corners-out";
      if (label) label.textContent = "FULLSCREEN";
      setTimeout(resizeStageCanvas, 100);
    }).catch(err => {
      console.warn("Exit fullscreen error:", err);
    });
  }
}

function initUIEventListeners() {
  document.addEventListener("click", () => SoundEngine.init(), { once: true });
  document.addEventListener("keydown", () => SoundEngine.init(), { once: true });

  const btnUndo = document.getElementById("btn-undo");
  if (btnUndo) {
    btnUndo.addEventListener("click", () => HistoryManager.undo());
  }

  const btnRedo = document.getElementById("btn-redo");
  if (btnRedo) {
    btnRedo.addEventListener("click", () => HistoryManager.redo());
  }

  const btnSave = document.getElementById("btn-save");
  if (btnSave) {
    btnSave.addEventListener("click", () => saveWorkspace());
  }

  const btnSound = document.getElementById("btn-sound");
  if (btnSound) {
    btnSound.addEventListener("click", () => SoundEngine.toggle());
  }

  const btnFullscreen = document.getElementById("btn-fullscreen");
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => toggleFullscreenMode());
  }

  document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("btn-fullscreen");
    const icon = document.getElementById("fullscreen-icon");
    const label = document.getElementById("fullscreen-label");

    if (document.fullscreenElement) {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-corners-in";
      if (label) label.textContent = "WINDOWED";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-corners-out";
      if (label) label.textContent = "FULLSCREEN";
    }
    setTimeout(resizeStageCanvas, 100);
  });

  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target.tagName !== "INPUT") {
      isSpacePressed = true;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      HistoryManager.undo();
    } else if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
               ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      HistoryManager.redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveWorkspace();
    } else if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      ViewController.toggleView();
    } else if ((e.key.toLowerCase() === "m" || e.key.toLowerCase() === "h") && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.setTool("move");
    } else if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.setTool("select");
    } else if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      MouseToolController.toggleGrid();
    } else if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey && e.target.tagName !== "INPUT") {
      toggleFullscreenMode();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpacePressed = false;
    }
  });
}
