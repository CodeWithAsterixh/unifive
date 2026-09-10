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
  },

  isMobile() { return this.isTouchDevice || this.isMobileScreen; },
  isDraggable() { return this.isCustomizing || this.editorPreviewVisible; },
  openCustomizer() {
    this.isCustomizing = true;
    if (typeof VControlCustomizer !== "undefined") VControlCustomizer.setCustomizerTool(this, "move");
    if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(this);
  },
  closeCustomizer() {
    this.isCustomizing = false;
    if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(this);
  }
};
