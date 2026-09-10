/**
 * UNIFIVE Engine - Config Modal Subsystem
 */
const ConfigModal = {
  updateColorUI(hex) {
    if (typeof CfgColorPicker !== "undefined") CfgColorPicker.updateColorUI(hex);
  },
  bindColorControls() {
    if (typeof CfgColorPicker !== "undefined") CfgColorPicker.bindColorControls();
  },
  bindGameplayToggles() {
    if (typeof CfgToggles !== "undefined") CfgToggles.bindGameplayToggles();
  }
};
