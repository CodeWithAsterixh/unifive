/**
 * UNIFIVE World - World Objects Z-Order, Duplicate & Delete Proxy Subsystem
 */
const WorldObjectsZOrderProxy = {
  bringToFront(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return;
    if (typeof ObjectsZOrder !== "undefined") {
      ObjectsZOrder.bringToFront(this.items, targetId);
    }
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
    if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(600, "triangle", 0.04, 0.08);
  },

  bringForward(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return;
    if (typeof ObjectsZOrder !== "undefined") {
      ObjectsZOrder.bringForward(this.items, targetId);
    }
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
    if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "triangle", 0.04, 0.08);
  },

  sendBackward(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return;
    if (typeof ObjectsZOrder !== "undefined") {
      ObjectsZOrder.sendBackward(this.items, targetId);
    }
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
    if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(440, "triangle", 0.04, 0.08);
  },

  sendToBack(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return;
    if (typeof ObjectsZOrder !== "undefined") {
      ObjectsZOrder.sendToBack(this.items, targetId);
    }
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
    if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(380, "triangle", 0.04, 0.08);
  },

  duplicateItem(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return null;
    const source = this.items.find(i => i.id === targetId);
    if (!source) return null;

    const clone = JSON.parse(JSON.stringify(source));
    clone.id = "item_" + Date.now() + "_" + Math.floor(Math.random() * 10000);
    clone.name = `${source.name || "Asset"} Copy`;
    clone.x = (source.x || 0) + 24;
    clone.y = (source.y || 0) + 24;
    clone.p5Img = source.p5Img;
    clone.p5SheetImg = source.p5SheetImg;
    clone.p5FrameImgs = source.p5FrameImgs ? [...source.p5FrameImgs] : null;
    clone.loaded = source.loaded;

    this.items.push(clone);
    this.selectItem(clone.id);
    if (typeof this.saveHistory === "function") this.saveHistory();
    if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
    if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
    if (typeof AppModeController !== "undefined" && typeof AppModeController.renderObjectsList === "function") {
      AppModeController.renderObjectsList();
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(700, "square", 0.05, 0.1);
    return clone;
  },

  deleteItem(id) {
    const targetId = id || this.selectedId;
    if (!targetId || !this.items) return;

    if (typeof LayersToggleMutations !== "undefined") {
      LayersToggleMutations.deleteItem(targetId, typeof LayersController !== "undefined" ? LayersController : { update: () => {} });
    } else {
      this.items = this.items.filter(it => it.id !== targetId);
      if (this.selectedId === targetId) {
        this.selectedId = null;
        if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(null);
        if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
      }
      if (typeof this.saveHistory === "function") this.saveHistory();
      if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
      if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
      if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(220, "square", 0.08, 0.1);
    }
  }
};

if (typeof WorldObjectsManager !== "undefined") {
  Object.assign(WorldObjectsManager, WorldObjectsZOrderProxy);
}
if (typeof window !== "undefined") window.WorldObjectsZOrderProxy = WorldObjectsZOrderProxy;
if (typeof globalThis !== "undefined") globalThis.WorldObjectsZOrderProxy = WorldObjectsZOrderProxy;
