/**
 * UNIFIVE Engine - Mobile Navigation Controller Subsystem
 */
const MobileNavigationController = {
  init() {
    if (typeof BottomNav !== "undefined") BottomNav.init(this);
    if (typeof DrawerNavigation !== "undefined") DrawerNavigation.bindDrawerEvents(this);
    else if (typeof DrawerToggleButtons !== "undefined") DrawerToggleButtons.bindButtons(this);

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) {
        this.closeDrawer();
      }
    });
  },

  toggleDrawer() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.toggleDrawer(this);
    } else if (typeof DrawerPanels !== "undefined") {
      const isCode = typeof AppModeController !== "undefined" && AppModeController.isCodeMode();
      const targetPane = isCode ? document.getElementById("code-toolbox-pane") : document.getElementById("controls-pane");
      const isOpen = targetPane && targetPane.classList.contains("drawer-open");
      if (isOpen) DrawerPanels.close(this);
      else DrawerPanels.open(this);
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
  },

  openDrawer() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.openDrawer(this);
    } else if (typeof DrawerPanels !== "undefined") {
      DrawerPanels.open(this);
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
  },

  closeDrawer() {
    if (typeof DrawerNavigation !== "undefined") {
      DrawerNavigation.closeDrawer(this);
    } else if (typeof DrawerPanels !== "undefined") {
      DrawerPanels.close(this);
    }
  },

  switchMode(mode) {
    this.closeDrawer();
    if (typeof AppModeController !== "undefined") {
      AppModeController.setMode(mode);
    }
  }
};

if (typeof window !== "undefined") window.MobileNavigationController = MobileNavigationController;
if (typeof globalThis !== "undefined") globalThis.MobileNavigationController = MobileNavigationController;
