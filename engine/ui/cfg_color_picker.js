/**
 * UNIFIVE Engine - Config Color Picker Subsystem
 */
const CfgColorPicker = {
  init(controller) {
    const bgPicker = document.getElementById("cfg-bg-color");
    if (bgPicker) {
      bgPicker.addEventListener("input", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.BG_COLOR = e.target.value;
      });
    }
    const gridPicker = document.getElementById("cfg-grid-color");
    if (gridPicker) {
      gridPicker.addEventListener("input", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.GRID_COLOR = e.target.value;
      });
    }
  }
};
