/**
 * UNIFIVE Engine - Drawer Panels Subsystem
 */
const DrawerPanels = {
  open(controller) {
    const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
    const targetPane = isCode 
      ? document.getElementById("code-toolbox-pane") 
      : document.getElementById("controls-pane");
    if (targetPane) {
      targetPane.classList.add("drawer-open");
    }
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.style.display = "block";
      // Force reflow for CSS opacity transition
      void backdrop.offsetWidth;
      backdrop.classList.add("active");
    }
  },

  close(controller) {
    const controlsPane = document.getElementById("controls-pane");
    const codePane = document.getElementById("code-toolbox-pane");
    if (controlsPane) controlsPane.classList.remove("drawer-open");
    if (codePane) codePane.classList.remove("drawer-open");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.classList.remove("active");
      backdrop.style.display = "none";
    }
  }
};

if (typeof window !== "undefined") window.DrawerPanels = DrawerPanels;
if (typeof globalThis !== "undefined") globalThis.DrawerPanels = DrawerPanels;
