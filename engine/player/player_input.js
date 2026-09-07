/**
 * UNIFIVE Engine - Player Input Subsystem
 * Unified keyboard, gamepad, virtual key mapping, and touch canvas click triggers.
 */
const PlayerInputManager = {
  keysDown: {},
  virtualKeys: {},

  init() {
    window.addEventListener("keydown", (e) => {
      if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.contentEditable === "true") return;

      const code = e.code;
      this.keysDown[code] = true;

      switch (code) {
        case "Escape":
          e.preventDefault();
          GamePlayerEngine.togglePause();
          return;
        case "KeyF":
          GamePlayerEngine.toggleFullscreen();
          return;
        case "KeyP":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            GamePlayerEngine.exit();
          }
          return;
        case "Space":
          if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
            CodeRuntimeEngine.triggerEvent("broadcast", "jump");
          }
          break;
        case "KeyZ":
          if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
            CodeRuntimeEngine.triggerEvent("broadcast", "attack");
          }
          break;
        case "KeyX":
          if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
            CodeRuntimeEngine.triggerEvent("broadcast", "interact");
          }
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) return;
      this.keysDown[e.code] = false;
    });
  },

  setVirtualKey(keyName, isPressed) {
    this.virtualKeys[keyName] = isPressed;
  },

  isActionActive(actionName) {
    if (typeof GamePlayerEngine !== "undefined" && !GamePlayerEngine.isControlEnabled) return false;

    switch (actionName) {
      case "left":
        return !!(this.keysDown["ArrowLeft"] || this.keysDown["KeyA"] || this.virtualKeys["left"]);
      case "right":
        return !!(this.keysDown["ArrowRight"] || this.keysDown["KeyD"] || this.virtualKeys["right"]);
      case "up":
        return !!(this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["up"]);
      case "down":
        return !!(this.keysDown["ArrowDown"] || this.keysDown["KeyS"] || this.virtualKeys["down"]);
      case "jump":
      case "action_a":
        return !!(this.keysDown["Space"] || this.keysDown["ArrowUp"] || this.keysDown["KeyW"] || this.virtualKeys["jump"] || this.virtualKeys["action_a"]);
      case "attack":
      case "action_b":
        return !!(this.keysDown["KeyZ"] || this.keysDown["KeyJ"] || this.virtualKeys["attack"] || this.virtualKeys["action_b"]);
      case "interact":
        return !!(this.keysDown["KeyX"] || this.keysDown["KeyE"] || this.virtualKeys["interact"]);
      default:
        return false;
    }
  },

  handleCanvasClick(worldX, worldY) {
    if (typeof GamePlayerEngine === "undefined" || !GamePlayerEngine.isPlaying) return;
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return;

    // Check clicked objects in reverse depth order
    const items = typeof WorldObjectsManager.getSortedRenderList === "function" 
      ? WorldObjectsManager.getSortedRenderList(true) 
      : WorldObjectsManager.items;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.hidden || item.hiddenInPlayer) continue;

      const minX = item.x;
      const maxX = item.x + (item.w || 40);
      const minY = item.y;
      const maxY = item.y + (item.h || 40);

      if (worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY) {
        if (typeof CodeRuntimeEngine !== "undefined" && CodeRuntimeEngine.isRunning) {
          CodeRuntimeEngine.triggerEvent("when_clicked", null, item.id);
        }

        if (item.isPlayableTrigger) {
          GamePlayerEngine.setPlayableCharacter(item.id);
        }

        if (typeof SoundEngine !== "undefined") {
          SoundEngine.playChiptuneTone(740, "sine", 0.04, 0.08);
        }
        break;
      }
    }
  }
};
