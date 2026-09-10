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
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(500, "square", 0.04, 0.08);
  }
};
