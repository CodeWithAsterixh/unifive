/**
 * UNIFIVE Engine - Layers Tree Rendering Subsystem
 */
const LayersTree = {
  renderList() {
    const listEl = document.getElementById("layers-items-list");
    if (!listEl || typeof WorldObjectsManager === "undefined") return;
    const items = WorldObjectsManager.items || [];
    listEl.innerHTML = "";

    if (items.length === 0) {
      listEl.innerHTML = '<div class="layers-empty-notice">No items on stage. Place assets from CREATE tab.</div>';
      return;
    }

    const reversed = items.slice().reverse();
    for (let i = 0; i < reversed.length; i++) {
      const item = reversed[i];
      const card = this.createLayerCard(item, i);
      listEl.appendChild(card);
    }
  },
  createLayerCard(item, index) {
    const card = document.createElement("div");
    card.className = "layer-item-card" + (item.id === WorldObjectsManager.selectedId ? " selected" : "");
    card.setAttribute("data-id", item.id);
    card.setAttribute("draggable", "true");

    const icon = item.isPlayer ? "ph-game-controller" : (item.isSolid ? "ph-cube" : "ph-image");
    const name = item.name || item.id;
    card.innerHTML = `
      <div class="layer-drag-grip"><i class="ph ph-dots-six-vertical"></i></div>
      <div class="layer-icon"><i class="ph ${icon}"></i></div>
      <div class="layer-name">${name}</div>
      <div class="layer-actions">
        <button class="layer-btn" data-action="up" title="Move Up"><i class="ph ph-caret-up"></i></button>
        <button class="layer-btn" data-action="down" title="Move Down"><i class="ph ph-caret-down"></i></button>
        <button class="layer-btn" data-action="toggle-vis" title="Toggle Visibility"><i class="ph ${item.hidden ? "ph-eye-slash" : "ph-eye"}"></i></button>
        <button class="layer-btn" data-action="toggle-lock" title="Toggle Lock"><i class="ph ${item.locked ? "ph-lock-simple" : "ph-lock-simple-open"}"></i></button>
        <button class="layer-btn layer-btn-del" data-action="delete" title="Delete"><i class="ph ph-trash"></i></button>
      </div>
    `;
    return card;
  }
};
