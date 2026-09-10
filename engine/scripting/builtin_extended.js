/*
 * UNIFIVE Scripting - Extended Builtin Handlers
 */
const BuiltinExtended = {
  async execute(engine, block, targetItem, evalInput) {
    const bid = block.blockId || block.id;
    const value = (index, fallback) => evalInput(index, fallback);

    if (["say_text", "switch_costume", "next_costume", "change_size", "set_size", "move_layer_front", "move_layer_back", "go_to_layer"].includes(bid)) {
      if (!targetItem) return;
      if (bid === "say_text") {
        targetItem.speechBubble = { text: value(0, "Hello!"), type: "say", timestamp: Date.now() };
        await engine.sleep(Math.max(100, (Number(value(1, 2)) || 2) * 1000));
        if (targetItem.speechBubble) delete targetItem.speechBubble;
      } else if (bid === "switch_costume") {
        targetItem.currentPose = value(0, targetItem.currentPose || "Idle");
      } else if (bid === "next_costume") {
        const poses = targetItem.poses ? Object.keys(targetItem.poses) : [];
        if (poses.length) targetItem.currentPose = poses[(poses.indexOf(targetItem.currentPose) + 1) % poses.length];
      } else if (bid === "change_size") {
        const scale = 1 + (Number(value(0, 10)) || 0) / 100;
        targetItem.w = Math.max(8, Math.round(targetItem.w * scale));
        targetItem.h = Math.max(8, Math.round(targetItem.h * scale));
      } else if (bid === "set_size") {
        const scale = (Number(value(0, 100)) || 100) / 100;
        const ratio = targetItem.naturalW && targetItem.naturalH ? targetItem.naturalW / targetItem.naturalH : targetItem.w / targetItem.h;
        targetItem.w = Math.max(8, Math.round((targetItem.naturalW || targetItem.w) * scale));
        targetItem.h = Math.max(8, Math.round((targetItem.naturalH || targetItem.w / ratio) * scale));
      } else if (typeof ObjectsZOrder !== "undefined" && typeof WorldObjectsManager !== "undefined") {
        if (bid === "move_layer_front") ObjectsZOrder.bringForward(WorldObjectsManager.items, targetItem.id);
        if (bid === "move_layer_back") ObjectsZOrder.sendBackward(WorldObjectsManager.items, targetItem.id);
        if (bid === "go_to_layer") {
          if (String(value(0, "front")).toLowerCase() === "back") ObjectsZOrder.sendToBack(WorldObjectsManager.items, targetItem.id);
          else ObjectsZOrder.bringToFront(WorldObjectsManager.items, targetItem.id);
        }
        if (typeof LayersController !== "undefined") LayersController.update();
      }
      await engine.sleep(16);
      return;
    }

    if (bid === "set_vcontrols_visible" || bid === "set_vcontrols_customizable") {
      if (typeof MobileControlsManager !== "undefined") {
        if (bid === "set_vcontrols_visible") MobileControlsManager.visibilityMode = String(value(0, "auto")).toLowerCase();
        else MobileControlsManager.customizationEnabled = String(value(0, "true")).toLowerCase() === "true";
        if (typeof VControlDom !== "undefined") VControlDom.updateGamepadVisibility(MobileControlsManager);
      }
      return;
    }

    if (["play_sound", "start_sound", "stop_all_sounds", "change_volume"].includes(bid)) {
      if (bid === "play_sound" || bid === "start_sound") {
        if (typeof SoundEngine !== "undefined") SoundEngine.playSoundEffect(value(0, "coin"));
      } else if (bid === "stop_all_sounds" && typeof SoundEngine !== "undefined") {
        SoundEngine.stopAllSounds?.();
      } else if (bid === "change_volume" && typeof SynthCore !== "undefined") {
        SynthCore.volume = Math.max(0, Math.min(1, (SynthCore.volume || 0.15) + (Number(value(0, -10)) || 0) / 100));
      }
      await engine.sleep(16);
      return;
    }

    if (bid === "set_playable_char" && typeof WorldObjectsManager !== "undefined") {
      const selected = WorldObjectsManager.items.find(item => item.name === value(0, "this sprite")) || targetItem;
      WorldObjectsManager.items.forEach(item => { item.isPlayable = item === selected; });
      return;
    }
    if (bid === "set_player_control" && typeof GamePlayerEngine !== "undefined") {
      GamePlayerEngine.isControlEnabled = String(value(0, "enabled")).toLowerCase() === "enabled";
      return;
    }
    if (bid === "stop_all") {
      engine.stopAll();
      return;
    }
    if (bid === "set_var" || bid === "change_var" || bid === "show_var" || bid === "hide_var") {
      const name = value(0, "score");
      if (typeof VariableStore !== "undefined") {
        if (bid === "set_var") VariableStore.set(name, value(1, 0));
        if (bid === "change_var") VariableStore.set(name, (Number(VariableStore.get(name)) || 0) + (Number(value(1, 1)) || 0));
      }
      return;
    }
    if (bid === "broadcast" && typeof RuntimeEvents !== "undefined") {
      RuntimeEvents.broadcast(engine, value(0, "message1"));
    }
  }
};
