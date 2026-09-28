/**
 * UNIFIVE Engine - View Controller Subsystem
 */
const ViewController = {
  currentView: "sidefacing",

  init() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-view-mode, [data-view]");
      if (!btn) return;
      const view = btn.getAttribute("data-view") || (btn.classList.contains("btn-view-sidefacing") ? "sidefacing" : "topdown");
      this.setView(view);
    });
  },

  setView(viewId) {
    if (this.currentView === viewId) return;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
    this.currentView = viewId;

    // Synchronize all view switch buttons across desktop header and mobile sidebar
    document.querySelectorAll(".btn-view-sidefacing, [data-view='sidefacing']").forEach(el => {
      el.classList.toggle("active", viewId === "sidefacing");
    });
    document.querySelectorAll(".btn-view-topdown, [data-view='topdown']").forEach(el => {
      el.classList.toggle("active", viewId === "topdown");
    });

    if (typeof CreatePalette !== "undefined" && typeof CreatePanelController !== "undefined") {
      CreatePalette.renderCategories(CreatePanelController);
    }
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.loadSceneToActive(viewId);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(viewId === "sidefacing" ? 520 : 660, "square", 0.05, 0.08);
  },

  toggleView() {
    this.setView(this.currentView === "sidefacing" ? "topdown" : "sidefacing");
  }
};
