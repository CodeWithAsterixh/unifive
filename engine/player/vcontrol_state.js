/**
 * UNIFIVE Engine - Virtual Controls State Subsystem
 */
const VControlState = {
  defaultLayout: {
    "shoulder-l": { x: 20, y: 16, anchor: "top-left", scale: 1.0, visible: true },
    "shoulder-r": { x: 20, y: 16, anchor: "top-right", scale: 1.0, visible: true },
    "dpad": { x: 24, y: 90, anchor: "bottom-left", scale: 1.0, visible: true },
    "stick": { x: 24, y: 14, anchor: "bottom-left", scale: 1.0, visible: true },
    "system": { x: 0, y: 16, anchor: "bottom-center", scale: 1.0, visible: true },
    "actions": { x: 24, y: 50, anchor: "bottom-right", scale: 1.0, visible: true }
  },
  loadSavedLayout(manager) {
    try {
      const saved = localStorage.getItem("u5_vcontrols_layout");
      if (saved) manager.currentLayout = JSON.parse(saved);
    } catch (err) {
      console.warn("Failed to parse saved virtual controls layout:", err);
    }
    if (!manager.currentLayout) {
      manager.currentLayout = JSON.parse(JSON.stringify(this.defaultLayout));
    }
  },
  saveLayout(manager) {
    try {
      localStorage.setItem("u5_vcontrols_layout", JSON.stringify(manager.currentLayout));
    } catch (err) {
      console.warn("Failed to save virtual controls layout:", err);
    }
  },
  checkDevice(manager) {
    manager.isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    manager.isMobileScreen = window.innerWidth <= 860;
  }
};
