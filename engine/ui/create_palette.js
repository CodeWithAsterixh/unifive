/**
 * UNIFIVE Engine - Create Palette Subsystem
 */
const CreatePalette = {
  assetsData: null,

  async loadAssetsData() {
    try {
      let response = await fetch("assets.json");
      if (!response.ok) response = await fetch("../assets.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      this.assetsData = await response.json();
    } catch (e) {
      console.warn("Could not load assets.json via fetch, using fallback data.", e);
      this.assetsData = typeof CreateFallbackData !== "undefined" ? CreateFallbackData.getFallbackAssetsData() : null;
    }
  },

  getCategoriesForCurrentView() {
    if (!this.assetsData) return [];
    const view = (typeof ViewController !== "undefined" && ViewController.currentView) || "topdown";
    return this.assetsData[view] || [];
  },

  renderCategories(controller) {
    const sidebarEl = document.getElementById("create-kinds-list");
    if (!sidebarEl) return;
    const categories = this.getCategoriesForCurrentView();
    sidebarEl.innerHTML = "";

    if (categories.length === 0) {
      if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, null);
      return;
    }

    if (!controller.activeCategoryId || !categories.some(c => c.id === controller.activeCategoryId)) {
      controller.activeCategoryId = categories[0].id;
    }

    for (const cat of categories) {
      const btn = CreateCatButton.createButton(cat, controller, sidebarEl);
      sidebarEl.appendChild(btn);
    }

    const activeCat = categories.find(c => c.id === controller.activeCategoryId) || categories[0];
    if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, activeCat);
  }
};
