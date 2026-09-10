/**
 * UNIFIVE Scripting - Runtime Threads Execution Subsystem
 */
const RuntimeThreads = {
  async launchThread(engine, startBlock, targetItem, targetId) {
    if (!engine.isRunning || !startBlock) return;
    let cur = startBlock;
    while (cur && engine.isRunning) {
      const blockType = cur.blockId || cur.type || cur.id;
      if (blockType === "forever") {
        while (engine.isRunning) {
          if (cur.childId) {
            const firstChild = AppModeController.getBlock(cur.childId, targetId);
            if (firstChild) await this.executeBlockChain(engine, firstChild, targetItem, targetId);
          }
          await engine.sleep(16);
        }
        break;
      }
      if (blockType === "repeat") {
        const count = Math.max(0, Math.floor(Number(typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.getBlockInput(cur, 0) : 10) || 10));
        for (let index = 0; index < count && engine.isRunning; index++) {
          if (cur.childId) {
            const firstChild = AppModeController.getBlock(cur.childId, targetId);
            if (firstChild) await this.executeBlockChain(engine, firstChild, targetItem, targetId);
          }
        }
      } else if (blockType === "if" || blockType === "if_then" || blockType === "if_else") {
        const condMet = typeof RuntimeEvaluator !== "undefined" ? RuntimeEvaluator.evaluateCondition(cur.inputs ? cur.inputs[0] : null, targetItem) : false;
        if (condMet && cur.childId) {
          const firstChild = AppModeController.getBlock(cur.childId, targetId);
          if (firstChild) await this.executeBlockChain(engine, firstChild, targetItem, targetId);
        } else if (!condMet && blockType === "if_else" && cur.childId_else) {
          const firstChild = AppModeController.getBlock(cur.childId_else, targetId);
          if (firstChild) await this.executeBlockChain(engine, firstChild, targetItem, targetId);
        }
      } else if (!blockType.startsWith("when_")) {
        if (typeof RuntimeBuiltins !== "undefined") await RuntimeBuiltins.executeBlock(engine, cur, targetItem);
      }
      cur = cur.nextId ? AppModeController.getBlock(cur.nextId, targetId) : null;
    }
  },

  async executeBlockChain(engine, firstBlock, targetItem, targetId) {
    let b = firstBlock;
    while (b && engine.isRunning) {
      if (typeof RuntimeBuiltins !== "undefined") await RuntimeBuiltins.executeBlock(engine, b, targetItem);
      b = b.nextId ? AppModeController.getBlock(b.nextId, targetId) : null;
    }
  }
};
