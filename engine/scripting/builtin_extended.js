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
        const text = String(value(0, "Hello!"));
        const secs = Number(value(1, 2)) || 2;
        targetItem.speechBubble = { text: text, expiresAt: Date.now() + secs * 1000 };
        await engine.sleep(Math.max(100, secs * 1000));
      } else if (bid === "switch_costume") {
        const poseName = String(value(0, "Attack"));
        if (targetItem.poses && targetItem.poses[poseName] && typeof SpritePosesController !== "undefined") {
          SpritePosesController.selectPose(targetItem, poseName, targetItem.poses[poseName]);
        } else {
          targetItem.currentPose = poseName;
        }
      } else if (bid === "next_costume") {
        const poses = targetItem.poses ? Object.keys(targetItem.poses) : [];
        if (poses.length) {
          const curIdx = poses.indexOf(targetItem.currentPose || poses[0]);
          const nextPose = poses[(curIdx + 1) % poses.length];
          if (typeof SpritePosesController !== "undefined" && targetItem.poses[nextPose]) {
            SpritePosesController.selectPose(targetItem, nextPose, targetItem.poses[nextPose]);
          } else {
            targetItem.currentPose = nextPose;
          }
        }
      } else if (bid === "change_size") {
        const scale = 1 + (Number(value(0, 10)) || 0) / 100;
        targetItem.w = Math.max(8, Math.round(targetItem.w * scale));
        targetItem.h = Math.max(8, Math.round(targetItem.h * scale));
      } else if (bid === "set_size") {
        const scale = (Number(value(0, 100)) || 100) / 100;
        const ratio = targetItem.naturalW && targetItem.naturalH ? targetItem.naturalW / targetItem.naturalH : targetItem.w / targetItem.h;
        targetItem.w = Math.max(8, Math.round((targetItem.naturalW || targetItem.w) * scale));
        targetItem.h = Math.max(8, Math.round((targetItem.naturalH || targetItem.w / ratio) * scale));
      } else if (typeof WorldObjectsManager !== "undefined") {
        const count = Math.max(1, Math.floor(Number(value(0, 1)) || 1));
        if (bid === "move_layer_front") WorldObjectsManager.moveLayerFront ? WorldObjectsManager.moveLayerFront(targetItem.id, count) : (typeof ObjectsZOrder !== "undefined" && ObjectsZOrder.bringForward(WorldObjectsManager.items, targetItem.id));
        if (bid === "move_layer_back") WorldObjectsManager.moveLayerBack ? WorldObjectsManager.moveLayerBack(targetItem.id, count) : (typeof ObjectsZOrder !== "undefined" && ObjectsZOrder.sendBackward(WorldObjectsManager.items, targetItem.id));
        if (bid === "go_to_layer") {
          if (String(value(0, "front")).toLowerCase() === "back") {
            WorldObjectsManager.sendToBack ? WorldObjectsManager.sendToBack(targetItem.id) : (typeof ObjectsZOrder !== "undefined" && ObjectsZOrder.sendToBack(WorldObjectsManager.items, targetItem.id));
          } else {
            WorldObjectsManager.bringToFront ? WorldObjectsManager.bringToFront(targetItem.id) : (typeof ObjectsZOrder !== "undefined" && ObjectsZOrder.bringToFront(WorldObjectsManager.items, targetItem.id));
          }
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
