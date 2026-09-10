/**
 * UNIFIVE Engine - Mobile & Virtual Controls Subsystem
 */
const MobileControlsManager = {
  isTouchDevice: false,
  isMobileScreen: false,
  visibilityMode: "auto",
  customizationEnabled: true,
  activeButtons: { dpad_up: false, dpad_down: false, dpad_left: false, dpad_right: false, triangle: false, circle: false, cross: false, square: false },
  stickState: { active: false, originX: 0, originY: 0, currentX: 0, currentY: 0, dirX: 0, dirY: 0 },
  defaultLayout: typeof VControlState !== "undefined" ? VControlState.defaultLayout : {},
  currentLayout: null,
  isCustomizing: false,
  activeCustomizerTool: "move",
  editorPreviewVisible: false,

  init() {
    if (typeof VControlState !== "undefined") {
      VControlState.checkDevice(this);
      VControlState.loadSavedLayout(this);
    }
    if (typeof VControlTouch !== "undefined") {
      VControlTouch.bindButtons(this);
      VControlTouch.bindStick(this);
    }
    if (typeof VControlCustomizer !== "undefined") VControlCustomizer.bindUI(this);
    if (typeof VControlResize !== "undefined") VControlResize.init(this);
    if (typeof VControlDom !== "undefined") VControlDom.applyLayout(this);

    // Wire toggle buttons for editor-mode virtual controls preview
    const self = this;
    const bindToggleBtn = (id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener("click", () => self.toggleEditorPreview());
      }
    };
    bindToggleBtn("btn-dock-toggle-vcontrols");
    bindToggleBtn("btn-toggle-preview-vcontrols");
  },

  toggleEditorPreview() {
    this.editorPreviewVisible = !this.editorPreviewVisible;
    // Sync active state on both toggle buttons
    ["btn-dock-toggle-vcontrols", "btn-toggle-preview-vcontrols"].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle("active", this.editorPreviewVisible);
    });
    if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(this);
    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(this.editorPreviewVisible ? 540 : 380, "square", 0.04, 0.07);
    }
  },

  isMobile() { return this.isTouchDevice || this.isMobileScreen; },
  isDraggable() { return this.isCustomizing || this.editorPreviewVisible; },
  applyLayout() {
    if (typeof VControlDom !== "undefined") VControlDom.applyLayout(this);
  },
  openCustomizer() {
    this.isCustomizing = true;
    // Customization is live: dismiss the pause dialog and resume the game so
    // players can place controls against the active scene.
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      GamePlayerEngine.isPaused = false;
    }
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) pauseModal.style.display = "none";
    const playerPane = document.getElementById("game-player-pane");
    if (playerPane) playerPane.classList.add("customizing-controls");
    const overlay = document.getElementById("vcontrols-customizer-overlay");
    if (overlay) overlay.style.display = "block";
    if (typeof VControlCustomizer !== "undefined") VControlCustomizer.setCustomizerTool(this, "move");
    if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(this);
  },
  closeCustomizer() {
    this.isCustomizing = false;
    const playerPane = document.getElementById("game-player-pane");
    if (playerPane) playerPane.classList.remove("customizing-controls");
    const overlay = document.getElementById("vcontrols-customizer-overlay");
    if (overlay) overlay.style.display = "none";
    if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(this);
    // Saving/exiting customization returns to the pause menu. The player can
    // then choose when to resume gameplay.
    if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) {
      GamePlayerEngine.isPaused = true;
      const pauseModal = document.getElementById("modal-player-pause");
      if (pauseModal) pauseModal.style.display = "flex";
    }
  }
};
