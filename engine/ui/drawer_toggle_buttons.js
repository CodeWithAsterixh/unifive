/**
 * UNIFIVE Engine - Drawer Toggle Buttons Subsystem
 */
const DrawerToggleButtons = {
  bindButtons(controller) {
    const btnToggle = document.getElementById("btn-toggle-sidebar");
    if (btnToggle) btnToggle.addEventListener("click", () => controller.toggleDrawer());
    const btnClose = document.getElementById("btn-close-controls-drawer");
    if (btnClose) btnClose.addEventListener("click", () => controller.closeDrawer());
    const btnCloseBlocks = document.getElementById("btn-close-blocks-drawer");
    if (btnCloseBlocks) btnCloseBlocks.addEventListener("click", () => controller.closeDrawer());
    const backdrop = document.getElementById("sidebar-backdrop");
    if (backdrop) backdrop.addEventListener("click", () => controller.closeDrawer());
  }
};
