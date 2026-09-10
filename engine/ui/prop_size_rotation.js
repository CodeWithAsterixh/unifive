/**
 * UNIFIVE Engine - Properties Size & Rotation Subsystem
 */
const PropSizeRotation = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const widthInput = document.getElementById("prop-width");
    const heightInput = document.getElementById("prop-height");
    const rotInput = document.getElementById("prop-rotation");

    if (widthInput) {
      widthInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.width = parseFloat(e.target.value) || 32;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (heightInput) {
      heightInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.height = parseFloat(e.target.value) || 32;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (rotInput) {
      rotInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.rotation = parseFloat(e.target.value) || 0;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
  }
};
