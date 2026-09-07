/**
 * UNIFIVE Engine - Drawer Navigation Subsystem
 * Off-canvas sliding drawer animation, backdrop click dismiss, and responsive mobile panel toggles.
 */
const DrawerNavigation = {
  bindDrawerEvents(controller) {
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => controller.toggleDrawer());
    }

    const btnClose = document.getElementById("btn-close-controls-drawer");
    if (btnClose) {
      btnClose.addEventListener("click", () => controller.closeDrawer());
    }

    const btnCloseBlocks = document.getElementById("btn-close-blocks-drawer");
    if (btnCloseBlocks) {
      btnCloseBlocks.addEventListener("click", () => controller.closeDrawer());
    }

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
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
        }
      });
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => controller.closeDrawer());
    }
  },

  openDrawer(controller) {
    controller.isDrawerOpen = true;
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
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.04, 0.08);
  },

  closeDrawer(controller) {
    controller.isDrawerOpen = false;
    const controlsPane = document.getElementById("controls-pane");
    const codeToolboxPane = document.getElementById("code-toolbox-pane");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (controlsPane) controlsPane.classList.remove("drawer-open");
    if (codeToolboxPane) codeToolboxPane.classList.remove("drawer-open");

    if (backdrop) {
      backdrop.classList.remove("active");
      setTimeout(() => {
        if (!controller.isDrawerOpen) backdrop.style.display = "none";
      }, 250);
    }
  }
};
