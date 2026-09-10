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
  selectPart(groupKey, partKey = null) {
    this.selectedGroup = groupKey;
    this.selectedPart = partKey;
    document.querySelectorAll(".vcontrol-group.selected-for-edit").forEach(el => el.classList.remove("selected-for-edit"));
    document.querySelectorAll(".vcontrol-part-selected").forEach(el => el.classList.remove("vcontrol-part-selected"));
    const groupEl = document.getElementById("vcontrol-" + groupKey);
    if (groupEl) {
      groupEl.classList.add("selected-for-edit");
      const definition = partKey && typeof VControlState !== "undefined" ? VControlState.getPart(groupKey, partKey) : null;
      const partEl = definition ? groupEl.querySelector(definition.selector) : null;
      if (partEl) partEl.classList.add("vcontrol-part-selected");
    }
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromVirtualControl(this, groupKey, partKey);
    if (typeof LayersController !== "undefined") LayersController.update();
  },
  clearPartSelection() {
    if (!this.selectedGroup) return false;
    this.selectedGroup = null;
    this.selectedPart = null;
    document.querySelectorAll(".vcontrol-group.selected-for-edit, .vcontrol-part-selected").forEach(el => {
      el.classList.remove("selected-for-edit", "vcontrol-part-selected");
    });
    const selectedWorldItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(selectedWorldItem);
    if (typeof LayersController !== "undefined") LayersController.update();
    return true;
  },
  movePart(groupKey, partKey, direction) {
    const cfg = this.currentLayout && this.currentLayout[groupKey];
    const definitions = typeof VControlState !== "undefined" ? (VControlState.partDefinitions[groupKey] || []) : [];
    if (!cfg || !partKey || definitions.length === 0) return;
    const order = cfg.partOrder || definitions.map(part => part.key);
    const index = order.indexOf(partKey);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    cfg.partOrder = order;
    this.applyLayout();
    if (typeof VControlState !== "undefined") VControlState.saveLayout(this);
    if (typeof LayersController !== "undefined") LayersController.update();
  },
  togglePartVisibility(groupKey, partKey) {
    const cfg = this.currentLayout && this.currentLayout[groupKey];
    if (!cfg || !partKey) return;
    cfg.parts = cfg.parts || {};
    const part = cfg.parts[partKey] = cfg.parts[partKey] || {};
    part.visible = part.visible === false;
    this.applyLayout();
    if (typeof VControlState !== "undefined") VControlState.saveLayout(this);
    if (typeof LayersController !== "undefined") LayersController.update();
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
