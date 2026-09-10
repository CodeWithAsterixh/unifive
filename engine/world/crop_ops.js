/**
 * UNIFIVE World - Crop Operations Proxy
 */
const CropOps = {
  applyCrop() { if (typeof CropMutations !== "undefined" && typeof CropController !== "undefined") CropMutations.applyCrop(CropController); },
  resetCrop() { if (typeof CropMutations !== "undefined" && typeof CropController !== "undefined") CropMutations.resetCrop(CropController); },
  applyAspectPreset(aspect) { if (typeof CropMath !== "undefined") CropMath.applyAspectPreset(aspect); },
  getCropTransformTarget(item, wx, wy) { return typeof CropMath !== "undefined" ? CropMath.getCropTransformTarget(item, wx, wy) : null; },
  drawCropOverlay(item) { return typeof CropRenderer !== "undefined" ? CropRenderer.drawCropOverlay(item) : null; }
};
if (typeof CropController !== "undefined") {
  Object.assign(CropController, CropOps);
}
