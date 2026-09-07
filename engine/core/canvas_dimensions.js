let mainCanvas;

function getStageDimensions() {
  if ((typeof GamePlayerEngine !== "undefined" && GamePlayerEngine.isPlaying) || (typeof document !== "undefined" && document.body && document.body.classList.contains("mode-play"))) {
    return {
      w: window.innerWidth,
      h: window.innerHeight
    };
  }
  const container = document.getElementById("canvas-container");
  if (container) {
    return {
      w: container.clientWidth || 800,
      h: container.clientHeight || 600
    };
  }
  return { w: 800, h: 600 };
}

function resizeStageCanvas() {
  const dims = getStageDimensions();
  if (mainCanvas && (width !== dims.w || height !== dims.h)) {
    resizeCanvas(dims.w, dims.h);
    WorldConfig.clampPan();
  }
}

// ============================================================================
// 9. RESIZABLE SPLIT-PANE CONTROLLER
// ============================================================================
const SplitterController = {
  isDragging: false,
  minControlsWidth: 220,
  minStageWidth: 200,

  getActivePane() {
    if (typeof AppModeController !== "undefined" && AppModeController.isCodeMode()) {
      return document.getElementById("code-toolbox-pane");
    }
    return document.getElementById("controls-pane");
  },

  init() {
    const splitter = document.getElementById("pane-splitter");
    const controlsPane = document.getElementById("controls-pane");
    const workspaceContainer = document.getElementById("workspace-container");

    if (!splitter || !workspaceContainer) return;

    const savedCanvasWidth = localStorage.getItem("unifive_canvas_split_width") || localStorage.getItem("unifive_split_width");
    if (savedCanvasWidth && controlsPane) {
      controlsPane.style.width = savedCanvasWidth;
    }

    const startDrag = (e) => {
      this.isDragging = true;
      splitter.classList.add("dragging");
      document.body.classList.add("resizing");
      e.preventDefault();
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const rect = workspaceContainer.getBoundingClientRect();
      let newWidth = clientX - rect.left;

      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      const minW = isCode ? 360 : this.minControlsWidth;
      const maxControlsWidth = rect.width - this.minStageWidth;
      newWidth = Math.max(minW, Math.min(maxControlsWidth, newWidth));

      const activePane = this.getActivePane();
      if (activePane) activePane.style.width = `${newWidth}px`;
      resizeStageCanvas();
    };

    const stopDrag = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      splitter.classList.remove("dragging");
      document.body.classList.remove("resizing");
      const activePane = this.getActivePane();
      if (activePane) {
        const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
        const key = isCode ? "unifive_code_split_width" : "unifive_canvas_split_width";
        localStorage.setItem(key, activePane.style.width);
      }
      resizeStageCanvas();
    };

    // Mouse Events
    splitter.addEventListener("mousedown", startDrag);
    window.addEventListener("mousemove", doDrag);
    window.addEventListener("mouseup", stopDrag);

    // Touch Events
    splitter.addEventListener("touchstart", startDrag, { passive: false });
    window.addEventListener("touchmove", doDrag, { passive: false });
    window.addEventListener("touchend", stopDrag);
  }
};

// ============================================================================
// 10. VARIABLE MANAGER (Variables Store, HUD Watchers & Creation Modal)
// ============================================================================