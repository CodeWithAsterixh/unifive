const ViewController = {
  currentView: "sidefacing", // "topdown" | "sidefacing"

  init() {
    document.querySelectorAll(".btn-view-topdown").forEach(btn => {
      btn.addEventListener("click", () => this.setView("topdown"));
    });
    document.querySelectorAll(".btn-view-sidefacing").forEach(btn => {
      btn.addEventListener("click", () => this.setView("sidefacing"));
    });
  },

  setView(view) {
    if (this.currentView === view) return;
    const previousView = this.currentView;

    // 1. Snapshot and save current active scene to the non-blocking store before switching
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.saveCurrentScene();
    }

    // 2. Set new active view
    this.currentView = view;

    // 3. Update view buttons in header and sidebar
    const topdownBtns = document.querySelectorAll(".btn-view-topdown");
    const sidefacingBtns = document.querySelectorAll(".btn-view-sidefacing");

    if (view === "topdown") {
      topdownBtns.forEach(btn => btn.classList.add("active"));
      sidefacingBtns.forEach(btn => btn.classList.remove("active"));
      SoundEngine.playAction("toggle_on");
    } else {
      topdownBtns.forEach(btn => btn.classList.remove("active"));
      sidefacingBtns.forEach(btn => btn.classList.add("active"));
      SoundEngine.playAction("toggle_off");
    }

    // 4. Load the target scene data (world config, items, undo stacks, categories)
    if (typeof AsyncSceneStore !== "undefined") {
      AsyncSceneStore.loadSceneToActive(view);
    }
  },

  toggleView() {
    const nextView = this.currentView === "topdown" ? "sidefacing" : "topdown";
    this.setView(nextView);
  }
};

// ============================================================================
// 5. CREATE PANEL CONTROLLER (Categories Sidebar + Items Gallery)
// ============================================================================