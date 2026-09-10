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
  }
};
