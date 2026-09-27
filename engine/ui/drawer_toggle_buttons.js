/**
 * UNIFIVE Engine - Drawer Toggle Buttons Subsystem
 */
const DrawerToggleButtons = {
  bindButtons(controller) {
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        if (typeof controller.toggleDrawer === "function") {
          controller.toggleDrawer();
        } else if (typeof DrawerNavigation !== "undefined") {
          DrawerNavigation.toggleDrawer(controller);
        }
      });
    }

    const btnCloseControls = document.getElementById("btn-close-controls-drawer");
    if (btnCloseControls) {
      btnCloseControls.addEventListener("click", () => {
        if (typeof controller.closeDrawer === "function") {
          controller.closeDrawer();
        } else if (typeof DrawerNavigation !== "undefined") {
          DrawerNavigation.closeDrawer(controller);
        }
      });
    }

    const btnCloseBlocks = document.getElementById("btn-close-blocks-drawer");
    if (btnCloseBlocks) {
      btnCloseBlocks.addEventListener("click", () => {
        if (typeof controller.closeDrawer === "function") {
          controller.closeDrawer();
        } else if (typeof DrawerNavigation !== "undefined") {
          DrawerNavigation.closeDrawer(controller);
        }
      });
    }

    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", () => {
        if (typeof controller.closeDrawer === "function") {
          controller.closeDrawer();
        } else if (typeof DrawerNavigation !== "undefined") {
          DrawerNavigation.closeDrawer(controller);
        }
      });
    }
  }
};

if (typeof window !== "undefined") window.DrawerToggleButtons = DrawerToggleButtons;
if (typeof globalThis !== "undefined") globalThis.DrawerToggleButtons = DrawerToggleButtons;
