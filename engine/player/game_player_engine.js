/**
 * UNIFIVE Engine - Game Player Engine Subsystem
 * Game play mode lifecycle, scene snapshot/restore, camera tracking lerp, solid collision, and player loop.
 */
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
    if (typeof PlayerInputManager !== "undefined") PlayerInputManager.init();
    if (typeof MobileControlsManager !== "undefined") MobileControlsManager.init();
    this.bindUI();
  },

  bindUI() {
    // Header PLAY button
    const btnPlay = document.getElementById("btn-mode-play");
    if (btnPlay) {
      btnPlay.addEventListener("click", () => this.togglePlay());
    }

    // Mobile Bottom Nav PLAY button
    const btnMobilePlay = document.getElementById("btn-mobile-nav-play");
    if (btnMobilePlay) {
      btnMobilePlay.addEventListener("click", () => this.togglePlay());
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

    const btnCustomize = document.getElementById("btn-pause-customize-controls");
    if (btnCustomize) {
      btnCustomize.addEventListener("click", () => {
        if (typeof MobileControlsManager !== "undefined") MobileControlsManager.openCustomizer();
      });
    }

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
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items && typeof MobileControlsManager !== "undefined") {
      MobileControlsManager.filterObjectVisibility(WorldObjectsManager.items);
    }

    // 4. Update UI Layout to PLAY Mode
    document.body.classList.add("mode-play");
    document.body.classList.remove("mode-canvas", "mode-code");

    const btnCanvas = document.getElementById("btn-mode-canvas");
    const btnCode = document.getElementById("btn-mode-code");
    const btnPlay = document.getElementById("btn-mode-play");
    const mobileBtnCanvas = document.getElementById("btn-mobile-nav-canvas");
    const mobileBtnCode = document.getElementById("btn-mobile-nav-code");
    const mobileBtnPlay = document.getElementById("btn-mobile-nav-play");

    if (btnCanvas) btnCanvas.classList.remove("active");
    if (btnCode) btnCode.classList.remove("active");
    if (btnPlay) btnPlay.classList.add("active");
    if (mobileBtnCanvas) mobileBtnCanvas.classList.remove("active");
    if (mobileBtnCode) mobileBtnCode.classList.remove("active");
    if (mobileBtnPlay) mobileBtnPlay.classList.add("active");

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
    if (typeof MobileControlsManager !== "undefined") {
      MobileControlsManager.updateGamepadVisibility();
    }

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
    const mobileBtnPlay = document.getElementById("btn-mobile-nav-play");
    if (btnPlay) btnPlay.classList.remove("active");
    if (mobileBtnPlay) mobileBtnPlay.classList.remove("active");

    const prevMode = this.previousAppMode || "canvas";
    if (typeof AppModeController !== "undefined") {
      AppModeController.setMode(prevMode, true);
    } else {
      const controlsPane = document.getElementById("controls-pane");
      const floatingDock = document.getElementById("floating-dock");
      if (controlsPane) controlsPane.style.display = "flex";
      if (floatingDock) floatingDock.style.display = "flex";
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
    if (pauseModal) {
      pauseModal.style.display = "flex";
      const btnCustomize = document.getElementById("btn-pause-customize-controls");
      if (btnCustomize && typeof MobileControlsManager !== "undefined") {
        btnCustomize.style.display = MobileControlsManager.customizationEnabled ? "flex" : "none";
      }
    }
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
        panX: typeof WorldConfig !== "undefined" ? WorldConfig.panX : 1000,
        panY: typeof WorldConfig !== "undefined" ? WorldConfig.panY : 750,
        zoom: typeof WorldConfig !== "undefined" ? WorldConfig.zoom : 1.0
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

    if (this.sceneSnapshot.worldConfig && typeof WorldConfig !== "undefined") {
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
      this.camX = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth / 2 : 1000;
      this.camY = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight / 2 : 750;
    }

    // Set pixel-perfect or comfortable game zoom
    const isMobile = typeof MobileControlsManager !== "undefined" ? MobileControlsManager.isMobile() : false;
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
    const worldW = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth : 2000;
    const worldH = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight : 1500;

    // Horizontal clamping: never expose void outside [0, worldW]
    if (worldW > viewW) {
      const minCamX = viewW / 2;
      const maxCamX = worldW - viewW / 2;
      this.camX = Math.max(minCamX, Math.min(maxCamX, this.camX));
    } else {
      this.camX = worldW / 2;
    }

    // Vertical clamping: never expose void outside [0, worldH]
    if (worldH > viewH) {
      const minCamY = viewH / 2;
      const maxCamY = worldH - viewH / 2;
      this.camY = Math.max(minCamY, Math.min(maxCamY, this.camY));
    } else {
      this.camY = worldH / 2;
    }

    if (typeof WorldConfig !== "undefined") {
      WorldConfig.panX = this.camX;
      WorldConfig.panY = this.camY;
      WorldConfig.zoom = this.camZoom;
    }
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
      const obsY = it.y + obsH * 0.4;
      const obsBoxH = obsH * 0.6;

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

    const moveLeft = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("left");
    const moveRight = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("right");
    const moveUp = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("up");
    const moveDown = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("down");

    let dx = 0;
    let dy = 0;

    if (view === "topdown") {
      if (moveLeft) dx -= this.playerSpeed;
      if (moveRight) dx += this.playerSpeed;
      if (moveUp) dy -= this.playerSpeed;
      if (moveDown) dy += this.playerSpeed;

      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      this.applyMovementWithCollision(hero, dx, dy);

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

      this.applyMovementWithCollision(hero, dx, dy);
    }

    const worldW = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth : 2000;
    const worldH = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight : 1500;
    const marginX = Math.min(16, (hero.w || 40) * 0.2);
    const marginY = Math.min(16, (hero.h || 40) * 0.2);
    hero.x = Math.max(marginX, Math.min(worldW - marginX, hero.x));
    hero.y = Math.max(marginY, Math.min(worldH - marginY, hero.y));
  },

  updateCameraFollow() {
    if (this.activePlayableItem) {
      this.targetCamX = this.activePlayableItem.x;
      this.targetCamY = this.activePlayableItem.y;
    }

    this.camX += (this.targetCamX - this.camX) * this.lerpFactor;
    this.camY += (this.targetCamY - this.camY) * this.lerpFactor;

    this.clampCamera();
  },

  updateHUD() {
    // VariableManager.drawWatchers renders on canvas HUD
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

// Global Alias for backwards compatibility
const GamePlayer = {
  togglePlay() {
    GamePlayerEngine.togglePlay();
  },
  enter() {
    GamePlayerEngine.enter();
  },
  exit() {
    GamePlayerEngine.exit();
  }
};
