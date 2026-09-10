/**
 * UNIFIVE Engine - Properties Flip & Opacity Subsystem
 */
const PropFlipOpacity = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const flipX = document.getElementById("prop-flip-x");
    const flipY = document.getElementById("prop-flip-y");
    const opacity = document.getElementById("prop-opacity");

    if (flipX) {
      flipX.addEventListener("change", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.flipX = !!e.target.checked;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (flipY) {
      flipY.addEventListener("change", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.flipY = !!e.target.checked;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (opacity) {
      opacity.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.opacity = parseFloat(e.target.value) || 1;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
  }
};
