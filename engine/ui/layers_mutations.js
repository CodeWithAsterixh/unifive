/**
 * UNIFIVE Engine - Layers Mutations Coordinator
 */
const LayersMutations = {
  moveItemUp(id, controller) {
    if (typeof LayersReorderMutations !== "undefined") LayersReorderMutations.moveItemUp(id, controller);
  },
  moveItemDown(id, controller) {
    if (typeof LayersReorderMutations !== "undefined") LayersReorderMutations.moveItemDown(id, controller);
  },
  toggleVisibility(id, controller) {
    if (typeof LayersToggleMutations !== "undefined") LayersToggleMutations.toggleVisibility(id, controller);
  },
  toggleLock(id, controller) {
    if (typeof LayersToggleMutations !== "undefined") LayersToggleMutations.toggleLock(id, controller);
  },
  deleteItem(id, controller) {
    if (typeof LayersToggleMutations !== "undefined") LayersToggleMutations.deleteItem(id, controller);
  }
};
