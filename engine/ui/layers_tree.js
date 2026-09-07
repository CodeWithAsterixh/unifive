/**
 * UNIFIVE Engine - Layers Tree Subsystem
 * HTML rendering and UI synchronization of the Layers panel list and count badge.
 */
const LayersTree = {
  renderList() {
    const listEl = document.getElementById("layers-items-list");
    const emptyEl = document.getElementById("layers-empty-state");
    const countBadge = document.getElementById("layers-count-badge");
    const dockLayerGroup = document.getElementById("dock-layer-actions");

    if (typeof WorldObjectsManager === "undefined") return;
    const items = WorldObjectsManager.items || [];
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
  }
};
