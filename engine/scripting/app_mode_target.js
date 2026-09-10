/**
 * UNIFIVE Scripting - App Mode Target & Code Workspace Rendering Subsystem
 */
const AppModeTarget = {
  getBlock(blockId, targetId) {
    if (!blockId || typeof AppModeController === "undefined") return null;
    const id = targetId || AppModeController.getActiveTargetId();
    const scripts = AppModeController.objectScripts && AppModeController.objectScripts[id];
    return Array.isArray(scripts) ? scripts.find(block => block.id === blockId) || null : null;
  },

  getBlockElement(blockId) {
    if (!blockId) return null;
    const workspace = document.getElementById("code-workspace-blocks");
    if (!workspace) return null;
    const blocks = workspace.querySelectorAll(".code-block-item");
    for (const element of blocks) {
      if (String(element.getAttribute("data-block-id")) === String(blockId)) return element;
    }
    return null;
  },

  renderObjectsList() {
    const listEl = document.getElementById("code-objects-list");
    const countBadge = document.getElementById("code-objects-count-badge");
    if (!listEl) return;

    const items = typeof WorldObjectsManager !== "undefined" && Array.isArray(WorldObjectsManager.items) ? WorldObjectsManager.items : [];
    if (countBadge) countBadge.textContent = `${items.length} ${items.length === 1 ? 'OBJECT' : 'OBJECTS'}`;

    listEl.innerHTML = "";

    // 1. Global Stage Card
    const selectedId = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.selectedId : null;
    const isStageSelected = !selectedId;
    const stageCard = document.createElement("div");
    stageCard.className = `code-object-card ${isStageSelected ? 'active' : ''}`;
    stageCard.innerHTML = `
      <div class="code-obj-thumb-box" style="background-color: #1e1b4b; display: flex; align-items: center; justify-content: center;">
        <i class="ph ph-globe" style="font-size: 1.3rem; color: #a5b4fc;"></i>
      </div>
      <div class="code-obj-info">
        <div class="code-obj-title-row">
          <span class="code-obj-name">STAGE (GLOBAL)</span>
          <span class="code-obj-type-tag" style="background-color: #312e81; color: #c7d2fe; border-color: #4338ca;">BACKDROP</span>
        </div>
        <div class="code-obj-coords-row">
          <span class="code-obj-coord">Global Scripts</span>
        </div>
      </div>
    `;
    stageCard.addEventListener("click", () => {
      if (typeof WorldObjectsManager !== "undefined") WorldObjectsManager.selectedId = null;
      if (typeof AppModeController !== "undefined") AppModeController.activeTargetId = "global_stage";
      this.renderObjectsList();
      this.updateTargetBadge();
      this.renderScriptsForActiveTarget();
      if (typeof BlockPalette !== "undefined") BlockPalette.renderCategoryBlocks(BlockPalette.activeCategory || "events");
      if (typeof SoundEngine !== "undefined") SoundEngine.playAction("select");
    });
    listEl.appendChild(stageCard);

    // 2. Objects Cards
    items.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = `code-object-card ${item.id === selectedId ? 'active' : ''}`;
      card.setAttribute("data-id", item.id);

      const isSprite = item.type === "sprite" || (item.assetId && item.assetId.startsWith("sprite_")) || item.poses;
      const typeLabel = isSprite ? "SPRITE" : (item.type || "PROP");

      const thumbUrl = item.thumb || item.image || item.src;
      card.innerHTML = `
        <div class="code-obj-thumb-box">
          <img class="code-obj-thumb-img" src="${thumbUrl}" alt="${item.name}" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'ph ph-cube\\' style=\\'font-size: 1.3rem; color: #fda4af;\\'></i>';" />
        </div>
        <div class="code-obj-info">
          <div class="code-obj-title-row">
            <span class="code-obj-name" title="${item.name}">${item.name}</span>
            ${item.isPlayable ? '<span class="code-obj-hero-badge" title="Hero"><i class="ph ph-crown"></i> HERO</span>' : ''}
            <span class="code-obj-type-tag">${typeLabel}</span>
          </div>
          <div class="code-obj-coords-row">
            <span class="code-obj-coord">X: <strong>${Math.round(item.x)}</strong></span>
            <span class="code-obj-coord">Y: <strong>${Math.round(item.y)}</strong></span>
            <span class="code-obj-coord">L: <strong>#${index + 1}</strong></span>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        if (typeof WorldObjectsManager !== "undefined") {
          WorldObjectsManager.selectedId = (WorldObjectsManager.selectedId === item.id) ? null : item.id;
        }
        if (typeof AppModeController !== "undefined") AppModeController.activeTargetId = WorldObjectsManager.selectedId || "global_stage";
        this.renderObjectsList();
        this.updateTargetBadge();
        this.renderScriptsForActiveTarget();
        if (typeof BlockPalette !== "undefined") BlockPalette.renderCategoryBlocks(BlockPalette.activeCategory || "events");
        if (typeof SoundEngine !== "undefined") SoundEngine.playAction("select");
      });
      listEl.appendChild(card);
    });
  },

  updateTargetBadge() {
    const nameEl = document.getElementById("code-target-name");
    const prefixEl = document.querySelector(".code-target-prefix");
    const iconEl = document.getElementById("code-target-icon");

    const sel = typeof WorldObjectsManager !== "undefined" ? WorldObjectsManager.getSelectedItem() : null;
    if (sel) {
      if (nameEl) nameEl.textContent = sel.name || sel.id;
      if (prefixEl) prefixEl.textContent = (sel.type === "sprite" || (sel.assetId && sel.assetId.startsWith("sprite_"))) ? "SPRITE:" : "PROP:";
      if (iconEl) iconEl.className = "ph ph-person-simple-walk";
    } else {
      if (nameEl) nameEl.textContent = "STAGE (GLOBAL)";
      if (prefixEl) prefixEl.textContent = "TARGET:";
      if (iconEl) iconEl.className = "ph ph-globe";
    }
  },

  renderScriptsForActiveTarget() {
    const workspaceEl = document.getElementById("code-workspace-blocks");
    const emptyEl = document.getElementById("code-workspace-empty");
    if (!workspaceEl) return;

    const targetId = typeof AppModeController !== "undefined" && typeof AppModeController.getActiveTargetId === "function"
      ? AppModeController.getActiveTargetId()
      : "global_stage";
    const key = targetId || "global_stage";
    const scripts = (typeof AppModeController !== "undefined" && AppModeController.objectScripts) ? (AppModeController.objectScripts[key] || []) : [];

    workspaceEl.innerHTML = "";
    if (scripts.length === 0) {
      if (emptyEl) emptyEl.style.display = "flex";
    } else {
      if (emptyEl) emptyEl.style.display = "none";
      if (typeof BlockPalette !== "undefined" && typeof BlockPalette.renderScripts === "function") {
        BlockPalette.renderScripts(workspaceEl, scripts);
      }
    }
  },

  updateWorkspaceTransform() {
    const workspaceEl = document.getElementById("code-workspace-blocks");
    const dropZone = document.getElementById("code-drop-zone");
    const zoomLabel = document.getElementById("code-zoom-level");
    const panX = typeof this.panX === "number" ? this.panX : 40;
    const panY = typeof this.panY === "number" ? this.panY : 40;
    const zoom = typeof this.zoom === "number" ? this.zoom : 1;
    if (workspaceEl) {
      workspaceEl.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
      workspaceEl.style.transformOrigin = "0 0";
    }
    if (dropZone) {
      dropZone.style.backgroundPosition = `${panX}px ${panY}px`;
      dropZone.style.backgroundSize = `${24 * zoom}px ${24 * zoom}px`;
    }
    if (zoomLabel) zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }
};

if (typeof AppModeController !== "undefined") {
  Object.assign(AppModeController, AppModeTarget);
}
