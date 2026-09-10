/**
 * UNIFIVE Engine - Properties Name & Position Subsystem
 */
const PropNamePosition = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const nameInput = document.getElementById("prop-name");
    const posXInput = document.getElementById("prop-pos-x");
    const posYInput = document.getElementById("prop-pos-y");

    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.name = e.target.value;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
          if (typeof LayersController !== "undefined") LayersController.update();
        }
      });
    }
    if (posXInput) {
      posXInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.x = parseFloat(e.target.value) || 0;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
    if (posYInput) {
      posYInput.addEventListener("input", (e) => {
        const item = (typeof WorldObjectsManager !== "undefined") ? WorldObjectsManager.getSelectedItem() : null;
        if (item) {
          item.y = parseFloat(e.target.value) || 0;
          if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
        }
      });
    }
  }
};
