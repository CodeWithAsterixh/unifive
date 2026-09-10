/**
 * UNIFIVE Scripting - Runtime Events Subsystem
 */
(function (global) {
  'use strict';

  const RuntimeEvents = {
    isEventHatMatch(block, triggerType, eventArg) {
      const blockType = block.blockId || block.id;
      if (triggerType === "when_flag" && block.blockId === "when_flag") return true;
      if (triggerType === "when_flag" && blockType === "when_flag") return true;
      if (triggerType === "when_clicked") return blockType === "when_clicked";
      if (triggerType === "when_became_playable") return blockType === "when_became_playable";
      if ((triggerType === "when_key" || triggerType === "when_vcontrol") && blockType === triggerType) {
        const input = typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : "space";
        const inputValue = String(input || "space").toLowerCase();
        const eventValue = String(eventArg || "").toLowerCase();
        return inputValue === eventValue || inputValue === "any" || inputValue === "any button" || inputValue.includes(eventValue) || eventValue.includes(inputValue);
      }
      if (triggerType === "when_receive" && blockType === "when_receive") {
        const input = typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(block, 0) : "message1";
        return String(input || "message1").toLowerCase() === String(eventArg || "").toLowerCase();
      }
      return false;
    },

    triggerEvent(engine, triggerType, eventArg = null, specificTargetId = null) {
      if (!engine || !engine.isRunning) return;
      const scriptsByTarget = typeof AppModeController !== "undefined" ? (AppModeController.objectScripts || {}) : {};
      const targetIds = specificTargetId ? [specificTargetId] : Object.keys(scriptsByTarget);
      const activeId = typeof AppModeController !== "undefined" ? AppModeController.getActiveTargetId() : null;
      if (!specificTargetId && activeId && !targetIds.includes(activeId)) targetIds.push(activeId);

      targetIds.forEach(targetId => {
        const scripts = scriptsByTarget[targetId] || [];
        const item = typeof WorldObjectsManager !== "undefined"
          ? WorldObjectsManager.items.find(candidate => candidate.id === targetId) || null
          : null;
        scripts.forEach(block => {
          if (this.isEventHatMatch(block, triggerType, eventArg)) engine.launchThread(block, item, targetId);
        });
      });
    },

    broadcast(engine, messageName) {
      this.triggerEvent(engine, "when_receive", messageName);
    }
  };

  global.RuntimeEvents = RuntimeEvents;
})(typeof window !== 'undefined' ? window : globalThis);
