/**
 * UNIFIVE Engine - Create Panel Controller Subsystem
 */
const CreatePanelController = {
  activeCategoryId: null,
  selectedAssetId: null,
  selectedAsset: null,
  draggedItem: null,

  async init() {
    if (typeof CreatePalette !== "undefined") {
      await CreatePalette.loadAssetsData();
      CreatePalette.renderCategories(this);
    }
  }
};
