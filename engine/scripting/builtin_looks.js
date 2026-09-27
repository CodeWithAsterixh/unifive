/**
 * UNIFIVE Scripting - Builtin Looks Handlers
 */
const BuiltinLooks = {
  async execute(engine, block, targetItem, evalInput) {
    const bid = block.blockId || block.id;
    if (!targetItem) return;

    if (bid === "say_for_secs" || bid === "say_text") {
      const text = evalInput(0, "Hello!");
      const secs = Math.max(0.1, Number(evalInput(1, 2)) || 2);
      targetItem.speechBubble = { text: text, type: "say", expiresAt: Date.now() + secs * 1000, timestamp: Date.now() };
      await engine.sleep(Math.max(100, secs * 1000));
      if (targetItem.speechBubble && targetItem.speechBubble.text === text) {
        delete targetItem.speechBubble;
      }
    } else if (bid === "switch_pose" || bid === "switch_costume") {
      const poseName = evalInput(0, "Idle");
      if (typeof PoseAnimator !== "undefined") {
        PoseAnimator.setPose(targetItem, poseName);
      } else if (typeof SpritePosesController !== "undefined") {
        SpritePosesController.selectPose(targetItem, poseName);
      } else {
        targetItem.currentPose = poseName;
      }
    } else if (bid === "next_costume") {
      if (typeof PoseAnimator !== "undefined") {
        PoseAnimator.nextPose(targetItem);
      } else {
        const poses = targetItem.poses ? Object.keys(targetItem.poses) : [];
        if (poses.length) targetItem.currentPose = poses[(poses.indexOf(targetItem.currentPose) + 1) % poses.length];
      }
    } else if (bid === "show") {
      targetItem.hidden = false;
    } else if (bid === "hide") {
      targetItem.hidden = true;
    }
    await engine.sleep(16);
  }
};
