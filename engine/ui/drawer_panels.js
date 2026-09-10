/**
 * UNIFIVE Engine - Drawer Panels Subsystem
 */
const DrawerPanels = {
  open(controller) {
    const drawer = document.getElementById("controls-drawer");
    if (drawer) drawer.classList.add("open");
  },
  close(controller) {
    const drawer = document.getElementById("controls-drawer");
    if (drawer) drawer.classList.remove("open");
  }
};
