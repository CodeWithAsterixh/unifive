/**
 * UNIFIVE Engine - Drawer Navigation Subsystem
 */
const DrawerNavigation = {
  bindDrawerEvents(controller) {
    if (typeof DrawerToggleButtons !== "undefined") DrawerToggleButtons.bindButtons(controller);
  },
  openDrawer(controller) {
    if (typeof DrawerPanels !== "undefined") DrawerPanels.open(controller);
  },
  closeDrawer(controller) {
    if (typeof DrawerPanels !== "undefined") DrawerPanels.close(controller);
  },
  toggleDrawer(controller) {
    const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
    const targetPane = isCode 
      ? document.getElementById("code-toolbox-pane") 
      : document.getElementById("controls-pane");
    const isOpen = targetPane && targetPane.classList.contains("drawer-open");
    if (isOpen) {
      this.closeDrawer(controller);
    } else {
      this.openDrawer(controller);
    }
  }
};

if (typeof window !== "undefined") window.DrawerNavigation = DrawerNavigation;
if (typeof globalThis !== "undefined") globalThis.DrawerNavigation = DrawerNavigation;
