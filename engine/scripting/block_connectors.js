/**
 * UNIFIVE Scripting - Block Connectors Subsystem
 */
const BlockConnectors = {
  snapDistance: 24,
  findNearestSnapTarget(draggedBlockId, draggedX, draggedY) {
    const workspace = document.getElementById("code-workspace-blocks");
    if (!workspace) return null;
    const blocks = workspace.querySelectorAll(".code-block-item");
    for (const b of blocks) {
      const bid = b.getAttribute("data-block-id");
      if (bid === draggedBlockId) continue;
      const rect = b.getBoundingClientRect();
      const dist = Math.hypot(draggedX - rect.left, draggedY - rect.bottom);
      if (dist < this.snapDistance) {
        return { targetId: bid, position: "below" };
      }
    }
    return null;
  }
};
