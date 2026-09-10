/**
 * UNIFIVE Engine - Virtual Controls State Subsystem
 */
const VControlState = {
  // Part-level properties deliberately exclude position. These parts form the
  // input geometry of their parent control; moving one would make its visual
  // location disagree with its touch target. Whole controls own positioning.
  partDefinitions: {
    "shoulder-l": [{ key: "button", label: "L button", selector: ".vcontrol-shoulder-btn", scale: true }],
    "shoulder-r": [{ key: "button", label: "R button", selector: ".vcontrol-shoulder-btn", scale: true }],
    dpad: [
      { key: "up", label: "Up button", selector: ".dpad-up", scale: true },
      { key: "left", label: "Left button", selector: ".dpad-left", scale: true },
      { key: "center", label: "Center box", selector: ".vcontrol-dpad-center", scale: true },
      { key: "right", label: "Right button", selector: ".dpad-right", scale: true },
      { key: "down", label: "Down button", selector: ".dpad-down", scale: true }
    ],
    stick: [
      { key: "outer", label: "Outer circle", selector: ".vcontrol-stick-base", scale: false },
      { key: "inner", label: "Inner thumb", selector: ".vcontrol-stick-knob", scale: false }
    ],
    system: [
      { key: "select", label: "Select button", selector: "[data-button='select']", scale: true },
      { key: "start", label: "Start button", selector: "[data-button='start']", scale: true }
    ],
    actions: [
      { key: "triangle", label: "Triangle button", selector: ".action-triangle", scale: true },
      { key: "circle", label: "Circle button", selector: ".action-circle", scale: true },
      { key: "cross", label: "Cross button", selector: ".action-cross", scale: true },
      { key: "square", label: "Square button", selector: ".action-square", scale: true }
    ]
  },
  getPart(groupKey, partKey) {
    return (this.partDefinitions[groupKey] || []).find(part => part.key === partKey) || null;
  },
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
