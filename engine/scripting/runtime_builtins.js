/**
 * UNIFIVE Scripting - Runtime Builtins Subsystem
 * Implements execution handlers for Motion, Looks, Sound, Control, Variables, and Events blocks.
 */
(function (global) {
  'use strict';

  const RuntimeBuiltins = {
    async executeBlock(engine, block, targetItem) {
      if (!engine || !engine.isRunning || !block) return;

      const blockEl = (typeof AppModeController !== "undefined" && typeof AppModeController.getBlockElement === "function")
        ? AppModeController.getBlockElement(block.id)
        : null;
      if (blockEl) blockEl.classList.add("executing-halo");

      const evalInput = (idx, fallback) => {
        if (typeof RuntimeEvaluator !== "undefined") {
          return RuntimeEvaluator.evalBlockInput(block, idx, targetItem, fallback);
        }
        return engine.evalBlockInput(block, idx, targetItem, fallback);
      };

      try {
        switch (block.blockId) {
          // ================= MOTION =================
          case "move_x_steps":
          case "move_steps_x": {
            const steps = Number(evalInput(0, 10)) || 0;
            if (targetItem) {
              const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
              targetItem.x = Math.round(targetItem.x + steps);
              targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, targetItem.x));
            }
            await engine.sleep(16);
            break;
          }
          case "move_y_steps":
          case "move_steps_y": {
            const steps = Number(evalInput(0, 10)) || 0;
            if (targetItem) {
              const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
              targetItem.y = Math.round(targetItem.y + steps);
              targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, targetItem.y));
            }
            await engine.sleep(16);
            break;
          }
          case "move_steps": {
            const steps = Number(evalInput(0, 10)) || 10;
            if (targetItem) {
              const rotRad = ((targetItem.rotation || 0) - 90) * Math.PI / 180;
              const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
              const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
              targetItem.x = Math.round(targetItem.x + steps * Math.cos(rotRad));
              targetItem.y = Math.round(targetItem.y + steps * Math.sin(rotRad));
              targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, targetItem.x));
              targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, targetItem.y));
            }
            await engine.sleep(16);
            break;
          }
          case "turn_right": {
            const deg = Number(evalInput(0, 15)) || 15;
            if (targetItem) {
              targetItem.rotation = Math.round((targetItem.rotation || 0) + deg) % 360;
            }
            await engine.sleep(16);
            break;
          }
          case "turn_left": {
            const deg = Number(evalInput(0, 15)) || 15;
            if (targetItem) {
              targetItem.rotation = Math.round((targetItem.rotation || 0) - deg + 360) % 360;
            }
            await engine.sleep(16);
            break;
          }
          case "goto_xy": {
            const gx = Number(evalInput(0, 0)) || 0;
            const gy = Number(evalInput(1, 0)) || 0;
            if (targetItem) {
              const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
              const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
              targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, gx));
              targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, gy));
            }
            await engine.sleep(16);
            break;
          }
          case "glide_xy": {
            const secs = Math.max(0.1, Number(evalInput(0, 1)) || 1);
            const gx = Number(evalInput(1, 0)) || 0;
            const gy = Number(evalInput(2, 0)) || 0;
            if (targetItem) {
              const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
              const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
              const startX = targetItem.x;
              const startY = targetItem.y;
              const targetX = Math.max(0, Math.min(wWidth - targetItem.w, gx));
              const targetY = Math.max(0, Math.min(wHeight - targetItem.h, gy));
              const durationMs = secs * 1000;
              const startTime = Date.now();

              while (engine.isRunning && Date.now() - startTime < durationMs) {
                const progress = Math.min(1, (Date.now() - startTime) / durationMs);
                targetItem.x = Math.round(startX + (targetX - startX) * progress);
                targetItem.y = Math.round(startY + (targetY - startY) * progress);
                await engine.sleep(16);
              }
              targetItem.x = targetX;
              targetItem.y = targetY;
            }
            break;
          }
          case "point_dir": {
            const dir = Number(evalInput(0, 90)) || 90;
            if (targetItem) {
              targetItem.rotation = ((dir % 360) + 360) % 360;
            }
            await engine.sleep(16);
            break;
          }
          case "bounce_edge": {
            if (targetItem) {
              const wWidth = typeof WorldConfig !== "undefined" ? WorldConfig.worldWidth : 2000;
              const wHeight = typeof WorldConfig !== "undefined" ? WorldConfig.worldHeight : 1500;
              let bounced = false;
              if (targetItem.x <= 0 || targetItem.x + targetItem.w >= wWidth) {
                targetItem.rotation = (360 - (targetItem.rotation || 0)) % 360;
                targetItem.x = Math.max(0, Math.min(wWidth - targetItem.w, targetItem.x));
                bounced = true;
              }
              if (targetItem.y <= 0 || targetItem.y + targetItem.h >= wHeight) {
                targetItem.rotation = (180 - (targetItem.rotation || 0) + 360) % 360;
                targetItem.y = Math.max(0, Math.min(wHeight - targetItem.h, targetItem.y));
                bounced = true;
              }
              if (bounced && typeof SoundEngine !== "undefined") {
                SoundEngine.playChiptuneTone(400, "triangle", 0.04, 0.1);
              }
            }
            await engine.sleep(16);
            break;
          }

          // ================= LOOKS =================
          case "say_text": {
            const text = String(evalInput(0, "Hello!"));
            const secs = Number(evalInput(1, 2)) || 2;
            if (targetItem) {
              targetItem.speechBubble = {
                text: text,
                expiresAt: Date.now() + secs * 1000
              };
            }
            await engine.sleep(secs * 1000);
            break;
          }
          case "switch_costume": {
            const poseName = String(evalInput(0, "Idle"));
            if (targetItem) {
              targetItem.currentPose = poseName;
            }
            await engine.sleep(16);
            break;
          }
          case "next_costume": {
            if (targetItem && targetItem.poses && typeof targetItem.poses === "object") {
              const poseKeys = Object.keys(targetItem.poses);
              if (poseKeys.length > 0) {
                const curIdx = poseKeys.indexOf(targetItem.currentPose || poseKeys[0]);
                const nextIdx = (curIdx + 1) % poseKeys.length;
                targetItem.currentPose = poseKeys[nextIdx];
              }
            }
            await engine.sleep(16);
            break;
          }
          case "change_size": {
            const delta = Number(evalInput(0, 10)) || 10;
            if (targetItem) {
              targetItem.scale = Math.max(10, Math.min(500, (targetItem.scale || 100) + delta));
            }
            await engine.sleep(16);
            break;
          }
          case "set_size": {
            const targetScale = Number(evalInput(0, 100)) || 100;
            if (targetItem) {
              targetItem.scale = Math.max(10, Math.min(500, targetScale));
            }
            await engine.sleep(16);
            break;
          }
          case "move_layer_front": {
            if (targetItem && typeof WorldObjectsManager !== "undefined") {
              WorldObjectsManager.bringForward(targetItem.id);
            }
            await engine.sleep(16);
            break;
          }
          case "move_layer_back": {
            if (targetItem && typeof WorldObjectsManager !== "undefined") {
              WorldObjectsManager.sendBackward(targetItem.id);
            }
            await engine.sleep(16);
            break;
          }
          case "go_to_layer": {
            const dir = String(evalInput(0, "front"));
            if (targetItem && typeof WorldObjectsManager !== "undefined") {
              if (dir === "front") WorldObjectsManager.bringToFront(targetItem.id);
              else WorldObjectsManager.sendToBack(targetItem.id);
            }
            await engine.sleep(16);
            break;
          }
          case "show": {
            if (targetItem) targetItem.hidden = false;
            await engine.sleep(16);
            break;
          }
          case "hide": {
            if (targetItem) targetItem.hidden = true;
            await engine.sleep(16);
            break;
          }
          case "set_vcontrols_visible": {
            const mode = String(evalInput(0, "show")).toLowerCase();
            if (typeof MobileControlsManager !== "undefined") {
              MobileControlsManager.setScriptedVisibility(mode);
            }
            await engine.sleep(16);
            break;
          }
          case "set_vcontrols_customizable": {
            const mode = String(evalInput(0, "true")).toLowerCase();
            if (typeof MobileControlsManager !== "undefined") {
              MobileControlsManager.setCustomizationAllowed(mode === "true" || mode === "yes" || mode === "1");
            }
            await engine.sleep(16);
            break;
          }

          // ================= SOUND =================
          case "play_sound": {
            const sfx = String(evalInput(0, "jump"));
            if (typeof SoundEngine !== "undefined") SoundEngine.playSfx(sfx);
            await engine.sleep(300);
            break;
          }
          case "start_sound": {
            const sfx = String(evalInput(0, "laser"));
            if (typeof SoundEngine !== "undefined") SoundEngine.playSfx(sfx);
            await engine.sleep(16);
            break;
          }
          case "stop_all_sounds": {
            if (typeof SoundEngine !== "undefined") SoundEngine.stopAll();
            await engine.sleep(16);
            break;
          }
          case "change_volume": {
            const delta = Number(evalInput(0, -10)) || -10;
            if (typeof SoundEngine !== "undefined") SoundEngine.changeVolume(delta);
            await engine.sleep(16);
            break;
          }

          // ================= CONTROL =================
          case "wait_secs": {
            const secs = Math.max(0.01, Number(evalInput(0, 1)) || 1);
            await engine.sleep(secs * 1000);
            break;
          }
          case "repeat": {
            const times = Math.max(0, Math.floor(Number(evalInput(0, 10)) || 10));
            const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
            const childId = block.childId_c || block.childId;
            const childBlock = childId ? scripts.find(b => b.id === childId) : null;

            for (let i = 0; i < times && engine.isRunning; i++) {
              if (childBlock) {
                await engine.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              }
              await engine.sleep(16);
            }
            break;
          }
          case "forever": {
            const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
            const childId = block.childId_c || block.childId;
            const childBlock = childId ? scripts.find(b => b.id === childId) : null;

            while (engine.isRunning) {
              if (childBlock) {
                await engine.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
              }
              await engine.sleep(16);
            }
            break;
          }
          case "if_then": {
            let isTrue = false;
            if (block.conditionBlock) {
              isTrue = typeof RuntimeEvaluator !== "undefined"
                ? RuntimeEvaluator.evaluateConditionBlock(block.conditionBlock, targetItem)
                : engine.evaluateConditionBlock(block.conditionBlock, targetItem);
            } else {
              const condRaw = evalInput(0, "true");
              isTrue = typeof RuntimeEvaluator !== "undefined"
                ? RuntimeEvaluator.evaluateCondition(condRaw, targetItem)
                : engine.evaluateCondition(condRaw, targetItem);
            }
            if (isTrue && (block.childId_c || block.childId)) {
              const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
              const childBlock = scripts.find(b => b.id === (block.childId_c || block.childId));
              if (childBlock) await engine.runScriptThread(childBlock, targetItem, targetItem ? targetItem.id : "global_stage");
            }
            await engine.sleep(16);
            break;
          }
          case "if_else": {
            let isTrue = false;
            if (block.conditionBlock) {
              isTrue = typeof RuntimeEvaluator !== "undefined"
                ? RuntimeEvaluator.evaluateConditionBlock(block.conditionBlock, targetItem)
                : engine.evaluateConditionBlock(block.conditionBlock, targetItem);
            } else {
              const condRaw = evalInput(0, "true");
              isTrue = typeof RuntimeEvaluator !== "undefined"
                ? RuntimeEvaluator.evaluateCondition(condRaw, targetItem)
                : engine.evaluateCondition(condRaw, targetItem);
            }
            const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
            if (isTrue && block.childId_if) {
              const childIf = scripts.find(b => b.id === block.childId_if);
              if (childIf) await engine.runScriptThread(childIf, targetItem, targetItem ? targetItem.id : "global_stage");
            } else if (!isTrue && block.childId_else) {
              const childElse = scripts.find(b => b.id === block.childId_else);
              if (childElse) await engine.runScriptThread(childElse, targetItem, targetItem ? targetItem.id : "global_stage");
            }
            await engine.sleep(16);
            break;
          }
          case "set_playable_char": {
            const chosen = String(evalInput(0, "this sprite"));
            if (typeof GamePlayerEngine !== "undefined") {
              if (chosen === "this sprite" || !chosen) {
                if (targetItem) GamePlayerEngine.setPlayableCharacter(targetItem.id);
              } else if (chosen === "None" || chosen === "none") {
                GamePlayerEngine.setPlayableCharacter(null);
              } else {
                GamePlayerEngine.setPlayableCharacter(chosen);
              }
            }
            await engine.sleep(16);
            break;
          }
          case "set_player_control": {
            const modeVal = String(evalInput(0, "enabled"));
            if (typeof GamePlayerEngine !== "undefined") {
              GamePlayerEngine.setPlayerControlEnabled(modeVal.toLowerCase() === "enabled");
            }
            await engine.sleep(16);
            break;
          }
          case "stop_all": {
            engine.stopAll();
            break;
          }

          // ================= VARIABLES =================
          case "set_var": {
            const varName = String(evalInput(0, "score"));
            const val = evalInput(1, 0);
            if (typeof VariableManager !== "undefined") {
              VariableManager.setVariable(varName, val, targetItem ? targetItem.id : null);
            }
            await engine.sleep(16);
            break;
          }
          case "change_var": {
            const varName = String(evalInput(0, "score"));
            const delta = evalInput(1, 1);
            if (typeof VariableManager !== "undefined") {
              VariableManager.changeVariable(varName, delta, targetItem ? targetItem.id : null);
            }
            await engine.sleep(16);
            break;
          }
          case "show_var": {
            const varName = String(evalInput(0, "score"));
            if (typeof VariableManager !== "undefined") {
              VariableManager.toggleWatcher(varName, true);
            }
            await engine.sleep(16);
            break;
          }
          case "hide_var": {
            const varName = String(evalInput(0, "score"));
            if (typeof VariableManager !== "undefined") {
              VariableManager.toggleWatcher(varName, false);
            }
            await engine.sleep(16);
            break;
          }

          // ================= EVENTS =================
          case "broadcast": {
            const msg = String(evalInput(0, "message1"));
            engine.broadcast(msg);
            await engine.sleep(16);
            break;
          }

          default:
            await engine.sleep(16);
        }
      } finally {
        if (blockEl) blockEl.classList.remove("executing-halo");
      }
    }
  };

  global.RuntimeBuiltins = RuntimeBuiltins;
})(typeof window !== 'undefined' ? window : globalThis);
