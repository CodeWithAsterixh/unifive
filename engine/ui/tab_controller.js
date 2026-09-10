/**
 * UNIFIVE Engine - Tab Controller Subsystem
 */
const TabController = {
  activeTab: "create",
  init() {
    const tabs = document.querySelectorAll(".panel-tab-btn");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        const targetTab = tab.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    }
  },
  switchTab(tabId) {
    this.activeTab = tabId;
    const tabs = document.querySelectorAll(".panel-tab-btn");
    for (const t of tabs) {
      const isActive = t.getAttribute("data-tab") === tabId;
      t.classList.toggle("active", isActive);
      t.setAttribute("aria-selected", isActive ? "true" : "false");
    }
    const panes = document.querySelectorAll(".tab-pane");
    for (const p of panes) {
      const isTarget = p.id === "tab-pane-" + tabId;
      p.classList.toggle("active", isTarget);
    }
    // Re-sync the inspector when it becomes visible. This matters when an
    // item was selected on the canvas before the user opened the Props tab.
    if (tabId === "properties" && typeof PropertiesController !== "undefined") {
      const virtualKey = typeof MobileControlsManager !== "undefined" && MobileControlsManager.editorPreviewVisible
        ? MobileControlsManager.selectedGroup
        : null;
      if (virtualKey) {
        PropertiesController.updateFromVirtualControl(MobileControlsManager, virtualKey);
        return;
      }
      const selected = typeof WorldObjectsManager !== "undefined"
        && typeof WorldObjectsManager.getSelectedItem === "function"
        ? WorldObjectsManager.getSelectedItem()
        : null;
      PropertiesController.updateFromSelected(selected);
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(500, "square", 0.04, 0.08);
  }
};
