/**
 * UNIFIVE Engine - Virtual Controls Analog Stick Subsystem
 */
const VControlStick = {
  bindStick(manager) {
    const stickBase = document.getElementById("vcontrol-stick-base");
    if (!stickBase) return;
    stickBase.addEventListener("pointerdown", function (e) {
      const rect = stickBase.getBoundingClientRect();
      manager.stickState.active = true;
      manager.stickState.originX = rect.left + rect.width / 2;
      manager.stickState.originY = rect.top + rect.height / 2;
    });
  }
};
if (typeof VControlTouch !== "undefined") {
  Object.assign(VControlTouch, VControlStick);
}
