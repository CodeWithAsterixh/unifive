/**
 * UNIFIVE Engine - Properties Bindings Coordinator
 */
const PropertiesBindings = {
  bindAll(controller) {
    if (typeof PropBindingsTransform !== "undefined") PropBindingsTransform.bind(controller);
    if (typeof PropBindingsPhysics !== "undefined") PropBindingsPhysics.bind(controller);
  }
};
