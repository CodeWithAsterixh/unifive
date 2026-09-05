/**
 * UNIFIVE - Standalone Game Player Module
 * (C) 2026 UNIFIVE.P5 Game Studio
 * 
 * Subsystems:
 * 1. GamePlayerEngine: Play Mode lifecycle, scene snapshot/restore, camera tracking, dynamic character switching, cutscene control
 * 2. PlayerInputManager: Unified Keyboard, Gamepad, Touch click-to-broadcast buttons & directional input streaming
 * 3. MobileControlsManager: Device detection, virtual retro on-screen D-Pad & A/B buttons, and device visibility filtering
 */

// ============================================================================
// 1. MOBILE & DEVICE CONTROLS MANAGER
// ============================================================================
const MobileControlsManager = {
  isTouchDevice: false,
  isMobileScreen: false,

  init() {
    this.checkDevice();
    window.addEventListener("resize", () => this.checkDevice());
    this.bindVirtualGamepad();
  },

  checkDevice() {
    this.isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    this.isMobileScreen = window.innerWidth <= 860;
  },

  isMobile() {
    return this.isTouchDevice || this.isMobileScreen;
  },

  filterObjectVisibility(items) {
    if (!items || !Array.isArray(items)) return;
    const isMob = this.isMobile();

    items.forEach(item => {
      const vis = item.deviceVisibility || "all";
      if (vis === "mobile_only") {
        item.hiddenInPlayer = !isMob;
      } else if (vis === "desktop_only") {
        item.hiddenInPlayer = isMob;
      } else {
        item.hiddenInPlayer = false;
      }
    });
  },

  bindVirtualGamepad() {
    const dpadButtons = document.querySelectorAll(".virtual-dpad-btn");
    dpadButtons.forEach(btn => {
      const dir = btn.getAttribute("data-dir");

      const startDir = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add("active");
        PlayerInputManager.setVirtualKey(dir, true);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(320, "triangle", 0.02, 0.04);
      };

      const endDir = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove("active");
        PlayerInputManager.setVirtualKey(dir, false);
      };

      btn.addEventListener("touchstart", startDir, { passive: false });
      btn.addEventListener("touchend", endDir, { passive: false });
      btn.addEventListener("touchcancel", endDir, { passive: false });
      btn.addEventListener("mousedown", startDir);
      btn.addEventListener("mouseup", endDir);
      btn.addEventListener("mouseleave", endDir);
    });

    const actionButtons = document.querySelectorAll(".virtual-action-btn");
    actionButtons.forEach(btn => {
      const action = btn.getAttribute("data-action");

      const startAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add("active");
        PlayerInputManager.setVirtualKey(action, true);
        
        // Broadcast corresponding action event
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("broadcast", action);
          if (action === "jump" || action === "action_a") {
            CodeRuntimeEngine.triggerEvent("when_key", "space");
          }
        }

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(action === "jump" || action === "action_a" ? 587 : 440, "square", 0.03, 0.08);
        }
      };

      const endAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove("active");
        PlayerInputManager.setVirtualKey(action, false);
      };

      btn.addEventListener("touchstart", startAction, { passive: false });
      btn.addEventListener("touchend", endAction, { passive: false });
      btn.addEventListener("touchcancel", endAction, { passive: false });
      btn.addEventListener("mousedown", startAction);
      btn.addEventListener("mouseup", endAction);
      btn.addEventListener("mouseleave", endAction);
    });
  },

  updateGamepadVisibility() {
    const pad = document.getElementById("mobile-virtual-gamepad");
    if (!pad) return;

    if (GamePlayerEngine.isPlaying && this.isMobile()) {
      pad.style.display = "flex";
    } else {
      pad.style.display = "none";
    }
  }
};

// ============================================================================
// 2. PLAYER INPUT MANAGER
// ============================================================================
const PlayerInputManager = {
  keysDown: {},
  virtualKeys: {},

  init() {
    window.addEventListener("keydown", (e) => {
      if (!GamePlayerEngine.isPlaying) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.contentEditable === "true") return;

      const code = e.code;
      this.keysDown[code] = true;

      // Handle in-game quick keys
      if (code === "Escape") {
        e.preventDefault();
        GamePlayerEngine.togglePause();
        return;
      }
      if (code === "KeyF") {
        GamePlayerEngine.toggleFullscreen();
        return;
      }
      if (code === "KeyP" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        GamePlayerEngine.exit();
        return;
      }

      // Route Space / Key actions to broadcast triggers
      if (code === "Space") {
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("broadcast", "jump");
        }
      } else if (code === "KeyZ") {
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("broadcast", "attack");
        }
      } else if (code === "KeyX") {
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("broadcast", "interact");
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      if (!GamePlayerEngine.isPlaying) return;
      this.keysDown[e.code] = false;
    });
  },

  setVirtualKey(keyName, isPressed) {
    this.virtualKeys[keyName] = isPressed;
  },

  isActionActive(actionName) {
    if (!GamePlayerEngine.isControlEnabled) return false;

    switch (actionName) {
      case "left":
        return !!(this.keysDown["ArrowLeft"] || this.keysDown["KeyA"] || this.virtualKeys["left"]);
      case "right":
        return !!(this.keysDown["ArrowRight"] || this.keysDown["KeyD"] || this.virtualKeys["right"]);
      case "up":
        return !!(this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["up"]);
      case "down":
        return !!(this.keysDown["ArrowDown"] || this.keysDown["KeyS"] || this.virtualKeys["down"]);
      case "jump":
      case "action_a":
        return !!(this.keysDown["Space"] || this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["jump"] || this.virtualKeys["action_a"]);
      case "attack":
      case "action_b":
        return !!(this.keysDown["KeyZ"] || this.keysDown["KeyJ"] || this.virtualKeys["attack"] || this.virtualKeys["action_b"]);
      case "interact":
        return !!(this.keysDown["KeyX"] || this.keysDown["KeyE"] || this.virtualKeys["interact"]);
      default:
        return false;
    }
  },

  handleCanvasClick(worldX, worldY) {
    if (!GamePlayerEngine.isPlaying) return;
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;

    // Check clicked objects in reverse depth order (topmost in-front item first)
    const items = typeof WorldObjectsManager.getSortedRenderList === "function" 
      ? WorldObjectsManager.getSortedRenderList(true) 
      : WorldObjectsManager.items;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.hidden || item.hiddenInPlayer) continue;

      const minX = item.x;
      const maxX = item.x + (item.w || 40);
      const minY = item.y;
      const maxY = item.y + (item.h || 40);

      if (worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY) {
        // Trigger click event on runtime engine
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("when_clicked", null, item.id);
        }

        // If this item is designated as a switchable hero button, switch to it
        if (item.isPlayableTrigger) {
          GamePlayerEngine.setPlayableCharacter(item.id);
        }

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(740, "sine", 0.04, 0.08);
        }
        break;
      }
    }
  }
};

// ============================================================================
// 3. GAME PLAYER ENGINE (CORE LIFECYCLE & CAMERA)
// ============================================================================
const GamePlayerEngine = {
  isPlaying: false,
  isPaused: false,
  isControlEnabled: true,
  activePlayableId: null,
  activePlayableItem: null,

  // Scene State Snapshot for Clean Restore
  sceneSnapshot: null,
  previousAppMode: "canvas",

  // Camera Tracking & Smooth Lerp
  camX: 0,
  camY: 0,
  camZoom: 1.0,
  targetCamX: 0,
  targetCamY: 0,
  lerpFactor: 0.12,

  // Physics & Movement Config
  playerSpeed: 6.5,
  gravity: 0.85,
  jumpForce: -14.0,

  init() {
    PlayerInputManager.init();
    MobileControlsManager.init();
    this.bindUI();
  },

  bindUI() {
    // Header PLAY button
    const btnPlay = document.getElementById("btn-mode-play");
    if (btnPlay) {
      btnPlay.addEventListener("click", () => this.togglePlay());
    }

    // Quick Bar in Game Player
    const btnPause = document.getElementById("btn-player-pause");
    if (btnPause) btnPause.addEventListener("click", () => this.togglePause());

    const btnFullscreen = document.getElementById("btn-player-fullscreen");
    if (btnFullscreen) btnFullscreen.addEventListener("click", () => this.toggleFullscreen());

    const btnExit = document.getElementById("btn-player-exit");
    if (btnExit) btnExit.addEventListener("click", () => this.exit());

    // Pause Modal Buttons
    const btnResume = document.getElementById("btn-pause-resume");
    if (btnResume) btnResume.addEventListener("click", () => this.resume());

    const btnRestart = document.getElementById("btn-pause-restart");
    if (btnRestart) btnRestart.addEventListener("click", () => this.restart());

    const btnModalExit = document.getElementById("btn-pause-exit");
    if (btnModalExit) btnModalExit.addEventListener("click", () => this.exit());

    // Game Over Modal Buttons
    const btnRetry = document.getElementById("btn-gameover-retry");
    if (btnRetry) btnRetry.addEventListener("click", () => this.restart());

    const btnGameoverExit = document.getElementById("btn-gameover-exit");
    if (btnGameoverExit) btnGameoverExit.addEventListener("click", () => this.exit());
  },

  togglePlay() {
    if (this.isPlaying) {
      this.exit();
    } else {
      this.enter();
    }
  },

  // 1. ENTER PLAY MODE
  enter() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.isPaused = false;
    this.isControlEnabled = true;

    // Record previous editor mode (canvas or code)
    if (typeof AppModeController !== "undefined") {
      this.previousAppMode = AppModeController.currentMode || "canvas";
    }

    // 1. Capture Deep Snapshot of Scene & Variables
    this.captureSnapshot();

    // 2. Resolve Active Playable Character
    this.resolveInitialPlayableCharacter();

    // 3. Filter Mobile Object Visibility
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      MobileControlsManager.filterObjectVisibility(WorldObjectsManager.items);
    }

    // 4. Update UI Layout to PLAY Mode
    document.body.classList.add("mode-play");
    document.body.classList.remove("mode-canvas", "mode-code");

    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");
    const btnPlay = document.getElementById("btn-mode-play");
    if (btnCanvas) btnCanvas.classList.remove("active");
    if (btnCode) btnCode.classList.remove("active");
    if (btnPlay) btnPlay.classList.add("active");

    const controlsPane = document.getElementById("controls-pane");
    const codeToolbox = document.getElementById("code-toolbox-pane");
    const codeStageLayout = document.getElementById("code-stage-layout");
    const floatingDock = document.getElementById("floating-dock");
    const spritePanel = document.getElementById("floating-sprite-poses-panel");
    const cropBar = document.getElementById("floating-crop-bar");
    const playerPane = document.getElementById("game-player-pane");
    const canvasContainer = document.getElementById("canvas-container");
    const playerCanvasBox = document.getElementById("player-canvas-container");

    if (controlsPane) controlsPane.style.display = "none";
    if (codeToolbox) codeToolbox.style.display = "none";
    if (codeStageLayout) codeStageLayout.style.display = "none";
    if (floatingDock) floatingDock.style.display = "none";
    if (spritePanel) spritePanel.style.display = "none";
    if (cropBar) cropBar.style.display = "none";

    if (playerPane) playerPane.style.display = "flex";
    if (canvasContainer && playerCanvasBox) {
      playerCanvasBox.appendChild(canvasContainer);
    }

    // 5. Initialize Camera Centered on Playable Character
    this.initCamera();

    // 6. Update HUD & Mobile Gamepad
    this.updateHUD();
    MobileControlsManager.updateGamepadVisibility();

    // 7. Start Code Script Execution
    if (typeof CodeRuntimeEngine !== "undefined") {
      CodeRuntimeEngine.start("when_flag");
    }

    // 8. Play Start Chime
    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(523, "triangle", 0.08, 0.15);
      setTimeout(() => SoundEngine.playChiptuneTone(659, "triangle", 0.08, 0.15), 60);
      setTimeout(() => SoundEngine.playChiptuneTone(784, "triangle", 0.12, 0.18), 120);
      setTimeout(() => SoundEngine.playChiptuneTone(1046, "triangle", 0.18, 0.22), 180);
    }

    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 0);
    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 60);
  },

  // 2. EXIT PLAY MODE & RESTORE EDITOR STATE
  exit() {
    this.isPlaying = false;
    this.isPaused = false;

    // 1. Stop Code Runtime
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
      CodeRuntimeEngine.stopAll();
    }

    // 2. Close All Modals
    const pauseModal = document.getElementById("modal-player-pause");
    const gameoverModal = document.getElementById("modal-player-gameover");
    if (pauseModal) pauseModal.style.display = "none";
    if (gameoverModal) gameoverModal.style.display = "none";

    // 3. Hide Player Pane & Reparent Canvas
    const playerPane = document.getElementById("game-player-pane");
    const canvasContainer = document.getElementById("canvas-container");
    const stagePane = document.getElementById("stage-pane");

    if (playerPane) playerPane.style.display = "none";
    if (canvasContainer && stagePane) {
      stagePane.insertBefore(canvasContainer, stagePane.firstChild);
    }

    // 4. Restore Scene Snapshot
    this.restoreSnapshot();

    // 5. Return to Previous App Mode (Canvas or Code)
    document.body.classList.remove("mode-play");
    const btnPlay = document.getElementById("btn-mode-play");
    if (btnPlay) btnPlay.classList.remove("active");

    if (typeof AppModeController !== "undefined") {
      AppModeController.setMode(this.previousAppMode || "canvas");
    }

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(440, "sine", 0.06, 0.08);
    }

    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 0);
    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 60);
  },

  // 3. RESTART GAME
  restart() {
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
      CodeRuntimeEngine.stopAll();
    }

    const pauseModal = document.getElementById("modal-player-pause");
    const gameoverModal = document.getElementById("modal-player-gameover");
    if (pauseModal) pauseModal.style.display = "none";
    if (gameoverModal) gameoverModal.style.display = "none";
    this.isPaused = false;

    // Restore positions and variables from snapshot
    this.restoreSnapshot(false);

    // Re-resolve playable character & camera
    this.resolveInitialPlayableCharacter();
    this.initCamera();
    this.updateHUD();

    // Trigger flag scripts again
    if (typeof CodeRuntimeEngine !== "undefined") {
      CodeRuntimeEngine.start("when_flag");
    }

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(659, "triangle", 0.08, 0.15);
      setTimeout(() => SoundEngine.playChiptuneTone(880, "triangle", 0.12, 0.18), 80);
    }
  },

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  },

  pause() {
    this.isPaused = true;
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) pauseModal.style.display = "flex";
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(392, "square", 0.06, 0.1);
  },

  resume() {
    this.isPaused = false;
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) pauseModal.style.display = "none";
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(587, "square", 0.06, 0.1);
  },

  toggleFullscreen() {
    const elem = document.getElementById("game-player-pane") || document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
      else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  },

  // 4. SCENE SNAPSHOT & RESTORE ENGINE
  captureSnapshot() {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;

    const itemsClone = WorldObjectsManager.items.map(it => ({
      id: it.id,
      assetId: it.assetId,
      name: it.name,
      src: it.src,
      thumb: it.thumb,
      type: it.type,
      x: it.x,
      y: it.y,
      w: it.w,
      h: it.h,
      rotation: it.rotation || 0,
      flipH: !!it.flipH,
      flipV: !!it.flipV,
      hidden: !!it.hidden,
      locked: !!it.locked,
      currentPose: it.currentPose || "Idle",
      defaultPose: it.defaultPose || "Idle",
      autoplay: !!it.autoplay,
      animSpeed: it.animSpeed || 100,
      isPlayable: !!it.isPlayable,
      isSolid: !!it.isSolid,
      deviceVisibility: it.deviceVisibility || "all"
    }));

    let varsClone = [];
    if (typeof VariableManager !== "undefined" && VariableManager.variables) {
      varsClone = JSON.parse(JSON.stringify(VariableManager.variables));
    }

    this.sceneSnapshot = {
      items: itemsClone,
      variables: varsClone,
      worldConfig: {
        panX: WorldConfig.panX,
        panY: WorldConfig.panY,
        zoom: WorldConfig.zoom
      }
    };
  },

  restoreSnapshot(clearSnapshot = true) {
    if (!this.sceneSnapshot) return;

    if (typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.deserialize(this.sceneSnapshot.items);
    }

    if (typeof VariableManager !== "undefined" && this.sceneSnapshot.variables) {
      VariableManager.variables = JSON.parse(JSON.stringify(this.sceneSnapshot.variables));
    }

    if (this.sceneSnapshot.worldConfig) {
      WorldConfig.panX = this.sceneSnapshot.worldConfig.panX;
      WorldConfig.panY = this.sceneSnapshot.worldConfig.panY;
      WorldConfig.zoom = this.sceneSnapshot.worldConfig.zoom;
      WorldConfig.clampPan();
    }

    if (clearSnapshot) {
      this.sceneSnapshot = null;
    }
  },

  // 5. PLAYABLE CHARACTER RESOLUTION & SWITCHING
  resolveInitialPlayableCharacter() {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;
    const items = WorldObjectsManager.items;

    // 1. Look for item explicitly flagged as isPlayable
    let hero = items.find(it => it.isPlayable && !it.hidden);

    // 2. Look for item with hero / player / archer / warrior / swordsman in name
    if (!hero) {
      hero = items.find(it => {
        const n = (it.name || "").toLowerCase();
        return (n.includes("hero") || n.includes("player") || n.includes("archer") || n.includes("swordsman") || n.includes("warrior")) && !it.hidden;
      });
    }

    // 3. Fallback to first placed sprite
    if (!hero) {
      hero = items.find(it => (it.type === "sprite" || (it.assetId && it.assetId.startsWith("sprite_")) || it.poses) && !it.hidden);
    }

    if (hero) {
      this.activePlayableId = hero.id;
      this.activePlayableItem = hero;
    } else {
      this.activePlayableId = null;
      this.activePlayableItem = null;
    }
  },

  setPlayableCharacter(targetIdOrItem) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;
    const items = WorldObjectsManager.items;

    let target = null;
    if (typeof targetIdOrItem === "string") {
      target = items.find(it => it.id === targetIdOrItem || (it.name && it.name.toLowerCase() === targetIdOrItem.toLowerCase()));
    } else if (targetIdOrItem && targetIdOrItem.id) {
      target = targetIdOrItem;
    }

    if (!target) return;

    this.activePlayableId = target.id;
    this.activePlayableItem = target;

    // Fire 'when_became_playable' hat event for the target
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
      CodeRuntimeEngine.triggerEvent("when_became_playable", null, target.id);
    }

    // Update HUD indicator
    this.updateHUD();

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(880, "triangle", 0.05, 0.12);
    }
  },

  setPlayerControlEnabled(enabled) {
    this.isControlEnabled = !!enabled;
  },

  // 6. CAMERA TRACKING ENGINE
  initCamera() {
    const stageDims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: window.innerWidth, h: window.innerHeight };

    if (this.activePlayableItem) {
      this.camX = this.activePlayableItem.x;
      this.camY = this.activePlayableItem.y;
    } else {
      this.camX = WorldConfig.worldWidth / 2;
      this.camY = WorldConfig.worldHeight / 2;
    }

    // Set pixel-perfect or comfortable game zoom
    const isMobile = MobileControlsManager.isMobile();
    this.camZoom = isMobile ? Math.min(1.2, stageDims.w / 480) : 1.0;
    this.targetCamX = this.camX;
    this.targetCamY = this.camY;

    // Apply strict world boundary clamping immediately
    this.clampCamera();
  },

  clampCamera() {
    const stageDims = (typeof getStageDimensions === "function") ? getStageDimensions() : { w: window.innerWidth, h: window.innerHeight };
    const z = this.camZoom || 1.0;
    const viewW = stageDims.w / z;
    const viewH = stageDims.h / z;

    // Horizontal clamping: never expose void outside [0, WorldConfig.worldWidth]
    if (WorldConfig.worldWidth > viewW) {
      const minCamX = viewW / 2;
      const maxCamX = WorldConfig.worldWidth - viewW / 2;
      this.camX = Math.max(minCamX, Math.min(maxCamX, this.camX));
    } else {
      this.camX = WorldConfig.worldWidth / 2;
    }

    // Vertical clamping: never expose void outside [0, WorldConfig.worldHeight]
    if (WorldConfig.worldHeight > viewH) {
      const minCamY = viewH / 2;
      const maxCamY = WorldConfig.worldHeight - viewH / 2;
      this.camY = Math.max(minCamY, Math.min(maxCamY, this.camY));
    } else {
      this.camY = WorldConfig.worldHeight / 2;
    }

    WorldConfig.panX = this.camX;
    WorldConfig.panY = this.camY;
    WorldConfig.zoom = this.camZoom;
  },

  updateGameLoop() {
    if (!this.isPlaying || this.isPaused) return;

    // 1. Process Live Player Physics & Directional Movement
    this.updatePlayerMovement();

    // 2. Smooth Camera Lerp Tracking
    this.updateCameraFollow();

    // 3. Live HUD Update
    this.updateHUD();
  },

  // 5b. SOLID OBSTACLES COLLISION & AUTO-GO-AROUND
  getSolidObstacleCollision(boxX, boxY, boxW, boxH, ignoreId = null) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return null;
    const items = WorldObjectsManager.items;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.id === ignoreId || !it.isSolid || it.hidden || it.hiddenInPlayer) continue;

      const obsW = it.w || 40;
      const obsH = it.h || 40;
      const obsX = it.x;
      // Solid base footprint (bottom 60% of object):
      const obsY = it.y + obsH * 0.4;
      const obsBoxH = obsH * 0.6;

      // AABB overlap check
      if (boxX < obsX + obsW && boxX + boxW > obsX && boxY < obsY + obsBoxH && boxY + boxH > obsY) {
        return {
          item: it,
          x: obsX,
          y: obsY,
          w: obsW,
          h: obsBoxH,
          centerX: obsX + obsW / 2,
          centerY: obsY + obsBoxH / 2
        };
      }
    }
    return null;
  },

  applyMovementWithCollision(hero, dx, dy) {
    const autoGoAround = (typeof WorldConfig !== "undefined" && WorldConfig.autoGoAround !== false);
    const speed = this.playerSpeed;

    // Hero feet footprint for precise ground collision
    const heroW = Math.max(14, (hero.w || 40) * 0.5);
    const heroH = Math.max(10, (hero.h || 40) * 0.3);
    const getFootX = (hx) => hx + ((hero.w || 40) - heroW) / 2;
    const getFootY = (hy) => hy + (hero.h || 40) - heroH;

    // 1. Move X axis
    if (dx !== 0) {
      const nextFootX = getFootX(hero.x + dx);
      const currFootY = getFootY(hero.y);
      const colX = this.getSolidObstacleCollision(nextFootX, currFootY, heroW, heroH, hero.id);

      if (!colX) {
        hero.x += dx;
      } else {
        // Horizontal path blocked by solid obstacle!
        // If autoGoAround is enabled and player is not pressing vertical keys, smoothly steer around obstacle corner:
        if (autoGoAround && dy === 0) {
          const heroCenterY = currFootY + heroH / 2;
          const nudgeDir = (heroCenterY < colX.centerY) ? -1 : 1;
          const nudgeY = nudgeDir * speed * 0.8;
          const testFootY = currFootY + nudgeY;

          if (!this.getSolidObstacleCollision(getFootX(hero.x), testFootY, heroW, heroH, hero.id)) {
            hero.y += nudgeY;
          }
        }
      }
    }

    // 2. Move Y axis
    if (dy !== 0) {
      const currFootX = getFootX(hero.x);
      const nextFootY = getFootY(hero.y + dy);
      const colY = this.getSolidObstacleCollision(currFootX, nextFootY, heroW, heroH, hero.id);

      if (!colY) {
        hero.y += dy;
      } else {
        // Vertical path blocked by solid obstacle!
        // If autoGoAround is enabled and player is not pressing horizontal keys, smoothly steer around obstacle corner:
        if (autoGoAround && dx === 0) {
          const heroCenterX = currFootX + heroW / 2;
          const nudgeDir = (heroCenterX < colY.centerX) ? -1 : 1;
          const nudgeX = nudgeDir * speed * 0.8;
          const testFootX = currFootX + nudgeX;

          if (!this.getSolidObstacleCollision(testFootX, getFootY(hero.y), heroW, heroH, hero.id)) {
            hero.x += nudgeX;
          }
        }
      }
    }
  },

  updatePlayerMovement() {
    if (!this.activePlayableItem || !this.isControlEnabled) return;
    const hero = this.activePlayableItem;
    const view = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";

    const moveLeft = PlayerInputManager.isActionActive("left");
    const moveRight = PlayerInputManager.isActionActive("right");
    const moveUp = PlayerInputManager.isActionActive("up");
    const moveDown = PlayerInputManager.isActionActive("down");

    let dx = 0;
    let dy = 0;

    if (view === "topdown") {
      // 8-Directional Top-Down Movement
      if (moveLeft) dx -= this.playerSpeed;
      if (moveRight) dx += this.playerSpeed;
      if (moveUp) dy -= this.playerSpeed;
      if (moveDown) dy += this.playerSpeed;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      // Apply movement with solid obstacle collision & auto-go-around
      this.applyMovementWithCollision(hero, dx, dy);

      // Update Top-Down pose orientation
      if (hero.poses) {
        if (dx < 0) hero.currentPose = "Walk Left";
        else if (dx > 0) hero.currentPose = "Walk Right";
        else if (dy < 0) hero.currentPose = "Walk Back";
        else if (dy > 0) hero.currentPose = "Walk Front";
        else {
          if (hero.currentPose && hero.currentPose.startsWith("Walk")) {
            hero.currentPose = hero.currentPose.replace("Walk", "Idle");
          }
        }
      }
    } else {
      // Side-Facing Platformer Movement
      if (moveLeft) {
        dx -= this.playerSpeed;
        hero.flipH = true;
        if (hero.poses && (!hero.currentPose || hero.currentPose === "Idle" || hero.currentPose.startsWith("Walk"))) {
          hero.currentPose = "Walk";
        }
      } else if (moveRight) {
        dx += this.playerSpeed;
        hero.flipH = false;
        if (hero.poses && (!hero.currentPose || hero.currentPose === "Idle" || hero.currentPose.startsWith("Walk"))) {
          hero.currentPose = "Walk";
        }
      } else {
        if (hero.poses && hero.currentPose === "Walk") {
          hero.currentPose = "Idle";
        }
      }

      if (moveUp) {
        dy -= this.playerSpeed * 0.75;
      } else if (moveDown) {
        dy += this.playerSpeed * 0.75;
      }

      // Apply movement with solid obstacle collision & auto-go-around
      this.applyMovementWithCollision(hero, dx, dy);
    }

    // Clamp hero inside world boundaries so character can touch the world edge cleanly without escaping
    const marginX = Math.min(16, (hero.w || 40) * 0.2);
    const marginY = Math.min(16, (hero.h || 40) * 0.2);
    hero.x = Math.max(marginX, Math.min(WorldConfig.worldWidth - marginX, hero.x));
    hero.y = Math.max(marginY, Math.min(WorldConfig.worldHeight - marginY, hero.y));
  },

  updateCameraFollow() {
    if (this.activePlayableItem) {
      this.targetCamX = this.activePlayableItem.x;
      this.targetCamY = this.activePlayableItem.y;
    }

    // Smooth Lerp Camera position
    this.camX += (this.targetCamX - this.camX) * this.lerpFactor;
    this.camY += (this.targetCamY - this.camY) * this.lerpFactor;

    // Strict boundary clamping so camera never exposes outer void
    this.clampCamera();
  },

  updateHUD() {
    // Dynamic variables and stats are rendered natively on canvas via VariableManager.drawWatchers()
  },

  triggerGameOver(finalScore, finalCoins) {
    this.isPaused = true;
    const modal = document.getElementById("modal-player-gameover");
    const scoreEl = document.getElementById("gameover-final-score");
    const coinsEl = document.getElementById("gameover-final-coins");

    if (scoreEl) scoreEl.textContent = finalScore;
    if (coinsEl) coinsEl.textContent = finalCoins;
    if (modal) modal.style.display = "flex";

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(330, "square", 0.15, 0.2);
      setTimeout(() => SoundEngine.playChiptuneTone(261, "square", 0.25, 0.3), 160);
    }
  }
};

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    GamePlayerEngine.init();
  });
}
