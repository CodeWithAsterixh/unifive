/**
 * UNIFIVE Engine - Create Panel Controller Subsystem
 * Aggregator coordinating asset categories (create_palette.js) and gallery items (create_items.js).
 */
const CreatePanelController = {
  get assetsData() {
    return typeof CreatePalette !== "undefined" ? CreatePalette.assetsData : null;
  },
  set assetsData(val) {
    if (typeof CreatePalette !== "undefined") CreatePalette.assetsData = val;
  },

  activeCategoryId: null,
  selectedAssetId: null,
  selectedAsset: null,
  draggedItem: null,

  async init() {
    if (typeof CreatePalette !== "undefined") {
      await CreatePalette.loadAssetsData();
      CreatePalette.renderCategories(this);
    }
  },

  onPerspectiveChange() {
    this.activeCategoryId = null;
    if (typeof CreatePalette !== "undefined") {
      CreatePalette.renderCategories(this);
    }
  },

  selectAsset(item) {
    if (typeof CreateItems !== "undefined") {
      CreateItems.selectAsset(this, item);
    }
  }
};