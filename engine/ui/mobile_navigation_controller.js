/**
 * UNIFIVE Engine - Mobile Navigation Controller Subsystem
 * Aggregator coordinating mobile bottom navigation (bottom_nav.js) and off-canvas sidebar drawer (drawer_navigation.js).
 */
const MobileNavigationController = {
  isDrawerOpen: false,

  init() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.bindDrawerEvents(this);
    }
    if (typeof BottomNav !== "undefined") {
      BottomNav.bindBottomNav(this);
    }
  },

  openDrawer() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.openDrawer(this);
    }
  },

  closeDrawer() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.closeDrawer(this);
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