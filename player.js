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
  visibilityMode: "auto", // "auto" | "show" | "hide"
  customizationEnabled: true,

  // Button states
  activeButtons: {
    dpad_up: false,
    dpad_down: false,
    dpad_left: false,
    dpad_right: false,
    triangle: false,
    circle: false,
    cross: false,
    square: false,
    l_shoulder: false,
    r_shoulder: false,
    start: false,
    select: false
  },

  // Analog Stick State
  stickState: {
    active: false,
    originX: 0,
    originY: 0,
    currentX: 0,
    currentY: 0,
    dirX: 0,
    dirY: 0
  },

  // Default factory layout
  defaultLayout: {
    "shoulder-l": { x: 20, y: 16, anchor: "top-left", scale: 1.0, visible: true },
    "shoulder-r": { x: 20, y: 16, anchor: "top-right", scale: 1.0, visible: true },
    "dpad": { x: 24, y: 90, anchor: "bottom-left", scale: 1.0, visible: true },
    "stick": { x: 24, y: 14, anchor: "bottom-left", scale: 1.0, visible: true },
    "system": { x: 0, y: 16, anchor: "bottom-center", scale: 1.0, visible: true },
    "actions": { x: 24, y: 50, anchor: "bottom-right", scale: 1.0, visible: true }
  },

  currentLayout: null,
  isCustomizing: false,
  activeCustomizerTool: "move",
  selectedGroupForEdit: null,
  draggedGroup: null,
  dragOffset: { x: 0, y: 0 },
  resizingGroup: null,
  resizeStart: { clientX: 0, clientY: 0, startScale: 1.0, originX: 0, originY: 0, baseDiag: 100 },
  editorPreviewVisible: false,

  init() {
    this.checkDevice();
    window.addEventListener("resize", () => {
      this.checkDevice();
      this.updateGamepadVisibility();
    });
    this.loadSavedLayout();
    this.bindVirtualGamepad();
    this.bindCustomizerUI();
    this.applyLayout();

    // Bind Editor Canvas & Code Stage Preview Toggle Buttons
    const btnDockToggle = document.getElementById("btn-dock-toggle-vcontrols");
    if (btnDockToggle) {
      btnDockToggle.addEventListener("click", () => this.toggleEditorPreview());
    }

    const btnPreviewToggle = document.getElementById("btn-toggle-preview-vcontrols");
    if (btnPreviewToggle) {
      btnPreviewToggle.addEventListener("click", () => this.toggleEditorPreview());
    }

    // Keyboard shortcut 'V' for Virtual Controls Toggle in Editor
    window.addEventListener("keydown", (e) => {
      if (e.code === "KeyV" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) return;
        if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
        e.preventDefault();
        this.toggleEditorPreview();
      }
    });
  },

  toggleEditorPreview(forceState = null) {
    if (forceState !== null) {
      this.editorPreviewVisible = !!forceState;
    } else {
      this.editorPreviewVisible = !this.editorPreviewVisible;
    }

    const btnDockToggle = document.getElementById("btn-dock-toggle-vcontrols");
    if (btnDockToggle) {
      btnDockToggle.classList.toggle("active", this.editorPreviewVisible);
    }

    const btnPreviewToggle = document.getElementById("btn-toggle-preview-vcontrols");
    if (btnPreviewToggle) {
      btnPreviewToggle.classList.toggle("active", this.editorPreviewVisible);
    }

    this.updateGamepadVisibility();
  },

  checkDevice() {
    this.isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    this.isMobileScreen = window.innerWidth <= 860;
  },

  isMobile() {
    return this.isTouchDevice || this.isMobileScreen;
  },

  isDraggable() {
    if (this.isCustomizing) return true;
    if (this.editorPreviewVisible) return true;
    if (this.visibilityMode === "show" && (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying)) return true;
    return false;
  },

  setGamepadVisibilityMode(mode) {
    this.visibilityMode = mode || "auto";
    this.updateGamepadVisibility();
  },

  setCustomizationEnabled(enabled) {
    this.customizationEnabled = !!enabled;
    const btnCustomize = document.getElementById("btn-pause-customize-controls");
    if (btnCustomize) {
      btnCustomize.style.display = this.customizationEnabled ? "flex" : "none";
    }
  },

  updateGamepadVisibility() {
    const pad = document.getElementById("mobile-virtual-gamepad");
    if (!pad) return;

    if (this.isCustomizing) {
      pad.style.display = "block";
      pad.classList.add("customizer-active");
      pad.classList.remove("editor-preview-active");
      return;
    } else {
      pad.classList.remove("customizer-active");
    }

    if (this.editorPreviewVisible) {
      pad.style.display = "block";
      pad.classList.add("editor-preview-active");
      return;
    } else {
      pad.classList.remove("editor-preview-active");
    }

    if (this.visibilityMode === "show") {
      pad.style.display = "block";
      if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) {
        pad.classList.add("editor-preview-active");
      } else {
        pad.classList.remove("editor-preview-active");
      }
      return;
    }

    if (this.visibilityMode === "hide") {
      pad.style.display = "none";
      pad.classList.remove("editor-preview-active");
      return;
    }

    // "auto" mode: only show when playing or running scripts on mobile/touch screen
    const isPlayingOrRunning = (typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) ||
                               (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning);

    if (isPlayingOrRunning && this.isMobile()) {
      pad.style.display = "block";
      pad.classList.remove("editor-preview-active");
    } else {
      pad.style.display = "none";
      pad.classList.remove("editor-preview-active");
    }
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

  isButtonPressed(buttonQuery) {
    if (!buttonQuery) return false;
    const q = String(buttonQuery).trim().toLowerCase();

    if (q === "any" || q === "any button" || q === "any_button") {
      return Object.values(this.activeButtons).some(Boolean);
    }

    if (q.includes("cross") || q === "✕" || q === "x" || q === "jump") return !!this.activeButtons.cross;
    if (q.includes("circle") || q === "◯" || q === "o" || q === "attack" || q === "z") return !!this.activeButtons.circle;
    if (q.includes("square") || q === "□" || q === "special") return !!this.activeButtons.square;
    if (q.includes("triangle") || q === "▲" || q === "menu" || q === "y") return !!this.activeButtons.triangle;

    if (q === "dpad up" || q === "up" || q === "dpad_up") return !!this.activeButtons.dpad_up;
    if (q === "dpad down" || q === "down" || q === "dpad_down") return !!this.activeButtons.dpad_down;
    if (q === "dpad left" || q === "left" || q === "dpad_left") return !!this.activeButtons.dpad_left;
    if (q === "dpad right" || q === "right" || q === "dpad_right") return !!this.activeButtons.dpad_right;

    if (q.includes("l shoulder") || q === "l_shoulder" || q === "l") return !!this.activeButtons.l_shoulder;
    if (q.includes("r shoulder") || q === "r_shoulder" || q === "r") return !!this.activeButtons.r_shoulder;

    if (q === "start") return !!this.activeButtons.start;
    if (q === "select") return !!this.activeButtons.select;

    return false;
  },

  pressButton(btnId, isDown) {
    if (!this.activeButtons.hasOwnProperty(btnId)) return;
    this.activeButtons[btnId] = isDown;

    // Map to virtual keys in PlayerInputManager
    if (btnId === "dpad_up") PlayerInputManager.setVirtualKey("up", isDown);
    if (btnId === "dpad_down") PlayerInputManager.setVirtualKey("down", isDown);
    if (btnId === "dpad_left") PlayerInputManager.setVirtualKey("left", isDown);
    if (btnId === "dpad_right") PlayerInputManager.setVirtualKey("right", isDown);

    if (btnId === "cross") PlayerInputManager.setVirtualKey("jump", isDown);
    if (btnId === "circle") PlayerInputManager.setVirtualKey("attack", isDown);
    if (btnId === "square") PlayerInputManager.setVirtualKey("interact", isDown);

    if (isDown) {
      // Trigger when_vcontrol event on runtime engine
      if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
        CodeRuntimeEngine.triggerEvent("when_vcontrol", btnId);
        if (btnId === "cross") CodeRuntimeEngine.triggerEvent("when_key", "space");
        if (btnId === "circle") CodeRuntimeEngine.triggerEvent("when_key", "z");
        if (btnId === "square") CodeRuntimeEngine.triggerEvent("when_key", "x");
        if (btnId === "triangle") CodeRuntimeEngine.triggerEvent("when_key", "c");
        if (btnId === "dpad_up") CodeRuntimeEngine.triggerEvent("when_key", "up arrow");
        if (btnId === "dpad_down") CodeRuntimeEngine.triggerEvent("when_key", "down arrow");
        if (btnId === "dpad_left") CodeRuntimeEngine.triggerEvent("when_key", "left arrow");
        if (btnId === "dpad_right") CodeRuntimeEngine.triggerEvent("when_key", "right arrow");
      }

      if (btnId === "start") {
        GamePlayerEngine.togglePause();
      }

      // Only action buttons play subtle click tone. Directional/joystick inputs have NO sound.
      if (typeof SoundEngine !== "undefined") {
        if (["cross", "circle", "square", "triangle"].includes(btnId)) {
          const freq = btnId === "cross" ? 587 : btnId === "circle" ? 494 : btnId === "square" ? 440 : 659;
          SoundEngine.playChiptuneTone(freq, "square", 0.02, 0.05);
        }
      }
    }
  },

  bindVirtualGamepad() {
    // 1. Digital Buttons (D-Pad, Actions, Shoulders, System)
    const allButtons = document.querySelectorAll(".vcontrol-dpad-btn, .vcontrol-action-btn, .vcontrol-shoulder-btn, .vcontrol-system-btn");
    allButtons.forEach(btn => {
      const btnId = btn.getAttribute("data-button");
      if (!btnId) return;

      const onStart = (e) => {
        if (this.isDraggable()) return;
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add("active");
        this.pressButton(btnId, true);
      };

      const onEnd = (e) => {
        if (this.isDraggable()) return;
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove("active");
        this.pressButton(btnId, false);
      };

      btn.addEventListener("touchstart", onStart, { passive: false });
      btn.addEventListener("touchend", onEnd, { passive: false });
      btn.addEventListener("touchcancel", onEnd, { passive: false });
      btn.addEventListener("mousedown", onStart);
      btn.addEventListener("mouseup", onEnd);
      btn.addEventListener("mouseleave", onEnd);
    });

    // 2. Analog Thumbstick
    const stickBase = document.getElementById("vcontrol-stick-base");
    const stickKnob = document.getElementById("vcontrol-stick-knob");
    if (stickBase && stickKnob) {
      const maxDist = 28;

      const handleStickMove = (clientX, clientY) => {
        const dx = clientX - this.stickState.originX;
        const dy = clientY - this.stickState.originY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxDist);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        stickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Normalized vector
        const normX = clampedDist > 0 ? (knobX / maxDist) : 0;
        const normY = clampedDist > 0 ? (knobY / maxDist) : 0;
        this.stickState.dirX = normX;
        this.stickState.dirY = normY;

        // Threshold directional triggers
        const deadzone = 0.35;
        this.pressButton("dpad_left", normX < -deadzone);
        this.pressButton("dpad_right", normX > deadzone);
        this.pressButton("dpad_up", normY < -deadzone);
        this.pressButton("dpad_down", normY > deadzone);
      };

      const startStick = (clientX, clientY) => {
        if (this.isDraggable()) return;
        const rect = stickBase.getBoundingClientRect();
        this.stickState.active = true;
        this.stickState.originX = rect.left + rect.width / 2;
        this.stickState.originY = rect.top + rect.height / 2;
        handleStickMove(clientX, clientY);
      };

      const endStick = () => {
        if (!this.stickState.active) return;
        this.stickState.active = false;
        stickKnob.style.transform = "translate(0px, 0px)";
        this.pressButton("dpad_left", false);
        this.pressButton("dpad_right", false);
        this.pressButton("dpad_up", false);
        this.pressButton("dpad_down", false);
      };

      stickBase.addEventListener("touchstart", (e) => {
        if (this.isDraggable()) return;
        if (e.touches.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          startStick(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      window.addEventListener("touchmove", (e) => {
        if (this.stickState.active && e.touches.length > 0) {
          for (let i = 0; i < e.touches.length; i++) {
            const t = e.touches[i];
            const distFromOrigin = Math.hypot(t.clientX - this.stickState.originX, t.clientY - this.stickState.originY);
            if (distFromOrigin < 120) {
              handleStickMove(t.clientX, t.clientY);
              break;
            }
          }
        }
      }, { passive: false });

      window.addEventListener("touchend", endStick, { passive: false });
      window.addEventListener("touchcancel", endStick, { passive: false });

      stickBase.addEventListener("mousedown", (e) => {
        if (this.isDraggable()) return;
        startStick(e.clientX, e.clientY);
        const onMouseMove = (ev) => {
          if (this.stickState.active) handleStickMove(ev.clientX, ev.clientY);
        };
        const onMouseUp = () => {
          endStick();
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    }
  },

  // 3. Layout Persistence
  loadSavedLayout() {
    try {
      const saved = localStorage.getItem("u5_vcontrols_layout");
      if (saved) {
        this.currentLayout = JSON.parse(saved);
      }
    } catch (err) {
      console.warn("Failed to parse saved virtual controls layout:", err);
    }
    if (!this.currentLayout) {
      this.currentLayout = JSON.parse(JSON.stringify(this.defaultLayout));
    }
  },

  saveLayout() {
    try {
      localStorage.setItem("u5_vcontrols_layout", JSON.stringify(this.currentLayout));
    } catch (err) {
      console.warn("Failed to save virtual controls layout:", err);
    }
  },

  applyLayout() {
    if (!this.currentLayout) return;
    Object.keys(this.currentLayout).forEach(groupKey => {
      const cfg = this.currentLayout[groupKey];
      const el = document.getElementById(`vcontrol-${groupKey}`);
      if (!el || !cfg) return;

      el.style.removeProperty("top");
      el.style.removeProperty("bottom");
      el.style.removeProperty("left");
      el.style.removeProperty("right");
      el.style.removeProperty("transform");

      const scale = cfg.scale || 1.0;
      if (cfg.anchor === "top-left" || !cfg.anchor) {
        el.style.top = `${cfg.y}px`;
        el.style.left = `${cfg.x}px`;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "top left";
      } else if (cfg.anchor === "top-right") {
        el.style.top = `${cfg.y}px`;
        el.style.right = `${cfg.x}px`;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "top right";
      } else if (cfg.anchor === "bottom-left") {
        el.style.bottom = `${cfg.y}px`;
        el.style.left = `${cfg.x}px`;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "bottom left";
      } else if (cfg.anchor === "bottom-right") {
        el.style.bottom = `${cfg.y}px`;
        el.style.right = `${cfg.x}px`;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "bottom right";
      } else if (cfg.anchor === "bottom-center") {
        el.style.bottom = `${cfg.y}px`;
        el.style.left = `calc(50% + ${cfg.x}px)`;
        el.style.transform = `translateX(-50%) scale(${scale})`;
        el.style.transformOrigin = "bottom center";
      }

      el.style.display = cfg.visible !== false ? "" : "none";
    });
  },

  // 4. Interactive Customizer Mode
  openCustomizer() {
    this.isCustomizing = true;
    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal) pauseModal.style.display = "none";

    const customizerOverlay = document.getElementById("vcontrols-customizer-overlay");
    const gamepadOverlay = document.getElementById("mobile-virtual-gamepad");
    if (customizerOverlay) customizerOverlay.style.display = "block";
    if (gamepadOverlay) {
      gamepadOverlay.style.display = "block";
      gamepadOverlay.classList.add("customizer-active");
    }

    this.applyLayout();
    this.setCustomizerTool("move");
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.05, 0.1);
  },

  closeCustomizer() {
    this.isCustomizing = false;
    this.saveLayout();

    const customizerOverlay = document.getElementById("vcontrols-customizer-overlay");
    const gamepadOverlay = document.getElementById("mobile-virtual-gamepad");
    if (customizerOverlay) customizerOverlay.style.display = "none";
    if (gamepadOverlay) {
      gamepadOverlay.classList.remove("customizer-active");
    }

    document.querySelectorAll(".vcontrol-group").forEach(el => el.classList.remove("selected-for-edit"));

    const pauseModal = document.getElementById("modal-player-pause");
    if (pauseModal && GamePlayerEngine.isPlaying && GamePlayerEngine.isPaused) {
      pauseModal.style.display = "flex";
    }

    this.updateGamepadVisibility();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(440, "square", 0.05, 0.08);
  },

  setCustomizerTool(toolName) {
    this.activeCustomizerTool = toolName;
    document.querySelectorAll(".customizer-tool-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tool") === toolName);
    });

    const resizeBar = document.getElementById("customizer-resize-bar");
    const visBox = document.getElementById("customizer-visibility-box");
    if (resizeBar) resizeBar.style.display = toolName === "resize" ? "flex" : "none";
    if (visBox) visBox.style.display = toolName === "visibility" ? "flex" : "none";

    if (toolName === "visibility") {
      this.syncVisibilityCheckboxes();
    }
  },

  syncVisibilityCheckboxes() {
    const dpadCheck = document.getElementById("vis-check-dpad");
    const stickCheck = document.getElementById("vis-check-stick");
    const actionsCheck = document.getElementById("vis-check-actions");
    const shouldersCheck = document.getElementById("vis-check-shoulders");
    const systemCheck = document.getElementById("vis-check-system");

    if (dpadCheck) dpadCheck.checked = this.currentLayout.dpad?.visible !== false;
    if (stickCheck) stickCheck.checked = this.currentLayout.stick?.visible !== false;
    if (actionsCheck) actionsCheck.checked = this.currentLayout.actions?.visible !== false;
    if (shouldersCheck) shouldersCheck.checked = this.currentLayout["shoulder-l"]?.visible !== false;
    if (systemCheck) systemCheck.checked = this.currentLayout.system?.visible !== false;
  },

  bindCustomizerUI() {
    // Tool buttons
    document.querySelectorAll(".customizer-tool-btn").forEach(btn => {
      const tool = btn.getAttribute("data-tool");
      btn.addEventListener("click", () => {
        if (tool === "back") {
          this.closeCustomizer();
        } else if (tool === "reset") {
          this.currentLayout = JSON.parse(JSON.stringify(this.defaultLayout));
          this.applyLayout();
          this.syncVisibilityCheckboxes();
          if (typeof SoundEngine !== "undefined") {
            SoundEngine.playChiptuneTone(659, "triangle", 0.08, 0.15);
            setTimeout(() => SoundEngine.playChiptuneTone(880, "triangle", 0.12, 0.18), 80);
          }
        } else {
          this.setCustomizerTool(tool);
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(480, "square", 0.03, 0.06);
        }
      });
    });

    // Resize Scale Buttons
    const btnScaleDown = document.getElementById("btn-customizer-scale-down");
    const btnScaleUp = document.getElementById("btn-customizer-scale-up");
    const labelScale = document.getElementById("customizer-resize-label");

    const updateScale = (delta) => {
      const groupKey = this.selectedGroupForEdit || "dpad";
      if (!this.currentLayout[groupKey]) return;
      let curr = this.currentLayout[groupKey].scale || 1.0;
      curr = Math.round(Math.min(1.6, Math.max(0.6, curr + delta)) * 10) / 10;
      this.currentLayout[groupKey].scale = curr;
      this.applyLayout();
      if (labelScale) labelScale.textContent = `${groupKey.toUpperCase()} Scale: ${Math.round(curr * 100)}%`;
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.02, 0.04);
    };

    if (btnScaleDown) btnScaleDown.addEventListener("click", () => updateScale(-0.1));
    if (btnScaleUp) btnScaleUp.addEventListener("click", () => updateScale(0.1));

    // Visibility Checkboxes
    const dpadCheck = document.getElementById("vis-check-dpad");
    const stickCheck = document.getElementById("vis-check-stick");
    const actionsCheck = document.getElementById("vis-check-actions");
    const shouldersCheck = document.getElementById("vis-check-shoulders");
    const systemCheck = document.getElementById("vis-check-system");

    const bindVisToggle = (input, groupKeys) => {
      if (!input) return;
      input.addEventListener("change", () => {
        groupKeys.forEach(k => {
          if (this.currentLayout[k]) this.currentLayout[k].visible = input.checked;
        });
        this.applyLayout();
      });
    };

    bindVisToggle(dpadCheck, ["dpad"]);
    bindVisToggle(stickCheck, ["stick"]);
    bindVisToggle(actionsCheck, ["actions"]);
    bindVisToggle(shouldersCheck, ["shoulder-l", "shoulder-r"]);
    bindVisToggle(systemCheck, ["system"]);

    // 5. Drag-to-move & Independent Resizing for Control Groups
    document.querySelectorAll(".vcontrol-group").forEach(groupEl => {
      const groupKey = groupEl.getAttribute("data-group");
      if (!groupKey) return;

      // Ensure dedicated resize handle exists on the control group
      let resizeHandle = groupEl.querySelector(".vcontrol-resize-handle");
      if (!resizeHandle) {
        resizeHandle = document.createElement("div");
        resizeHandle.className = "vcontrol-resize-handle";
        resizeHandle.setAttribute("data-group", groupKey);
        resizeHandle.setAttribute("title", "Drag Handle to Resize Scale");
        groupEl.appendChild(resizeHandle);
      }

      // A. RESIZING: Independent resize handle interaction
      const onResizeStart = (e, clientX, clientY) => {
        if (!this.isDraggable()) return;
        e.preventDefault();
        e.stopPropagation();

        this.selectedGroupForEdit = groupKey;
        this.resizingGroup = groupKey;
        this.draggedGroup = null; // Ensure drag is NOT triggered
        resizeHandle.classList.add("resizing");

        document.querySelectorAll(".vcontrol-group").forEach(el => el.classList.remove("selected-for-edit"));
        groupEl.classList.add("selected-for-edit");

        const rect = groupEl.getBoundingClientRect();
        const startScale = (this.currentLayout[groupKey] && this.currentLayout[groupKey].scale) || 1.0;
        const baseW = rect.width / startScale;
        const baseH = rect.height / startScale;
        const baseDiag = Math.hypot(baseW, baseH);

        this.resizeStart = {
          clientX,
          clientY,
          startScale,
          originX: rect.left,
          originY: rect.top,
          baseDiag: Math.max(30, baseDiag)
        };
      };

      resizeHandle.addEventListener("touchstart", (e) => {
        if (this.isDraggable() && e.touches.length > 0) {
          onResizeStart(e, e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: false });

      resizeHandle.addEventListener("mousedown", (e) => {
        if (this.isDraggable()) {
          onResizeStart(e, e.clientX, e.clientY);
        }
      });

      // B. DRAGGING: Independent movement of group body (repositioning ONLY)
      const onDragStart = (clientX, clientY, targetEl) => {
        if (!this.isDraggable()) return;
        if (this.resizingGroup) return;
        if (targetEl && targetEl.closest(".vcontrol-resize-handle")) return;

        this.selectedGroupForEdit = groupKey;
        this.draggedGroup = groupKey;
        this.resizingGroup = null;
        groupEl.classList.add("dragging");

        document.querySelectorAll(".vcontrol-group").forEach(el => el.classList.remove("selected-for-edit"));
        groupEl.classList.add("selected-for-edit");

        if (labelScale && this.currentLayout[groupKey]) {
          labelScale.textContent = `${groupKey.toUpperCase()} Scale: ${Math.round((this.currentLayout[groupKey].scale || 1) * 100)}%`;
        }

        const rect = groupEl.getBoundingClientRect();
        this.dragOffset = {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      groupEl.addEventListener("touchstart", (e) => {
        if (this.isDraggable() && e.touches.length > 0) {
          if (e.target.closest(".vcontrol-resize-handle")) return;
          e.preventDefault();
          e.stopPropagation();
          onDragStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
        }
      }, { passive: false });

      groupEl.addEventListener("mousedown", (e) => {
        if (this.isDraggable()) {
          if (e.target.closest(".vcontrol-resize-handle")) return;
          e.preventDefault();
          e.stopPropagation();
          onDragStart(e.clientX, e.clientY, e.target);
        }
      });
    });

    // Window move & release for distinct resizing and dragging
    const onMove = (clientX, clientY) => {
      if (!this.isDraggable()) return;

      // 1. Handle Resizing (Only updates scale, never moves position)
      if (this.resizingGroup) {
        const groupKey = this.resizingGroup;
        const cfg = this.currentLayout[groupKey];
        if (!cfg) return;

        const dx = clientX - this.resizeStart.originX;
        const dy = clientY - this.resizeStart.originY;
        const currentDiag = Math.hypot(dx, dy);
        let newScale = (currentDiag / this.resizeStart.baseDiag);
        newScale = Math.round(Math.min(2.0, Math.max(0.5, newScale)) * 20) / 20; // 0.05 step
        cfg.scale = newScale;
        this.applyLayout();

        const labelScale = document.getElementById("customizer-resize-label");
        if (labelScale) labelScale.textContent = `${groupKey.toUpperCase()} Scale: ${Math.round(newScale * 100)}%`;
        return;
      }

      // 2. Handle Dragging (Only updates position, never changes scale)
      if (this.draggedGroup) {
        const groupKey = this.draggedGroup;
        const cfg = this.currentLayout[groupKey];
        if (!cfg) return;

        const pad = document.getElementById("mobile-virtual-gamepad");
        const padRect = pad ? pad.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const groupEl = document.getElementById(`vcontrol-${groupKey}`);
        const gRect = groupEl ? groupEl.getBoundingClientRect() : { width: 80, height: 80 };

        // Calculate position relative to virtual gamepad overlay container
        let localX = Math.round(clientX - padRect.left - this.dragOffset.x);
        let localY = Math.round(clientY - padRect.top - this.dragOffset.y);

        // Clamp within container
        localX = Math.max(2, Math.min(padRect.width - gRect.width - 2, localX));
        localY = Math.max(2, Math.min(padRect.height - gRect.height - 2, localY));

        cfg.anchor = "top-left";
        cfg.x = localX;
        cfg.y = localY;

        this.applyLayout();
      }
    };

    const onRelease = () => {
      let changed = false;
      if (this.resizingGroup) {
        const handle = document.querySelector(`.vcontrol-resize-handle[data-group="${this.resizingGroup}"]`);
        if (handle) handle.classList.remove("resizing");
        this.resizingGroup = null;
        changed = true;
      }
      if (this.draggedGroup) {
        const groupEl = document.getElementById(`vcontrol-${this.draggedGroup}`);
        if (groupEl) groupEl.classList.remove("dragging");
        this.draggedGroup = null;
        changed = true;
      }
      if (changed) {
        this.saveLayout();
      }
    };

    window.addEventListener("touchmove", (e) => {
      if (this.isDraggable() && (this.draggedGroup || this.resizingGroup) && e.touches.length > 0) {
        e.preventDefault();
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener("touchend", onRelease, { passive: false });
    window.addEventListener("touchcancel", onRelease, { passive: false });

    window.addEventListener("mousemove", (e) => {
      if (this.isDraggable() && (this.draggedGroup || this.resizingGroup)) {
        onMove(e.clientX, e.clientY);
      }
    });

    window.addEventListener("mouseup", onRelease);
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
      btnCustomize.addEventListener("click", () => MobileControlsManager.openCustomizer());
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
    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
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
      if (btnCustomize) {
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
