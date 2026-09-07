const TabController = {
  currentTab: "create", // "create" | "layers" | "properties" | "config"

  init() {
    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        if (targetTab) this.setTab(targetTab);
      });
    });
  },

  setTab(tabId) {
    this.currentTab = tabId;

    const tabBtns = document.querySelectorAll(".panel-tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabBtns.forEach(btn => {
      const isTarget = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("active", isTarget);
      btn.setAttribute("aria-selected", isTarget ? "true" : "false");
    });

    tabPanes.forEach(pane => {
      const isTarget = pane.id === `tab-pane-${tabId}`;
      pane.classList.toggle("active", isTarget);
    });

    switch (tabId) {
      case "layers":
        if (typeof LayersController !== "undefined") LayersController.update();
        break;
      case "properties":
        if (typeof PropertiesController !== "undefined") {
          PropertiesController.updateFromSelected(typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null);
        }
        break;
      case "config":
        if (typeof ConfigController !== "undefined") ConfigController.syncUIFromWorldConfig();
        if (typeof U5Compiler !== "undefined") U5Compiler.updateStats();
        break;
      default:
        break;
    }

    SoundEngine.playChiptuneTone(380, "square", 0.06, 0.1);
  }
};

// ============================================================================
// 5B. LAYERS CONTROLLER (Visual Stacking Order, Drag-and-Drop Reordering, Visibility, Locking)
// ============================================================================