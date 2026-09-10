/**
 * UNIFIVE Engine - View Controller Subsystem
 */
const ViewController = {
  currentView: "sidefacing",

  init() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#btn-view-sidefacing, #btn-view-topdown");
      if (!btn) return;
      this.setView(btn.id.includes("sidefacing") ? "sidefacing" : "topdown");
    });
  },

  setView(viewId) {
    if (this.currentView === viewId) return;
    if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
    this.currentView = viewId;
    const btnSide = document.getElementById("btn-view-sidefacing");
    const btnTop = document.getElementById("btn-view-topdown");
    if (btnSide) btnSide.classList.toggle("active", viewId === "sidefacing");
    if (btnTop) btnTop.classList.toggle("active", viewId === "topdown");
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
