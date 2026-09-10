/**
 * UNIFIVE Scripting - Builtin Looks Handlers
 */
const BuiltinLooks = {
  async execute(engine, block, targetItem, evalInput) {
    const bid = block.blockId || block.id;
    if (!targetItem) return;
    if (bid === "say_for_secs" || bid === "say_text") {
      targetItem.speechBubble = { text: evalInput(0, "Hello!"), type: "say", timestamp: Date.now() };
      await engine.sleep(Math.max(100, (Number(evalInput(1, 2)) || 2) * 1000));
      if (targetItem.speechBubble) delete targetItem.speechBubble;
    } else if (bid === "switch_pose" || bid === "switch_costume") {
      const poseName = evalInput(0, "Idle");
      if (typeof SpritePosesController !== "undefined") {
        const poses = SpritePosesController.resolvePosesForAsset(targetItem);
        if (poses && poses[poseName] && typeof PoseCards !== "undefined") {
          PoseCards.selectPose(SpritePosesController, targetItem, poseName, poses[poseName]);
        }
      }
    } else if (bid === "next_costume") {
      const poses = targetItem.poses ? Object.keys(targetItem.poses) : [];
      if (poses.length) targetItem.currentPose = poses[(poses.indexOf(targetItem.currentPose) + 1) % poses.length];
    } else if (bid === "show") { targetItem.hidden = false; }
    else if (bid === "hide") { targetItem.hidden = true; }
    await engine.sleep(16);
  }
};
