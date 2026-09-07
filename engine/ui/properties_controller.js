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
  },

  updateFromSelected(item) {
    if (typeof PropertiesInspector !== "undefined") {
      PropertiesInspector.updateFromSelected(this, item);
    }
  }
};
