/**
 * UNIFIVE Engine - Game Player Engine Subsystem
 * Complete Game Player loop, snapshot state, movement physics, camera tracking, and HUD UI.
 */
const GamePlayerEngine = {
  isPlaying: false,
  isPaused: false,
  isControlEnabled: true,
  activePlayableId: null,
  activePlayableItem: null,
  sceneSnapshot: null,
  previousAppMode: "canvas",
  camX: 0,
  camY: 0,
  camZoom: 1.0,
  targetCamX: 0,
  targetCamY: 0,
  lerpFactor: 0.12,
  playerSpeed: 6.5,

  init() {
    if (typeof PlayerInputManager !== "undefined") PlayerInputManager.init();
    if (typeof MobileControlsManager !== "undefined") MobileControlsManager.init();
    if (typeof PlayerMenu !== "undefined") PlayerMenu.bindUI(this);
  },

  togglePlay() {
    if (this.isPlaying) this.exit();
    else this.enter();
  },

  enter() {
    if (this.isPlaying) return;
    if (typeof AppModeController !== "undefined") {
      this.previousAppMode = AppModeController.currentMode || "canvas";
    }
    this.isPlaying = true;
    this.isPaused = false;
    this.isControlEnabled = true;

    if (typeof PlayerState !== "undefined") {
      PlayerState.captureSnapshot(this);
      PlayerState.resolveInitialPlayableCharacter(this);
    }

    document.body.classList.add("mode-play");
    document.body.classList.remove("mode-canvas", "mode-code");

    const gamePlayerPane = document.getElementById("game-player-pane");
    const playerCanvasContainer = document.getElementById("player-canvas-container");
    const canvasContainer = document.getElementById("canvas-container");

    if (gamePlayerPane) gamePlayerPane.style.display = "flex";
    if (canvasContainer && playerCanvasContainer) {
      playerCanvasContainer.appendChild(canvasContainer);
    }

    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }

    if (typeof PlayerCamera !== "undefined") PlayerCamera.initCamera(this);
    if (typeof VControlDom !== "undefined" && typeof MobileControlsManager !== "undefined") {
      VControlDom.updateGamepadVisibility(MobileControlsManager);
    }
    if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.start("when_flag");
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(523, "triangle", 0.08, 0.15);

    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 0);
    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 60);
  },

  exit() {
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.stopAll();
    if (typeof PlayerState !== "undefined") PlayerState.restoreSnapshot(this);

    // Restore #canvas-container back to its original parent (#stage-pane) before hiding the player pane
    const canvasContainer = document.getElementById("canvas-container");
    const stagePane = document.getElementById("stage-pane");
    if (canvasContainer && stagePane && canvasContainer.parentElement !== stagePane) {
      stagePane.insertBefore(canvasContainer, stagePane.firstChild);
    }

    const gamePlayerPane = document.getElementById("game-player-pane");
    if (gamePlayerPane) gamePlayerPane.style.display = "none";

    document.body.classList.remove("mode-play");
    if (typeof AppModeController !== "undefined") {
      AppModeController.setMode(this.previousAppMode || "canvas", true);
    }

    if (typeof resizeStageCanvas === "function") {
      resizeStageCanvas();
    }

    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(440, "sine", 0.06, 0.08);

    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 0);
    setTimeout(() => {
      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    }, 60);
  },

  restart() {
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.stopAll();
    if (typeof PlayerState !== "undefined") {
      PlayerState.restoreSnapshot(this, false);
      PlayerState.resolveInitialPlayableCharacter(this);
    }
    if (typeof PlayerCamera !== "undefined") PlayerCamera.initCamera(this);
    if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.start("when_flag");
  },

  togglePause() {
    if (this.isPaused) this.resume();
    else if (typeof PlayerMenu !== "undefined") PlayerMenu.pause(this);
  },

  resume() {
    if (typeof PlayerMenu !== "undefined") PlayerMenu.resume(this);
  },

  toggleFullscreen() {
    if (typeof FullscreenMode !== "undefined") FullscreenMode.toggleFullscreen();
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

          if (!this.getSolidObstacleCollision(testFootX, getFootY(hero.y), heroH, hero.id)) {
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

    const marginX = Math.min(16, (hero.w || 40) * 0.2);
    const marginY = Math.min(16, (hero.h || 40) * 0.2);
    const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
    const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
    hero.x = Math.max(marginX, Math.min(wWidth - marginX, hero.x));
    hero.y = Math.max(marginY, Math.min(wHeight - marginY, hero.y));
  },

  updateCameraFollow() {
    if (typeof PlayerCamera !== "undefined") {
      PlayerCamera.updateCameraFollow(this);
    } else {
      if (this.activePlayableItem) {
        this.targetCamX = this.activePlayableItem.x;
        this.targetCamY = this.activePlayableItem.y;
      }
      this.camX += (this.targetCamX - this.camX) * this.lerpFactor;
      this.camY += (this.targetCamY - this.camY) * this.lerpFactor;
    }
  },

  updateHUD() {
    if (typeof VariableWatchers !== "undefined" && VariableWatchers.renderWatchers) {
      VariableWatchers.renderWatchers();
    }
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
