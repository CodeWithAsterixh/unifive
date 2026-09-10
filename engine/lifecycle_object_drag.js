/**
 * UNIFIVE Engine - Lifecycle Object Drag Subsystem
 * Handles rotate, resize, and move transforms during mousemove.
 * Extracted from sketch.js lines 8104-8173.
 */
const LifecycleObjectDrag = {
  handleObjectDrag(e, cam) {
    const selectedItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!selectedItem) return;
    if (typeof mainCanvas === "undefined" || !mainCanvas) return;

    const rect = mainCanvas.elt.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const wx = cam.panX + (sx - width / 2) / cam.zoom;
    const wy = cam.panY + (sy - height / 2) / cam.zoom;

    const ds = WorldObjectsManager.dragState;
    const cx = ds.anchorX;
    const cy = ds.anchorY;

    if (ds.mode === "rotate") {
      this.applyRotate(selectedItem, wx, wy, cx, cy, e.shiftKey);
    } else if (ds.mode === "resize") {
      this.applyResize(selectedItem, wx, wy, ds, e.shiftKey);
    } else if (ds.mode === "move") {
      this.applyMove(selectedItem, wx, wy, ds);
    }
  },

  applyRotate(item, wx, wy, cx, cy, shiftKey) {
    const rad = Math.atan2(wy - cy, wx - cx);
    let deg = (rad * 180 / Math.PI) + 90;
    deg = ((deg % 360) + 360) % 360;
    if (shiftKey) deg = Math.round(deg / 15) * 15;
    item.rotation = Math.round(deg);
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
  },

  applyResize(item, wx, wy, ds, shiftKey) {
    const local = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.worldToLocal(item, wx, wy) : { lx: 0, ly: 0 };
    let w = ds.startItemW, h = ds.startItemH;
    const cx = ds.anchorX, cy = ds.anchorY;

    switch (ds.handle) {
      case "se": w = Math.round(local.lx * 2); h = Math.round(local.ly * 2); break;
      case "nw": w = Math.round(-local.lx * 2); h = Math.round(-local.ly * 2); break;
      case "ne": w = Math.round(local.lx * 2); h = Math.round(-local.ly * 2); break;
      case "sw": w = Math.round(-local.lx * 2); h = Math.round(local.ly * 2); break;
      case "e":  w = Math.round(local.lx * 2); break;
      case "w":  w = Math.round(-local.lx * 2); break;
      case "s":  h = Math.round(local.ly * 2); break;
      case "n":  h = Math.round(-local.ly * 2); break;
    }

    if ((typeof PropertiesController !== "undefined" && PropertiesController.lockAspect) || shiftKey) {
      const ratio = ds.startItemW / ds.startItemH;
      if (ds.handle === "e" || ds.handle === "w") { h = Math.round(w / ratio); }
      else if (ds.handle === "n" || ds.handle === "s") { w = Math.round(h * ratio); }
      else {
        if (Math.abs(w / ds.startItemW) > Math.abs(h / ds.startItemH)) { h = Math.round(w / ratio); }
        else { w = Math.round(h * ratio); }
      }
    }

    w = Math.max(16, w);
    h = Math.max(16, h);
    item.w = w;
    item.h = h;
    item.x = Math.round(cx - w / 2);
    item.y = Math.round(cy - h / 2);
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
  },

  applyMove(item, wx, wy, ds) {
    const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
    const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
    const dx = wx - ds.startX;
    const dy = wy - ds.startY;
    item.x = Math.round(Math.max(0, Math.min(wWidth - item.w, ds.startItemX + dx)));
    item.y = Math.round(Math.max(0, Math.min(wHeight - item.h, ds.startItemY + dy)));
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
  }
};
