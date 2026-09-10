/**
 * UNIFIVE Engine - Properties Controller Subsystem
 * Aggregator coordinating object inspector form bindings (properties_bindings.js) and DOM UI synchronization (properties_inspector.js).
 */
const PropertiesController = {
  lockAspect: true,
  isUpdatingUI: false,

  init() {
    if (typeof PropertiesBindings !== "undefined") {
      PropertiesBindings.bindAll(this);
    }
    if (typeof CropController !== "undefined") {
      CropController.init();
    }

    const getSel = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        if (typeof WorldObjectsManager.getSelectedItem === "function") return WorldObjectsManager.getSelectedItem();
        if (typeof WorldObjectsManager.getSelected === "function") return WorldObjectsManager.getSelected();
        return WorldObjectsManager.items.find(i => i.id === WorldObjectsManager.selectedId) || null;
      }
      return null;
    };

    const notify = () => {
      if (typeof WorldObjectsManager !== "undefined") {
        if (typeof WorldObjectsManager.queueRender === "function") WorldObjectsManager.queueRender();
        if (typeof LayerTreeView !== "undefined" && typeof LayerTreeView.refresh === "function") LayerTreeView.refresh();
      }
    };

    const ctrlValText = document.getElementById("prop-control-value-text");
    if (ctrlValText) {
      ctrlValText.addEventListener("input", () => {
        if (this.isUpdatingUI) return;
        const item = getSel();
        if (item && item.type === "control") {
          item.value = ctrlValText.value;
          notify();
        }
      });
    }

    const ctrlValSlider = document.getElementById("prop-control-value-slider");
    const ctrlValNum = document.getElementById("prop-control-value-num");
    const setSlider = (v) => {
      if (this.isUpdatingUI) return;
      const n = Math.max(0, Math.min(100, parseInt(v) || 0));
      if (ctrlValSlider && ctrlValSlider.value != n) ctrlValSlider.value = n;
      if (ctrlValNum && ctrlValNum.value != n) ctrlValNum.value = n;
      const item = getSel();
      if (item && item.type === "control") {
        item.value = n;
        notify();
      }
    };
    if (ctrlValSlider) ctrlValSlider.addEventListener("input", (e) => setSlider(e.target.value));
    if (ctrlValNum) ctrlValNum.addEventListener("input", (e) => setSlider(e.target.value));
    const ctrlPresets = document.querySelectorAll("[data-control-slider-preset]");
    ctrlPresets.forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-control-slider-preset");
        setSlider(v);
      });
    });

    const ctrlValToggle = document.getElementById("prop-control-value-toggle");
    const ctrlValToggleLabel = document.getElementById("prop-control-value-toggle-label");
    if (ctrlValToggle) {
      ctrlValToggle.addEventListener("change", () => {
        if (this.isUpdatingUI) return;
        const item = getSel();
        if (item && item.type === "control") {
          item.value = ctrlValToggle.checked;
          if (ctrlValToggleLabel) ctrlValToggleLabel.textContent = ctrlValToggle.checked ? "STATE: ON" : "STATE: OFF";
          notify();
        }
      });
    }
  },

  updateFromSelected(item) {
    if (typeof PropertiesInspector !== "undefined") {
      PropertiesInspector.updateFromSelected(this, item);
    }
  }
};
