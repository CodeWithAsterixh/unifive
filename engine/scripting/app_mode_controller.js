/**
 * UNIFIVE Scripting - App Mode Controller
 */
const AppModeController = {
  currentMode: "canvas",
  activeTargetId: null,
  activeCategory: "events",
  objectScripts: {},
  panX: 40,
  panY: 40,
  zoom: 1.0,

  init() {
    document.addEventListener("click", (e) => this.handleModeClick(e));
    if (typeof BlockPalette !== "undefined") BlockPalette.init();
    if (typeof BlockDragSnap !== "undefined") BlockDragSnap.init();
    if (typeof CodeRuntimeEngine !== "undefined") CodeRuntimeEngine.init();
    this.bindWorkspaceZoomControls();
    this.bindStagePreviewControls();
    this.updateWorkspaceTransform();
  },

  bindStagePreviewControls() {
    const btnToggleStage = document.getElementById("btn-toggle-code-stage");
    const previewSection = document.getElementById("code-preview-section");
    const stageSidebar = document.getElementById("code-stage-sidebar");
    if (btnToggleStage) {
      btnToggleStage.addEventListener("click", () => {
        let isCollapsed = false;
        if (stageSidebar) {
          isCollapsed = stageSidebar.classList.toggle("collapsed");
        }
        if (previewSection) {
          previewSection.classList.toggle("collapsed", isCollapsed);
        }
        const icon = btnToggleStage.querySelector("i");
        if (icon) {
          icon.className = isCollapsed ? "ph ph-caret-down" : "ph ph-caret-up";
        }
        btnToggleStage.title = isCollapsed ? "Expand Stage Preview" : "Minimize / Expand Stage Preview";
        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(isCollapsed ? 380 : 540, "square", 0.04, 0.07);
        }
        setTimeout(() => {
          if (typeof resizeStageCanvas === "function") resizeStageCanvas();
          if (typeof MobileControlsManager !== "undefined") MobileControlsManager.applyLayout();
        }, 60);
      });
    }
  },

  bindWorkspaceZoomControls() {
    const zoomIn = document.getElementById("btn-code-zoom-in");
    const zoomOut = document.getElementById("btn-code-zoom-out");
    const center = document.getElementById("btn-code-center");
    const dropZone = document.getElementById("code-drop-zone");

    if (zoomIn) zoomIn.addEventListener("click", () => {
      this.zoom = Math.min(2.5, this.zoom * 1.2);
      this.updateWorkspaceTransform();
    });
    if (zoomOut) zoomOut.addEventListener("click", () => {
      this.zoom = Math.max(0.35, this.zoom / 1.2);
      this.updateWorkspaceTransform();
    });
    if (center) center.addEventListener("click", () => {
      this.panX = 40;
      this.panY = 40;
      this.zoom = 1.0;
      this.updateWorkspaceTransform();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "sine", 0.05, 0.08);
    });
    if (dropZone) {
      dropZone.addEventListener("wheel", (event) => {
        event.preventDefault();
        this.zoom = Math.max(0.35, Math.min(2.5, this.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
        this.updateWorkspaceTransform();
      }, { passive: false });

      let initialPinchDist = 0;
      let initialZoom = 1.0;
      let panStartX = 0;
      let panStartY = 0;
      let initialPanX = 0;
      let initialPanY = 0;
      let isDropZonePanning = false;

      dropZone.addEventListener("touchstart", (e) => {
        if (e.target.closest(".code-block-item, .code-block-input, .code-block-select, button")) return;
        if (e.touches.length === 2) {
          isDropZonePanning = false;
          initialPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          initialZoom = this.zoom;
          if (e.cancelable) e.preventDefault();
        } else if (e.touches.length === 1) {
          isDropZonePanning = true;
          panStartX = e.touches[0].clientX;
          panStartY = e.touches[0].clientY;
          initialPanX = this.panX;
          initialPanY = this.panY;
        }
      }, { passive: false });

      dropZone.addEventListener("touchmove", (e) => {
        if (e.touches.length === 2 && initialPinchDist > 0) {
          const currentDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          const scale = currentDist / initialPinchDist;
          this.zoom = Math.max(0.35, Math.min(2.5, initialZoom * scale));
          this.updateWorkspaceTransform();
          if (e.cancelable) e.preventDefault();
        } else if (e.touches.length === 1 && isDropZonePanning) {
          const dx = e.touches[0].clientX - panStartX;
          const dy = e.touches[0].clientY - panStartY;
          this.panX = initialPanX + dx;
          this.panY = initialPanY + dy;
          this.updateWorkspaceTransform();
          if (e.cancelable) e.preventDefault();
        }
      }, { passive: false });

      dropZone.addEventListener("touchend", (e) => {
        if (e.touches.length < 2) initialPinchDist = 0;
        if (e.touches.length === 0) isDropZonePanning = false;
      });
    }
  },

  handleModeClick(e) {
    const target = e.target.closest("#btn-mode-canvas, #btn-mode-code, #btn-mode-play, #btn-mobile-nav-canvas, #btn-mobile-nav-code, #btn-mobile-nav-play");
    if (!target) return;
    if (target.id.includes("play")) {
      this.setMode("play");
    } else if (target.id.includes("code")) {
      this.setMode("code");
    } else {
      this.setMode("canvas");
    }
  },

  isCodeMode() {
    return this.currentMode === "code";
  },

  getActiveTargetId() {
    const selected = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    return selected ? selected.id : (this.activeTargetId || "global_stage");
  },

  getCurrentScripts() {
    const targetId = this.getActiveTargetId();
    if (!this.objectScripts[targetId]) this.objectScripts[targetId] = [];
    return this.objectScripts[targetId];
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
      const gridSize = 24 * this.zoom;
      dropZone.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
      dropZone.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    }
    if (zoomLabel) zoomLabel.textContent = `${Math.round(this.zoom * 100)}%`;
  },

  setMode(mode) {
    if (typeof ModeSwitcher !== "undefined") {
      ModeSwitcher.setMode(this, mode);
    }
  }
};
