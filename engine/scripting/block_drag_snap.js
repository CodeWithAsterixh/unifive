/**
 * UNIFIVE Scripting - Block Drag & Snap Subsystem
 */
const BlockDragSnap = {
  dragState: { isDragging: false, blockId: null, offsetX: 0, offsetY: 0, mode: null, block: null, ghost: null },
  init() {
    const workspace = document.getElementById("code-workspace-blocks");
    if (workspace) workspace.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));
  },
  handleMouseDown(e) {
    const blockEl = e.target.closest(".code-block-item");
    if (!blockEl || !blockEl.parentElement || blockEl.parentElement.id !== "code-workspace-blocks") return;
    const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
    const blockId = blockEl.getAttribute("data-block-id");
    const block = scripts.find(item => item.id === blockId);
    const dropZone = document.getElementById("code-drop-zone");
    if (!block || !dropZone) return;

    const rect = dropZone.getBoundingClientRect();
    const zoom = typeof AppModeController !== "undefined" ? AppModeController.zoom : 1;
    const panX = typeof AppModeController !== "undefined" ? AppModeController.panX : 0;
    const panY = typeof AppModeController !== "undefined" ? AppModeController.panY : 0;
    const worldX = (e.clientX - rect.left - panX) / zoom;
    const worldY = (e.clientY - rect.top - panY) / zoom;
    this.dragState.isDragging = true;
    this.dragState.mode = "workspace";
    this.dragState.blockId = blockId;
    this.dragState.block = block;
    this.dragState.offsetX = worldX - (block.x || 0);
    this.dragState.offsetY = worldY - (block.y || 0);
    blockEl.classList.add("dragging");
    e.preventDefault();
  },

  startPaletteDrag(block, event) {
    const ghost = typeof BlockPalette !== "undefined" ? BlockPalette.createBlockElement(block, true) : null;
    if (!ghost) return;
    ghost.classList.add("code-drag-ghost");
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "2000";
    document.body.appendChild(ghost);
    this.dragState = { isDragging: true, blockId: null, offsetX: 0, offsetY: 0, mode: "palette", block, ghost };
    this.positionGhost(event);
  },

  positionGhost(event) {
    if (!this.dragState.ghost) return;
    this.dragState.ghost.style.left = `${event.clientX + 8}px`;
    this.dragState.ghost.style.top = `${event.clientY + 8}px`;
  },

  handleMouseMove(e) {
    if (!this.dragState.isDragging) return;
    if (this.dragState.mode === "palette") {
      this.positionGhost(e);
      return;
    }
    const dropZone = document.getElementById("code-drop-zone");
    if (!dropZone || !this.dragState.block) return;
    const rect = dropZone.getBoundingClientRect();
    const zoom = typeof AppModeController !== "undefined" ? AppModeController.zoom : 1;
    const panX = typeof AppModeController !== "undefined" ? AppModeController.panX : 0;
    const panY = typeof AppModeController !== "undefined" ? AppModeController.panY : 0;
    this.dragState.block.x = Math.round((e.clientX - rect.left - panX) / zoom - this.dragState.offsetX);
    this.dragState.block.y = Math.round((e.clientY - rect.top - panY) / zoom - this.dragState.offsetY);
    const blockEl = document.querySelector(`#code-workspace-blocks [data-block-id="${this.dragState.blockId}"]`);
    if (blockEl) {
      blockEl.style.left = `${this.dragState.block.x}px`;
      blockEl.style.top = `${this.dragState.block.y}px`;
    }
  },

  handleMouseUp(e) {
    if (!this.dragState.isDragging) return;
    if (this.dragState.mode === "palette") {
      const dropZone = document.getElementById("code-drop-zone");
      const rect = dropZone && dropZone.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const zoom = typeof AppModeController !== "undefined" ? AppModeController.zoom : 1;
        const panX = typeof AppModeController !== "undefined" ? AppModeController.panX : 0;
        const panY = typeof AppModeController !== "undefined" ? AppModeController.panY : 0;
        const scripts = AppModeController.getCurrentScripts();
        const newBlock = {
          ...this.dragState.block,
          id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          blockId: this.dragState.block.id,
          x: Math.round((e.clientX - rect.left - panX) / zoom),
          y: Math.round((e.clientY - rect.top - panY) / zoom),
          nextId: null,
          prevId: null,
          inputs: Array.isArray(this.dragState.block.inputs) ? [...this.dragState.block.inputs] : []
        };
        scripts.push(newBlock);
        AppModeController.renderScriptsForActiveTarget();
      }
    } else if (this.dragState.mode === "workspace") {
      this.snapDraggedBlock();
      if (typeof AppModeController !== "undefined") AppModeController.renderScriptsForActiveTarget();
    }
    this.dragState.isDragging = false;
    this.dragState.blockId = null;
    this.dragState.block = null;
    this.dragState.mode = null;
    if (this.dragState.ghost && this.dragState.ghost.parentNode) this.dragState.ghost.parentNode.removeChild(this.dragState.ghost);
    this.dragState.ghost = null;
  },

  snapDraggedBlock() {
    const dragged = this.dragState.block;
    if (!dragged || typeof AppModeController === "undefined") return;
    const scripts = AppModeController.getCurrentScripts();
    const draggedHeight = 34;
    let nearest = null;
    let nearestDistance = 28;
    scripts.forEach(target => {
      if (target === dragged || target.id === dragged.id) return;
      const distance = Math.hypot((dragged.x || 0) - (target.x || 0), (dragged.y || 0) - ((target.y || 0) + draggedHeight));
      if (distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    });
    if (!nearest) return;
    if (dragged.prevId) {
      const previous = scripts.find(item => item.id === dragged.prevId);
      if (previous && previous.nextId === dragged.id) previous.nextId = null;
    }
    if (nearest.nextId) {
      const oldNext = scripts.find(item => item.id === nearest.nextId);
      if (oldNext) oldNext.prevId = null;
    }
    dragged.x = nearest.x || 0;
    dragged.y = (nearest.y || 0) + draggedHeight;
    dragged.prevId = nearest.id;
    dragged.nextId = nearest.nextId || null;
    nearest.nextId = dragged.id;
  }
};
