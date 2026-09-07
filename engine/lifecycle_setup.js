/**
 * UNIFIVE Engine - Lifecycle Setup Subsystem
 * Subsystem boot sequence, UI event listeners, and workspace splitter divider.
 */
const SplitterController = {
  isDragging: false,
  startX: 0,
  startWidth: 0,

  init() {
    const splitter = document.getElementById("pane-splitter");
    const leftPane = document.getElementById("controls-pane");
    const codePane = document.getElementById("code-toolbox-pane");
    if (!splitter) return;

    splitter.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.startX = e.clientX;
      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      const targetPane = isCode ? codePane : leftPane;
      this.startWidth = targetPane ? targetPane.getBoundingClientRect().width : 380;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.startX;
      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      const targetPane = isCode ? codePane : leftPane;
      if (!targetPane) return;

      const minW = isCode ? 360 : 280;
      const maxW = Math.min(800, window.innerWidth - 300);
      const newWidth = Math.max(minW, Math.min(maxW, this.startWidth + dx));

      targetPane.style.width = `${newWidth}px`;
      if (isCode) {
        localStorage.setItem("unifive_code_split_width", `${newWidth}px`);
      } else {
        localStorage.setItem("unifive_split_width", `${newWidth}px`);
      }

      if (typeof resizeStageCanvas === "function") resizeStageCanvas();
    });

    window.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false;
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
        if (typeof resizeStageCanvas === "function") resizeStageCanvas();
      }
    });
  }
};

function initUIEventListeners() {
  const btnUndo = document.getElementById("btn-undo");
  const btnRedo = document.getElementById("btn-redo");
  const btnSound = document.getElementById("btn-sound");
  const btnFullscreen = document.getElementById("btn-fullscreen");

  if (btnUndo) {
    btnUndo.addEventListener("click", () => {
      if (typeof HistoryManager !== "undefined") HistoryManager.undo();
    });
  }

  if (btnRedo) {
    btnRedo.addEventListener("click", () => {
      if (typeof HistoryManager !== "undefined") HistoryManager.redo();
    });
  }

  if (btnSound) {
    btnSound.addEventListener("click", () => {
      if (typeof SoundEngine !== "undefined") SoundEngine.toggleMute();
    });
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  document.addEventListener("fullscreenchange", () => {
    const icon = document.getElementById("fullscreen-icon");
    if (icon) {
      icon.className = document.fullscreenElement ? "ph ph-corners-in" : "ph ph-corners-out";
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.code === "Space" && !isSpacePressed) {
      isSpacePressed = true;
      const container = document.getElementById("canvas-container");
      if (container) container.classList.add("space-pan-active");
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      if (typeof HistoryManager !== "undefined") HistoryManager.undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
      e.preventDefault();
      if (typeof HistoryManager !== "undefined") HistoryManager.redo();
    } else if (e.key.toLowerCase() === "m") {
      if (typeof SoundEngine !== "undefined") SoundEngine.toggleMute();
    } else if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
      if (typeof ViewController !== "undefined") {
        const nextView = ViewController.currentView === "sidefacing" ? "topdown" : "sidefacing";
        ViewController.setView(nextView);
      }
    } else if (e.key === "1") {
      if (typeof AppModeController !== "undefined") AppModeController.setMode("canvas");
    } else if (e.key === "2") {
      if (typeof AppModeController !== "undefined") AppModeController.setMode("code");
    } else if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey) {
      if (typeof GamePlayerEngine !== "undefined") {
        if (GamePlayerEngine.isPlaying) GamePlayerEngine.exit();
        else GamePlayerEngine.enter();
      }
    }
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
      isSpacePressed = false;
      const container = document.getElementById("canvas-container");
      if (container) container.classList.remove("space-pan-active");
    }
  });
}
