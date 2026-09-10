/**
 * UNIFIVE World - Objects Store Subsystem
 */
(function (global) {
  'use strict';

  const ObjectsStore = {
    items: [],
    selectedId: null,

    loadImageAsset(src, callback) {
      if (typeof ObjectsAssetLoader !== "undefined") ObjectsAssetLoader.loadImageAsset(src, callback);
    },

    addItem(assetData, targetX, targetY) {
      if (typeof ObjectsCrud === "undefined") return null;
      const newItem = ObjectsCrud.createItem(assetData, targetX, targetY);
      this.items.push(newItem);
      this.selectedId = newItem.id;
      return newItem;
    },

    getSelectedItem() {
      if (!this.selectedId) return null;
      for (const it of this.items) { if (it.id === this.selectedId) return it; }
      return null;
    },

    getItemAt(wx, wy) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        if (!it.hidden && wx >= it.x && wx <= it.x + it.w && wy >= it.y && wy <= it.y + it.h) return it;
      }
      return null;
    }
  };

  global.ObjectsStore = ObjectsStore;
})(typeof window !== 'undefined' ? window : globalThis);
