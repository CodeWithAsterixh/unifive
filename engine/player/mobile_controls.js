/**
 * UNIFIVE Engine - Mobile & Virtual Controls Subsystem
 * PSP-style on-screen controls, analog stick math, layout customization, and device visibility filtering.
 */
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
    if (typeof PlayerInputManager !== "undefined") {
      switch (btnId) {
        case "dpad_up": PlayerInputManager.setVirtualKey("up", isDown); break;
        case "dpad_down": PlayerInputManager.setVirtualKey("down", isDown); break;
        case "dpad_left": PlayerInputManager.setVirtualKey("left", isDown); break;
        case "dpad_right": PlayerInputManager.setVirtualKey("right", isDown); break;
        case "cross": PlayerInputManager.setVirtualKey("jump", isDown); break;
        case "circle": PlayerInputManager.setVirtualKey("attack", isDown); break;
        case "square": PlayerInputManager.setVirtualKey("interact", isDown); break;
      }
    }

    if (isDown) {
      // Trigger when_vcontrol event on runtime engine
      if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
        CodeRuntimeEngine.triggerEvent("when_vcontrol", btnId);
        switch (btnId) {
          case "cross": CodeRuntimeEngine.triggerEvent("when_key", "space"); break;
          case "circle": CodeRuntimeEngine.triggerEvent("when_key", "z"); break;
          case "square": CodeRuntimeEngine.triggerEvent("when_key", "x"); break;
          case "triangle": CodeRuntimeEngine.triggerEvent("when_key", "c"); break;
          case "dpad_up": CodeRuntimeEngine.triggerEvent("when_key", "up arrow"); break;
          case "dpad_down": CodeRuntimeEngine.triggerEvent("when_key", "down arrow"); break;
          case "dpad_left": CodeRuntimeEngine.triggerEvent("when_key", "left arrow"); break;
          case "dpad_right": CodeRuntimeEngine.triggerEvent("when_key", "right arrow"); break;
        }
      }

      if (btnId === "start" && typeof GamePlayerEngine !== "undefined") {
        GamePlayerEngine.togglePause();
      }

      // Only action buttons play subtle click tone. Directional/joystick inputs have NO sound.
      if (typeof SoundEngine !== "undefined") {
        switch (btnId) {
          case "cross": SoundEngine.playChiptuneTone(587, "square", 0.02, 0.05); break;
          case "circle": SoundEngine.playChiptuneTone(494, "square", 0.02, 0.05); break;
          case "square": SoundEngine.playChiptuneTone(440, "square", 0.02, 0.05); break;
          case "triangle": SoundEngine.playChiptuneTone(659, "square", 0.02, 0.05); break;
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
    if (pauseModal && typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying && GamePlayerEngine.isPaused) {
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
        this.draggedGroup = null;
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

      // 1. Handle Resizing
      if (this.resizingGroup) {
        const groupKey = this.resizingGroup;
        const cfg = this.currentLayout[groupKey];
        if (!cfg) return;

        const dx = clientX - this.resizeStart.originX;
        const dy = clientY - this.resizeStart.originY;
        const currentDiag = Math.hypot(dx, dy);
        let newScale = (currentDiag / this.resizeStart.baseDiag);
        newScale = Math.round(Math.min(2.0, Math.max(0.5, newScale)) * 20) / 20;
        cfg.scale = newScale;
        this.applyLayout();

        const labelScale = document.getElementById("customizer-resize-label");
        if (labelScale) labelScale.textContent = `${groupKey.toUpperCase()} Scale: ${Math.round(newScale * 100)}%`;
        return;
      }

      // 2. Handle Dragging
      if (this.draggedGroup) {
        const groupKey = this.draggedGroup;
        const cfg = this.currentLayout[groupKey];
        if (!cfg) return;

        const pad = document.getElementById("mobile-virtual-gamepad");
        const padRect = pad ? pad.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        const groupEl = document.getElementById(`vcontrol-${groupKey}`);
        const gRect = groupEl ? groupEl.getBoundingClientRect() : { width: 80, height: 80 };

        let localX = Math.round(clientX - padRect.left - this.dragOffset.x);
        let localY = Math.round(clientY - padRect.top - this.dragOffset.y);

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
