/**
 * UNIFIVE Scripting - Block Drag & Snap Subsystem
 */
const BlockDragSnap = {
  dragState: {
    isDragging: false,
    blockId: null,
    offsetX: 0,
    offsetY: 0,
    mode: null,
    block: null,
    descendants: [],
    ghost: null
  },

  init() {
    const workspace = document.getElementById("code-workspace-blocks");
    if (workspace) workspace.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));
  },

  getDescendants(startBlock, scripts) {
    const list = [startBlock];
    const blockMap = new Map();
    scripts.forEach(b => blockMap.set(b.id, b));
    let curr = startBlock;
    const visited = new Set([startBlock.id]);
    while (curr && curr.nextId && blockMap.has(curr.nextId)) {
      const next = blockMap.get(curr.nextId);
      if (visited.has(next.id)) break;
      visited.add(next.id);
      list.push(next);
      curr = next;
    }
    return list;
  },

  handleMouseDown(e) {
    const blockEl = e.target.closest(".code-block-item");
    if (!blockEl || !blockEl.parentElement || blockEl.parentElement.id !== "code-workspace-blocks") return;
    if (e.target.closest(".code-block-delete-btn, .code-block-input, .code-block-select")) return;

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

    // Detach from previous block when picked up
    if (block.prevId) {
      const prev = scripts.find(b => b.id === block.prevId);
      if (prev && prev.nextId === block.id) {
        prev.nextId = null;
      }
      block.prevId = null;
    }

    const descendants = this.getDescendants(block, scripts);
    const initialOffsets = descendants.map(d => ({
      block: d,
      relX: (d.x || 0) - (block.x || 0),
      relY: (d.y || 0) - (block.y || 0)
    }));

    this.dragState.isDragging = true;
    this.dragState.mode = "workspace";
    this.dragState.blockId = blockId;
    this.dragState.block = block;
    this.dragState.descendants = initialOffsets;
    this.dragState.offsetX = worldX - (block.x || 0);
    this.dragState.offsetY = worldY - (block.y || 0);
    this.dragState.startX = e.clientX;
    this.dragState.startY = e.clientY;
    this.dragState.hasMoved = false;

    descendants.forEach(d => {
      const el = document.querySelector(`#code-workspace-blocks [data-block-id="${d.id}"]`);
      if (el) el.classList.add("dragging");
    });

    e.preventDefault();
  },

  startPaletteDrag(block, event, paletteElement = null) {
    const inputEls = paletteElement ? Array.from(paletteElement.querySelectorAll(".code-block-input, .code-block-select")) : [];
    const inputs = inputEls.length > 0
      ? inputEls.map(el => (el.tagName === "SELECT" || el.value !== undefined) ? el.value : el.textContent.trim())
      : (block.inputs ? [...block.inputs] : []);

    const blockWithInputs = {
      ...block,
      inputs
    };

    const ghost = typeof BlockPalette !== "undefined" ? BlockPalette.createBlockElement(blockWithInputs, true) : null;
    if (!ghost) return;
    ghost.classList.add("code-drag-ghost");
    ghost.style.position = "fixed";
    ghost.style.pointerEvents = "none";
    ghost.style.zIndex = "2000";
    document.body.appendChild(ghost);
    this.dragState = {
      isDragging: true,
      blockId: null,
      offsetX: 0,
      offsetY: 0,
      mode: "palette",
      block: blockWithInputs,
      blockInputs: inputs,
      descendants: [],
      ghost
    };
    this.positionGhost(event);
  },

  positionGhost(event) {
    if (!this.dragState.ghost) return;
    this.dragState.ghost.style.left = `${event.clientX + 8}px`;
    this.dragState.ghost.style.top = `${event.clientY + 8}px`;
  },

  handleMouseMove(e) {
    if (!this.dragState.isDragging) return;
    if (this.dragState.startX !== undefined && this.dragState.startY !== undefined) {
      if (Math.hypot(e.clientX - this.dragState.startX, e.clientY - this.dragState.startY) > 4) {
        this.dragState.hasMoved = true;
      }
    }
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

    const newX = Math.round((e.clientX - rect.left - panX) / zoom - this.dragState.offsetX);
    const newY = Math.round((e.clientY - rect.top - panY) / zoom - this.dragState.offsetY);

    this.dragState.block.x = newX;
    this.dragState.block.y = newY;

    if (Array.isArray(this.dragState.descendants)) {
      this.dragState.descendants.forEach(entry => {
        entry.block.x = newX + entry.relX;
        entry.block.y = newY + entry.relY;
        const el = document.querySelector(`#code-workspace-blocks [data-block-id="${entry.block.id}"]`);
        if (el) {
          el.style.left = `${entry.block.x}px`;
          el.style.top = `${entry.block.y}px`;
        }
      });
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
        const inputs = Array.isArray(this.dragState.blockInputs) ? [...this.dragState.blockInputs] : (Array.isArray(this.dragState.block.inputs) ? [...this.dragState.block.inputs] : []);
        const newBlock = {
          ...this.dragState.block,
          id: "block_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          blockId: this.dragState.block.id,
          x: Math.round((e.clientX - rect.left - panX) / zoom),
          y: Math.round((e.clientY - rect.top - panY) / zoom),
          nextId: null,
          prevId: null,
          inputs: inputs
        };
        scripts.push(newBlock);
        if (typeof BlockPalette !== "undefined") BlockPalette.layoutScripts(scripts);
        AppModeController.renderScriptsForActiveTarget();
      }
    } else if (this.dragState.mode === "workspace") {
      if (!this.dragState.hasMoved && this.dragState.block) {
        // User clicked the block stack in workspace: execute it!
        const targetId = typeof AppModeController !== "undefined" ? AppModeController.getActiveTargetId() : null;
        const targetItem = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.items.find(i => i.id === targetId) : null;
        if (typeof CodeRuntimeEngine !== "undefined") {
          CodeRuntimeEngine.isRunning = true;
          CodeRuntimeEngine.updateRunButtonUI(true);
          CodeRuntimeEngine.launchThread(this.dragState.block, targetItem, targetId);
        }
      } else {
        this.snapDraggedBlock();
      }
      if (typeof AppModeController !== "undefined") AppModeController.renderScriptsForActiveTarget();
    }
    this.dragState.isDragging = false;
    this.dragState.blockId = null;
    this.dragState.block = null;
    this.dragState.descendants = [];
    this.dragState.mode = null;
    if (this.dragState.ghost && this.dragState.ghost.parentNode) this.dragState.ghost.parentNode.removeChild(this.dragState.ghost);
    this.dragState.ghost = null;
  },

  snapDraggedBlock() {
    const dragged = this.dragState.block;
    if (!dragged || typeof AppModeController === "undefined") return;
    const scripts = AppModeController.getCurrentScripts();
    const draggedDescendantIds = new Set(this.getDescendants(dragged, scripts).map(b => b.id));

    let nearest = null;
    let nearestDistance = 32;

    scripts.forEach(target => {
      if (draggedDescendantIds.has(target.id)) return;
      const targetHeight = typeof BlockPalette !== "undefined" ? BlockPalette.getBlockHeight(target) : (target.hat ? 38 : 34);
      const targetSnapX = target.x || 0;
      const targetSnapY = (target.y || 0) + targetHeight;

      const distance = Math.hypot((dragged.x || 0) - targetSnapX, (dragged.y || 0) - targetSnapY);
      if (distance < nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    });

    if (!nearest) {
      if (typeof BlockPalette !== "undefined") BlockPalette.layoutScripts(scripts);
      return;
    }

    if (dragged.prevId) {
      const previous = scripts.find(item => item.id === dragged.prevId);
      if (previous && previous.nextId === dragged.id) previous.nextId = null;
    }

    const oldNext = nearest.nextId ? scripts.find(item => item.id === nearest.nextId) : null;

    dragged.prevId = nearest.id;
    nearest.nextId = dragged.id;

    if (oldNext && !draggedDescendantIds.has(oldNext.id)) {
      // Find the tail of dragged chain
      let tail = dragged;
      while (tail.nextId && scripts.some(b => b.id === tail.nextId)) {
        tail = scripts.find(b => b.id === tail.nextId);
      }
      tail.nextId = oldNext.id;
      oldNext.prevId = tail.id;
    }

    if (typeof BlockPalette !== "undefined") {
      BlockPalette.layoutScripts(scripts);
    }
  }
};
