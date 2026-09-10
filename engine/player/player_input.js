/**
 * UNIFIVE Engine - Player Input Subsystem
 */
const PlayerInputManager = {
  keysDown: {},
  virtualKeys: {},

  init() {
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));
  },

  handleKeyDown(e) {
    if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.contentEditable === "true") return;
    const code = e.code;
    this.keysDown[code] = true;
    if (code === "Escape") { e.preventDefault(); GamePlayerEngine.togglePause(); }
    else if (code === "KeyF") { GamePlayerEngine.toggleFullscreen(); }
    else if (code === "KeyP" && !e.ctrlKey && !e.metaKey) { e.preventDefault(); GamePlayerEngine.exit(); }
    else if (code === "Space" && typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.triggerEvent("broadcast", "jump");
    else if (code === "KeyZ" && typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.triggerEvent("broadcast", "attack");
    else if (code === "KeyX" && typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) CodeRuntimeEngine.triggerEvent("broadcast", "interact");
  },

  handleKeyUp(e) {
    if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) return;
    this.keysDown[e.code] = false;
  },

  setVirtualKey(keyName, isPressed) {
    this.virtualKeys[keyName] = isPressed;
  },

  isActionActive(actionName) {
    if (typeof GamePlayerEngine !== "undefined" && !GamePlayerEngine.isControlEnabled) return false;
    if (actionName === "left") return !!(this.keysDown["ArrowLeft"] || this.keysDown["KeyA"] || this.virtualKeys["left"]);
    if (actionName === "right") return !!(this.keysDown["ArrowRight"] || this.keysDown["KeyD"] || this.virtualKeys["right"]);
    if (actionName === "up") return !!(this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["up"]);
    if (actionName === "down") return !!(this.keysDown["ArrowDown"] || this.keysDown["KeyS"] || this.virtualKeys["down"]);
    if (actionName === "jump" || actionName === "action_a") return !!(this.keysDown["Space"] || this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["jump"] || this.virtualKeys["action_a"]);
    if (actionName === "attack" || actionName === "action_b") return !!(this.keysDown["KeyZ"] || this.keysDown["KeyJ"] || this.virtualKeys["attack"] || this.virtualKeys["action_b"]);
    if (actionName === "interact") return !!(this.keysDown["KeyX"] || this.keysDown["KeyE"] || this.virtualKeys["interact"]);
    return false;
  },

  handleCanvasClick(wx, wy) {
    const hit = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getItemAt(wx, wy) : null;
    if (hit && typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
      CodeRuntimeEngine.triggerEvent("when_clicked", null, hit.id);
    }
  }
};
