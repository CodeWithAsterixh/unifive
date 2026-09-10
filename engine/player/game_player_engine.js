/**
 * UNIFIVE Engine - Game Player Engine Subsystem
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
    this.isPlaying = true;
    this.isPaused = false;
    this.isControlEnabled = true;
    if (typeof PlayerState !== "undefined") {
      PlayerState.captureSnapshot(this);
      PlayerState.resolveInitialPlayableCharacter(this);
    }
    document.body.classList.add("mode-play");
    document.body.classList.remove("mode-canvas", "mode-code");
    if (typeof PlayerCamera !== "undefined") PlayerCamera.initCamera(this);
    if (typeof VControlDom !== "undefined" && typeof MobileControlsManager !== "undefined") VControlDom.updateGamepadVisibility(MobileControlsManager);
    if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.start("when_flag");
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(523, "triangle", 0.08, 0.15);
  },

  exit() {
    this.isPlaying = false;
    this.isPaused = false;
    if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.stopAll();
    if (typeof PlayerState !== "undefined") PlayerState.restoreSnapshot(this);
    document.body.classList.remove("mode-play");
    if (typeof AppModeController !== "undefined") AppModeController.setMode(this.previousAppMode || "canvas", true);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(440, "sine", 0.06, 0.08);
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
  }
};
