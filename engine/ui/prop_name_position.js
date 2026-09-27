/**
 * UNIFIVE Engine - Properties Name & Position Subsystem
 */
const PropNamePosition = {
  bind(inspector) {
    this.bindInputs(inspector);
  },

  bindInputs(inspector) {
    const nameInput = document.getElementById("prop-name-input") || document.getElementById("prop-name");
    const posXInput = document.getElementById("prop-pos-x");
    const posYInput = document.getElementById("prop-pos-y");

    const getSel = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        return WorldObjectsManager.getSelectedItem ? WorldObjectsManager.getSelectedItem() : null;
      }
      return null;
    };

    const notify = (updateLayers = false) => {
      if (typeof WorldObjectsManager !== "undefined") {
        if (typeof WorldObjectsManager.saveHistory === "function") WorldObjectsManager.saveHistory();
        if (updateLayers) {
          if (typeof LayersController !== "undefined" && typeof LayersController.update === "function") LayersController.update();
          if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
          if (typeof AppModeController !== "undefined" && typeof AppModeController.renderObjectsList === "function") AppModeController.renderObjectsList();
        }
      }
    };

    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
        const item = getSel();
        if (item) {
          item.name = e.target.value;
          notify(true);
        }
      });
    }

    if (posXInput) {
      posXInput.addEventListener("input", (e) => {
        if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
        const item = getSel();
        if (item) {
          item.x = parseFloat(e.target.value) || 0;
          notify(false);
        }
      });
    }

    if (posYInput) {
      posYInput.addEventListener("input", (e) => {
        if (typeof PropertiesController !== "undefined" && PropertiesController.isUpdatingUI) return;
        const item = getSel();
        if (item) {
          item.y = parseFloat(e.target.value) || 0;
          notify(false);
        }
      });
    }
  }
};

if (typeof window !== "undefined") window.PropNamePosition = PropNamePosition;
if (typeof globalThis !== "undefined") globalThis.PropNamePosition = PropNamePosition;
