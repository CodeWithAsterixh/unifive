/**
 * UNIFIVE Engine - Config Toggles Subsystem
 */
const CfgToggles = {
  init(controller) {
    this.bindGameplayToggles();
  },

  bindGameplayToggles() {
    const layeringCheckbox = document.getElementById("cfg-responsive-layering");
    if (layeringCheckbox) {
      layeringCheckbox.checked = typeof WorldConfig !== "undefined" && WorldConfig.responsiveLayering !== false;
      layeringCheckbox.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setResponsiveLayering(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "sine", 0.04, 0.08);
      });
    }

    const autoGoAroundCheckbox = document.getElementById("cfg-auto-go-around");
    if (autoGoAroundCheckbox) {
      autoGoAroundCheckbox.checked = typeof WorldConfig !== "undefined" && WorldConfig.autoGoAround !== false;
      autoGoAroundCheckbox.addEventListener("change", (e) => {
        if (typeof WorldConfig !== "undefined") WorldConfig.setAutoGoAround(e.target.checked);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(540, "sine", 0.04, 0.08);
      });
    }
  }
};
