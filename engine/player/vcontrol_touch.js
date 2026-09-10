/**
 * UNIFIVE Engine - Virtual Controls Touch & Buttons Subsystem
 */
const VControlTouch = {
  bindButtons(manager) {
    document.addEventListener("pointerdown", this.handlePointerDown);
    document.addEventListener("pointerup", this.handlePointerUp);
  },

  handlePointerDown(e) {
    const btn = e.target.closest(".vcontrol-dpad-btn, .vcontrol-action-btn, .vcontrol-shoulder-btn, .vcontrol-system-btn");
    if (!btn) return;
    const btnId = btn.getAttribute("data-button");
    if (btnId && typeof MobileControlsManager !== "undefined") {
      btn.classList.add("active");
      VControlTouch.pressButton(MobileControlsManager, btnId, true);
    }
  },

  handlePointerUp() {
    const activeBtns = document.querySelectorAll(".vcontrol-group .active");
    for (const btn of activeBtns) {
      btn.classList.remove("active");
      const btnId = btn.getAttribute("data-button");
      if (btnId && typeof MobileControlsManager !== "undefined") VControlTouch.pressButton(MobileControlsManager, btnId, false);
    }
  },

  pressButton(manager, btnId, isDown) {
    if (!manager.activeButtons.hasOwnProperty(btnId)) return;
    manager.activeButtons[btnId] = isDown;
    if (typeof PlayerInputManager !== "undefined") {
      if (btnId === "dpad_up") PlayerInputManager.setVirtualKey("up", isDown);
      else if (btnId === "dpad_down") PlayerInputManager.setVirtualKey("down", isDown);
      else if (btnId === "dpad_left") PlayerInputManager.setVirtualKey("left", isDown);
      else if (btnId === "dpad_right") PlayerInputManager.setVirtualKey("right", isDown);
      else if (btnId === "cross") PlayerInputManager.setVirtualKey("jump", isDown);
      else if (btnId === "circle") PlayerInputManager.setVirtualKey("attack", isDown);
      else if (btnId === "square") PlayerInputManager.setVirtualKey("interact", isDown);
    }
    if (isDown) {
      if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
        CodeRuntimeEngine.triggerEvent("when_vcontrol", btnId);
      }
      if (btnId === "start" && typeof GamePlayerEngine !== "undefined") GamePlayerEngine.togglePause();
      if (typeof SoundEngine !== "undefined" && (btnId === "cross" || btnId === "circle" || btnId === "square" || btnId === "triangle")) {
        SoundEngine.playChiptuneTone(587, "square", 0.02, 0.05);
      }
    }
  }
};
