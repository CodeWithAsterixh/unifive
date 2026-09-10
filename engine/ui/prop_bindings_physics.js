/**
 * UNIFIVE Engine - Properties Physics Bindings Coordinator
 */
const PropBindingsPhysics = {
  bind(controller) {
    if (typeof PropFlipOpacity !== "undefined") PropFlipOpacity.bind(controller);
    if (typeof PropCollisionPlayable !== "undefined") PropCollisionPlayable.bind(controller);
  }
};
