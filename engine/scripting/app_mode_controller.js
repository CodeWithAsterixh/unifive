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
    if (btnToggleStage && previewSection) {
      btnToggleStage.addEventListener("click", () => {
        const isCollapsed = previewSection.classList.toggle("collapsed");
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
    if (dropZone) dropZone.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.zoom = Math.max(0.35, Math.min(2.5, this.zoom * (event.deltaY < 0 ? 1.1 : 0.9)));
      this.updateWorkspaceTransform();
    }, { passive: false });
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
