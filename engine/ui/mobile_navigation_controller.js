const MobileNavigationController = {
  isDrawerOpen: false,

  init() {
    // 1. Header Drawer Toggle Button
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => this.toggleDrawer());
    }

    // 2. Mobile Bottom Nav Play Button
    const btnNavPlay = document.getElementById("btn-mobile-nav-play");
    if (btnNavPlay) {
      btnNavPlay.addEventListener("click", () => {
        if (typeof GamePlayer !== "undefined") {
          GamePlayer.togglePlay();
        }
        this.closeDrawer();
      });
    }

    // 3. Mobile Bottom Nav Canvas & Code Mode Buttons
    const btnNavCanvas = document.getElementById("btn-mobile-nav-canvas");
    if (btnNavCanvas) {
      btnNavCanvas.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("canvas");
        }
        this.closeDrawer();
      });
    }

    const btnNavCode = document.getElementById("btn-mobile-nav-code");
    if (btnNavCode) {
      btnNavCode.addEventListener("click", () => {
        if (typeof AppModeController !== "undefined") {
          AppModeController.setMode("code");
        }
        this.closeDrawer();
      });
    }

    // 4. Drawer Close Buttons (Controls & Blocks Palette)
    const btnClose = document.getElementById("btn-close-controls-drawer");
    if (btnClose) {
      btnClose.addEventListener("click", () => this.closeDrawer());
    }

    const btnCloseBlocks = document.getElementById("btn-close-blocks-drawer");
    if (btnCloseBlocks) {
      btnCloseBlocks.addEventListener("click", () => this.closeDrawer());
    }

    // 5. Toggle Code Stage Preview Minimization (Mobile)
    const btnToggleStage = document.getElementById("btn-toggle-code-stage");
    if (btnToggleStage) {
      btnToggleStage.addEventListener("click", () => {
        const sidebar = document.getElementById("code-stage-sidebar");
        if (sidebar) {
          sidebar.classList.toggle("collapsed");
          const icon = btnToggleStage.querySelector("i");
          if (icon) {
            icon.className = sidebar.classList.contains("collapsed") ? "ph ph-caret-down" : "ph ph-caret-up";
          }
          SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
        }
      });
    }

    // 6. Sidebar Backdrop Click to Close
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => this.closeDrawer());
    }
  },

  openDrawer() {
    this.isDrawerOpen = true;
    const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
    const targetPane = isCode 
      ? document.getElementById("code-toolbox-pane") 
      : document.getElementById("controls-pane");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (targetPane) {
      targetPane.classList.add("drawer-open");
    }
    if (backdrop) {
      backdrop.style.display = "block";
      requestAnimationFrame(() => backdrop.classList.add("active"));
    }
    SoundEngine.playChiptuneTone(580, "square", 0.04, 0.08);
  },

  closeDrawer() {
    this.isDrawerOpen = false;
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (controlsPane) controlsPane.classList.remove("drawer-open");
    if (codeToolboxPane) codeToolboxPane.classList.remove("drawer-open");

    if (backdrop) {
      backdrop.classList.remove("active");
      setTimeout(() => {
        if (!this.isDrawerOpen) backdrop.style.display = "none";
      }, 250);
    }
  },

  toggleDrawer() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }
};

// ============================================================================
// 5. PANEL TAB CONTROLLER (CREATE vs LAYERS vs PROPS vs CONFIG)
// ============================================================================