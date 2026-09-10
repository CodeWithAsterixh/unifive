/**
 * UNIFIVE World - Crop Mutations Subsystem
 */
const CropMutations = {
  applyCrop(controller) {
    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!item) { controller.exitCrop(false); return; }
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const isActuallyCropped = (item.crop.x > 0 || item.crop.y > 0 || item.crop.w < nw || item.crop.h < nh);
    item.crop.isCropped = isActuallyCropped;

    if (isActuallyCropped) {
      const oldW = item.w;
      const oldH = item.h;
      const cx = item.x + oldW / 2;
      const cy = item.y + oldH / 2;
      const scale = ((oldW / nw) + (oldH / nh)) / 2;
      item.w = Math.max(20, Math.round(item.crop.w * scale));
      item.h = Math.max(20, Math.round(item.crop.h * scale));
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }
    controller.exitCrop(true);
    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(680, "square", 0.08, 0.12);
  },

  resetCrop(controller) {
    const item = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (!item) return;
    const nw = item.naturalW || item.w;
    const nh = item.naturalH || item.h;
    const cx = item.x + item.w / 2;
    const cy = item.y + item.h / 2;
    item.crop = { x: 0, y: 0, w: nw, h: nh, isCropped: false };
    const ratio = nw / nh;
    if (item.w / item.h !== ratio) {
      item.h = Math.round(item.w / ratio);
      item.x = Math.round(cx - item.w / 2);
      item.y = Math.round(cy - item.h / 2);
    }
    if (controller.isActive) controller.exitCrop(true);
    if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") PropertiesController.updateFromSelected(item);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(420, "square", 0.08, 0.1);
  }
};
