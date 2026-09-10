/**
 * UNIFIVE Engine - Config Controller Subsystem
 */
const ConfigController = {
  init() {
    if (typeof CfgColorPicker !== "undefined") CfgColorPicker.init(this);
    if (typeof CfgToggles !== "undefined") CfgToggles.init(this);
    if (typeof StageLimits !== "undefined") StageLimits.init(this);
  },

  syncUIFromWorldConfig() {
    if (typeof WorldConfig === "undefined") return;
    const bgPicker = document.getElementById("cfg-bg-color");
    if (bgPicker) bgPicker.value = WorldConfig.bgColor || "#ffffff";
    const widthInput = document.getElementById("cfg-stage-width");
    if (widthInput) widthInput.value = WorldConfig.worldWidth || 2000;
    const heightInput = document.getElementById("cfg-stage-height");
    if (heightInput) heightInput.value = WorldConfig.worldHeight || 1500;
  }
};
