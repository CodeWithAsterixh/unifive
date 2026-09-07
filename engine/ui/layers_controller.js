const LayersController = {

  init() {
    // 1. Header Quick Reordering Toolbar Buttons
    const btnTop = document.getElementById("btn-layer-top");
    const btnUp = document.getElementById("btn-layer-up");
    const btnDown = document.getElementById("btn-layer-down");
    const btnBot = document.getElementById("btn-layer-bot");

    if (btnTop) btnTop.addEventListener("click", () => WorldObjectsManager.bringToFront());
    if (btnUp) btnUp.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnDown) btnDown.addEventListener("click", () => WorldObjectsManager.sendBackward());
    if (btnBot) btnBot.addEventListener("click", () => WorldObjectsManager.sendToBack());

    // 2. Floating Action Dock Layer Actions (MOVE FRONT / MOVE BACK)
    const btnDockFront = document.getElementById("btn-dock-move-front");
    const btnDockBack = document.getElementById("btn-dock-move-back");

    if (btnDockFront) btnDockFront.addEventListener("click", () => WorldObjectsManager.bringForward());
    if (btnDockBack) btnDockBack.addEventListener("click", () => WorldObjectsManager.sendBackward());

    // 3. Delegate Layer Item Card clicks, actions, and drag-and-drop
    const listEl = document.getElementById("layers-items-list");
    if (listEl) {
      listEl.addEventListener("click", (e) => {
        const card = e.target.closest(".layer-item-card");
        if (!card) return;
        const id = card.getAttribute("data-id");
        if (!id) return;

        const actionBtn = e.target.closest(".layer-btn");
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.getAttribute("data-action");
          if (action === "up") {
            this.moveItemUp(id);
          } else if (action === "down") {
            this.moveItemDown(id);
          } else if (action === "toggle-vis") {
            this.toggleVisibility(id);
          } else if (action === "toggle-lock") {
            this.toggleLock(id);
          } else if (action === "delete") {
            this.deleteItem(id);
          }
          return;
        }

        // Select the item on canvas and in inspector
        WorldObjectsManager.selectItem(id);
        SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });

      // Pointer-based drag reorder on layer drag handles
      let dragState = null;

      listEl.addEventListener("pointerdown", (e) => {
        const handle = e.target.closest(".layer-drag-handle");
        if (!handle) return;
        const card = handle.closest(".layer-item-card");
        if (!card) return;

        e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const cardRect = card.getBoundingClientRect();
        const listRect = listEl.getBoundingClientRect();

        // Store card width as CSS variable for the fixed-position dragged card
        card.style.setProperty("--drag-card-width", cardRect.width + "px");

        // Create a placeholder with the same height as the card
        const placeholder = document.createElement("div");
        placeholder.className = "layer-drop-placeholder";
        placeholder.style.height = cardRect.height + "px";

        // Calculate offset of pointer relative to card top-left
        const offsetX = e.clientX - cardRect.left;
        const offsetY = e.clientY - cardRect.top;

        // Insert placeholder before card, then make card fixed
        card.parentNode.insertBefore(placeholder, card);
        card.classList.add("layer-dragging");
        card.style.left = cardRect.left + "px";
        card.style.top = cardRect.top + "px";

        listEl.classList.add("is-sorting");

        dragState = {
          card,
          placeholder,
          pointerId: e.pointerId,
          offsetX,
          offsetY,
          startId: card.getAttribute("data-id"),
          scrollAreaRect: listRect
        };
      });

      listEl.addEventListener("pointermove", (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;
        e.preventDefault();

        const { card, placeholder, offsetX, offsetY, scrollAreaRect } = dragState;

        // Move the card with the pointer
        card.style.left = (e.clientX - offsetX) + "px";
        card.style.top = (e.clientY - offsetY) + "px";

        // Determine which sibling card we're hovering over
        const siblings = [...listEl.querySelectorAll(".layer-item-card:not(.layer-dragging)")];
        let insertBefore = null;

        for (const sib of siblings) {
          const sibRect = sib.getBoundingClientRect();
          const sibMidY = sibRect.top + sibRect.height / 2;
          if (e.clientY < sibMidY) {
            insertBefore = sib;
            break;
          }
        }

        // Move placeholder to the correct insertion point
        if (insertBefore) {
          listEl.insertBefore(placeholder, insertBefore);
        } else {
          // Insert after the last sibling (at the bottom)
          const lastSib = siblings[siblings.length - 1];
          if (lastSib && lastSib.nextSibling !== placeholder) {
            listEl.insertBefore(placeholder, lastSib.nextSibling);
          } else if (!lastSib) {
            listEl.appendChild(placeholder);
          }
        }
      });

      const finishDrag = (e) => {
        if (!dragState || e.pointerId !== dragState.pointerId) return;

        const { card, placeholder, startId } = dragState;
        
        // Determine where the placeholder ended up relative to other cards
        const allCards = [...listEl.querySelectorAll(".layer-item-card:not(.layer-dragging)")];
        const placeholderIndex = [...listEl.children].indexOf(placeholder);
        const cardsBeforePlaceholder = [...listEl.children]
          .slice(0, placeholderIndex)
          .filter(el => el.classList.contains("layer-item-card") && !el.classList.contains("layer-dragging"));

        // Remove drag classes and inline styles
        card.classList.remove("layer-dragging");
        card.style.removeProperty("left");
        card.style.removeProperty("top");
        card.style.removeProperty("--drag-card-width");
        listEl.classList.remove("is-sorting");

        // Move card into the placeholder position in the DOM
        placeholder.replaceWith(card);

        // Now figure out the final reorder:
        // The UI list is in reverse array order: top of list = highest array index (frontmost)
        // cardsBeforePlaceholder.length tells us how many cards are above this card in the UI
        const uiIndexFromTop = cardsBeforePlaceholder.length;
        const totalItems = WorldObjectsManager.items.length;
        const newArrayIndex = totalItems - 1 - uiIndexFromTop;

        const items = WorldObjectsManager.items;
        const fromIdx = items.findIndex(it => it.id === startId);

        if (fromIdx >= 0 && fromIdx !== newArrayIndex && newArrayIndex >= 0 && newArrayIndex < totalItems) {
          const [draggedItem] = items.splice(fromIdx, 1);
          const clampedIdx = Math.max(0, Math.min(items.length, newArrayIndex));
          items.splice(clampedIdx, 0, draggedItem);
          WorldObjectsManager.selectedId = startId;
          WorldObjectsManager.saveHistory();
          this.update();
          if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
          SoundEngine.playChiptuneTone(620, "square", 0.06, 0.1);
        }

        dragState = null;
      };

      listEl.addEventListener("pointerup", finishDrag);
      listEl.addEventListener("pointercancel", finishDrag);
    }
  },

  update() {
    const listEl = document.getElementById("layers-items-list");
    const emptyEl = document.getElementById("layers-empty-state");
    const countBadge = document.getElementById("layers-count-badge");
    const dockLayerGroup = document.getElementById("dock-layer-actions");

    const items = WorldObjectsManager.items;
    const selectedId = WorldObjectsManager.selectedId;

    // 1. Update Layer Count Badge
    if (countBadge) {
      countBadge.textContent = `${items.length} ${items.length === 1 ? "LAYER" : "LAYERS"}`;
    }

    // 2. Update Floating Dock Layer Action Group Visibility
    if (dockLayerGroup) {
      dockLayerGroup.style.display = selectedId ? "inline-flex" : "none";
    }

    // 3. Update Toolbar button states (TOP, UP, DOWN, BOT)
    const btnTop = document.getElementById("btn-layer-top");
    const btnUp = document.getElementById("btn-layer-up");
    const btnDown = document.getElementById("btn-layer-down");
    const btnBot = document.getElementById("btn-layer-bot");

    const selectedIndex = items.findIndex(it => it.id === selectedId);
    const hasSelection = selectedIndex >= 0;
    const canMoveUp = hasSelection && selectedIndex < items.length - 1;
    const canMoveDown = hasSelection && selectedIndex > 0;

    if (btnTop) btnTop.disabled = !canMoveUp;
    if (btnUp) btnUp.disabled = !canMoveUp;
    if (btnDown) btnDown.disabled = !canMoveDown;
    if (btnBot) btnBot.disabled = !canMoveDown;

    if (!listEl) return;

    // 4. Toggle empty state
    if (items.length === 0) {
      listEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "flex";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    // 5. Build Layer Cards in Reverse Array Order (index items.length - 1 at TOP = visually in front)
    let html = "";
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      const isActive = item.id === selectedId;
      const isLocked = !!item.locked;
      const isHidden = !!item.hidden;
      const layerNum = i + 1; // 1-indexed

      const itemType = (item.type === "sprite" || item.poses || (item.assetId && item.assetId.startsWith("sprite_"))) 
        ? "Sprite" 
        : "Prop";
      const meta = `${Math.round(item.w)}x${Math.round(item.h)} • ${itemType}`;

      html += `
        <div class="layer-item-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isHidden ? 'hidden-layer' : ''}" 
             data-id="${item.id}">
          <div class="layer-card-left">
            <div class="layer-drag-handle" title="Drag to reorder layer">
              <i class="ph ph-dots-six-vertical"></i>
            </div>
            <div class="layer-order-badge" title="Layer #${layerNum}">#${layerNum}</div>
            <div class="layer-thumb-box">
              <img src="${item.src}" alt="${item.name}" class="layer-thumb-img" />
            </div>
            <div class="layer-info-wrap">
              <div class="layer-title-row">
                <span class="layer-title" title="${item.name}">${item.name}</span>
                ${item.isPlayable ? '<span class="layer-hero-badge" title="Designated Playable Character"><i class="ph ph-crown"></i> HERO</span>' : ''}
                ${item.isSolid ? '<span class="layer-solid-badge" title="Solid Obstacle"><i class="ph ph-shield"></i> SOLID</span>' : ''}
              </div>
              <span class="layer-meta">${meta}</span>
            </div>
          </div>
          <div class="layer-card-actions">
            <button class="layer-btn btn-layer-up" data-action="up" title="Bring Forward (1 Step Up)" ${i === items.length - 1 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
              <i class="ph ph-caret-up"></i>
            </button>
            <button class="layer-btn btn-layer-down" data-action="down" title="Send Backward (1 Step Down)" ${i === 0 ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
              <i class="ph ph-caret-down"></i>
            </button>
            <button class="layer-btn btn-layer-vis ${isHidden ? 'is-hidden' : ''}" data-action="toggle-vis" title="${isHidden ? 'Show Layer (Visible on Canvas)' : 'Hide Layer (Hidden on Canvas)'}">
              <i class="ph ${isHidden ? 'ph-eye-slash' : 'ph-eye'}"></i>
            </button>
            <button class="layer-btn btn-layer-lock ${isLocked ? 'is-locked' : ''}" data-action="toggle-lock" title="${isLocked ? 'Unlock Layer (Enable Canvas Editing)' : 'Lock Layer (Freeze Canvas Position)'}">
              <i class="ph ${isLocked ? 'ph-lock-simple' : 'ph-lock-simple-open'}"></i>
            </button>
            <button class="layer-btn btn-layer-delete" data-action="delete" title="Delete Layer">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      `;
    }

    listEl.innerHTML = html;
  },

  moveItemUp(id) {
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx >= 0 && idx < WorldObjectsManager.items.length - 1) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx + 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      SoundEngine.playChiptuneTone(560, "square", 0.05, 0.08);
    }
  },

  moveItemDown(id) {
    const idx = WorldObjectsManager.items.findIndex(it => it.id === id);
    if (idx > 0) {
      const item = WorldObjectsManager.items.splice(idx, 1)[0];
      WorldObjectsManager.items.splice(idx - 1, 0, item);
      WorldObjectsManager.selectedId = id;
      WorldObjectsManager.saveHistory();
      this.update();
      if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
      SoundEngine.playChiptuneTone(420, "square", 0.05, 0.08);
    }
  },

  toggleVisibility(id) {
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.hidden = !item.hidden;
    WorldObjectsManager.saveHistory();
    this.update();
    SoundEngine.playChiptuneTone(item.hidden ? 340 : 640, "square", 0.05, 0.08);
  },

  toggleLock(id) {
    const item = WorldObjectsManager.items.find(it => it.id === id);
    if (!item) return;
    item.locked = !item.locked;
    WorldObjectsManager.saveHistory();
    this.update();
    SoundEngine.playChiptuneTone(item.locked ? 300 : 600, "square", 0.05, 0.08);
  },

  deleteItem(id) {
    WorldObjectsManager.items = WorldObjectsManager.items.filter(it => it.id !== id);
    if (WorldObjectsManager.selectedId === id) {
      WorldObjectsManager.selectedId = null;
      PropertiesController.updateFromSelected(null);
      if (typeof SpritePosesController !== "undefined") SpritePosesController.hide();
    }
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof AppModeController !== "undefined") {
      AppModeController.renderObjectsList();
      AppModeController.updateTargetBadge();
    }
    SoundEngine.playChiptuneTone(220, "square", 0.08, 0.1);
  },

  reorderLayer(draggedId, targetId, placeAbove) {
    const items = WorldObjectsManager.items;
    const fromIdx = items.findIndex(it => it.id === draggedId);
    const toIdx = items.findIndex(it => it.id === targetId);

    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const [draggedItem] = items.splice(fromIdx, 1);
    const newTargetIdx = items.findIndex(it => it.id === targetId);

    // In UI, top is index items.length - 1 (frontmost).
    // So "placeAbove in UI" means place at higher array index (after newTargetIdx in array).
    const insertIdx = placeAbove ? newTargetIdx + 1 : newTargetIdx;
    items.splice(Math.max(0, Math.min(items.length, insertIdx)), 0, draggedItem);

    WorldObjectsManager.selectedId = draggedId;
    WorldObjectsManager.saveHistory();
    this.update();
    if (typeof AppModeController !== "undefined") AppModeController.renderObjectsList();
    SoundEngine.playChiptuneTone(620, "square", 0.06, 0.1);
  }
};

// ============================================================================
// 6. CONFIG CONTROLLER (Sync UI & World Settings)
// ============================================================================