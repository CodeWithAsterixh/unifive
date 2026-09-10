/**
 * UNIFIVE Engine - Properties Transform Bindings Coordinator
 */
const PropBindingsTransform = {
  bind(controller) {
    if (typeof PropNamePosition !== "undefined") PropNamePosition.bind(controller);
    if (typeof PropSizeRotation !== "undefined") PropSizeRotation.bind(controller);
  }
};
