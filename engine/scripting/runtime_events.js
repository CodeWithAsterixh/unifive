/**
 * UNIFIVE Scripting - Runtime Events Subsystem
 * Event hat matching, event dispatching, and broadcast message routing.
 */
(function (global) {
  'use strict';

  const RuntimeEvents = {
    isEventHatMatch(block, triggerType, eventArg) {
      switch (triggerType) {
        case "when_flag": {
          if (block.blockId === "when_flag") return true;
          // Allow root orphan command blocks (standalone blocks without a hat) to run on flag start
          if (!block.prevId && !block.blockId.startsWith("when_") && !block.parentCBlockId && !block.parentEBlockId) return true;
          return false;
        }
        case "when_clicked":
          return block.blockId === "when_clicked";
        case "when_became_playable":
          return block.blockId === "when_became_playable";
        case "when_key": {
          if (block.blockId === "when_key") {
            const inputVal = (typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : null) || "space";
            if (inputVal.toLowerCase() === (eventArg || "").toLowerCase() || inputVal.toLowerCase() === "any") return true;
          }
          if (block.blockId === "when_vcontrol") {
            const inputVal = ((typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : null) || "cross").toLowerCase();
            const arg = (eventArg || "").toLowerCase();
            if (inputVal === "any button" || inputVal === "any" || inputVal.includes(arg) || arg.includes(inputVal)) return true;
            switch (arg) {
              case "space": return inputVal.includes("cross") || inputVal.includes("jump");
              case "z":
              case "attack": return inputVal.includes("circle") || inputVal.includes("attack");
              case "x": return inputVal.includes("square") || inputVal.includes("special");
              case "c": return inputVal.includes("triangle") || inputVal.includes("menu");
            }
          }
          return false;
        }
        case "when_vcontrol": {
          if (block.blockId === "when_vcontrol") {
            const inputVal = ((typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : null) || "cross").toLowerCase();
            const arg = (eventArg || "").toLowerCase();
            if (inputVal === "any button" || inputVal === "any" || inputVal.includes(arg) || arg.includes(inputVal)) return true;
            switch (arg) {
              case "space": return inputVal.includes("cross") || inputVal.includes("jump");
              case "z":
              case "attack": return inputVal.includes("circle") || inputVal.includes("attack");
              case "x": return inputVal.includes("square") || inputVal.includes("special");
              case "c": return inputVal.includes("triangle") || inputVal.includes("menu");
            }
          }
          return false;
        }
        case "when_receive": {
          if (block.blockId === "when_receive") {
            const msg = (typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : null) || "message1";
            return msg.toLowerCase() === (eventArg || "").toLowerCase();
          }
          return false;
        }
        default:
          return false;
      }
    },

    triggerEvent(engine, triggerType, eventArg = null, specificTargetId = null) {
      if (!engine || !engine.isRunning) return;

      const allTargets = specificTargetId ? [specificTargetId] : Object.keys(AppModeController.objectScripts || {});
      const activeTargetId = typeof AppModeController !== "undefined" && typeof AppModeController.getActiveTargetId === "function"
        ? AppModeController.getActiveTargetId()
        : null;
      if (!specificTargetId && activeTargetId && !allTargets.includes(activeTargetId)) allTargets.push(activeTargetId);

      allTargets.forEach(targetId => {
        const scripts = (typeof AppModeController !== "undefined" && AppModeController.objectScripts)
          ? (AppModeController.objectScripts[targetId] || [])
          : [];
        const targetItem = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items)
          ? WorldObjectsManager.items.find(it => it.id === targetId)
          : null;

        scripts.forEach(block => {
          if (this.isEventHatMatch(block, triggerType, eventArg)) {
            engine.launchThread(block, targetItem, targetId);
          }
        });
      });
    },

    runBlockImmediately(engine, block, targetId = null) {
      if (!block) return;
      const tid = targetId || (typeof AppModeController !== "undefined" ? AppModeController.getActiveTargetId() : null);
      const targetItem = (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items && tid)
        ? WorldObjectsManager.items.find(it => it.id === tid)
        : null;

      if (!engine.isRunning) {
        engine.isRunning = true;
        engine.updateRunButtonUI(true);
      }
      engine.launchThread(block, targetItem, tid);
    },

    broadcast(engine, messageName) {
      this.triggerEvent(engine, "when_receive", messageName);
    }
  };

  global.RuntimeEvents = RuntimeEvents;
})(typeof window !== 'undefined' ? window : globalThis);
