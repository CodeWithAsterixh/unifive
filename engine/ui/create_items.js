/**
 * UNIFIVE Engine - Create Items Subsystem
 * Gallery items grid rendering, drag-to-place handlers, and asset selection.
 */
const CreateItems = {
  renderGallery(controller, cat) {
    const headerIcon = document.getElementById("gallery-header-icon");
    const headerTitle = document.getElementById("gallery-header-title");
    const headerCount = document.getElementById("gallery-header-count");
    const gridEl = document.getElementById("create-items-grid");

    if (!gridEl) return;
    gridEl.innerHTML = "";

    if (!cat) {
      if (headerIcon) headerIcon.className = "ph ph-squares-four";
      if (headerTitle) headerTitle.textContent = "EMPTY";
      if (headerCount) headerCount.textContent = "0 ITEMS";
      gridEl.innerHTML = `
        <div class="empty-gallery-state" style="grid-column: 1 / -1;">
          <i class="ph ph-hourglass-empty empty-gallery-icon"></i>
          <span class="empty-gallery-title">NO CATEGORY</span>
          <span class="empty-gallery-subtitle">No categories available for this view.</span>
        </div>
      `;
      return;
    }

    if (headerIcon) headerIcon.className = `ph ${cat.icon || "ph-squares-four"}`;
    if (headerTitle) headerTitle.textContent = cat.name.toUpperCase();

    const items = cat.items || [];
    if (headerCount) headerCount.textContent = `${items.length} ${items.length === 1 ? "ITEM" : "ITEMS"}`;

    if (items.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-gallery-state" style="grid-column: 1 / -1;">
          <i class="ph ph-package empty-gallery-icon"></i>
          <span class="empty-gallery-title">NO ITEMS YET</span>
          <span class="empty-gallery-subtitle">Assets for ${cat.name} are coming soon!</span>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement("div");
      const isSelected = controller.selectedAssetId === item.id;
      card.className = `asset-card ${isSelected ? "active" : ""}`;
      card.setAttribute("data-asset-id", item.id);
      card.setAttribute("title", `Drag to place or click to select: ${item.name}`);
      card.draggable = true;

      card.innerHTML = `
        <div class="asset-thumb-box">
          <img class="asset-thumb-img" src="${item.src}" alt="${item.name}" loading="lazy" draggable="false"
               onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
          <div class="asset-thumb-placeholder" style="display: none;">
            <i class="ph ph-image"></i>
          </div>
        </div>
        <span class="asset-title">${item.name}</span>
      `;

      card.addEventListener("dragstart", (e) => {
        controller.draggedItem = item;
        card.classList.add("dragging");
        try {
          e.dataTransfer.setData("application/json", JSON.stringify(item));
          e.dataTransfer.setData("text/plain", item.id);
          e.dataTransfer.effectAllowed = "copy";
        } catch (err) {
          console.warn("DragStart dataTransfer error:", err);
        }
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        controller.draggedItem = null;
        if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.ghostPreview) {
          WorldObjectsManager.ghostPreview.active = false;
        }
      });

      card.addEventListener("click", () => {
        this.selectAsset(controller, item);
        gridEl.querySelectorAll(".asset-card").forEach(c => {
          c.classList.toggle("active", c.getAttribute("data-asset-id") === item.id);
        });
        
        // Click to add asset to canvas at current camera view center (with small random jitter)
        if (typeof WorldObjectsManager !== "undefined" && typeof WorldConfig !== "undefined") {
          const jitterX = (Math.random() - 0.5) * 40;
          const jitterY = (Math.random() - 0.5) * 40;
          WorldObjectsManager.addItem(item, WorldConfig.panX + jitterX, WorldConfig.panY + jitterY);
        }
        
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(680, "square", 0.05, 0.09);
      });

      gridEl.appendChild(card);
    });
  },

  selectAsset(controller, item) {
    controller.selectedAssetId = item ? item.id : null;
    controller.selectedAsset = item || null;
    if (item && (item.type === "sprite" || item.poses || (item.id && item.id.startsWith("sprite_")))) {
      if (typeof SpritePosesController !== "undefined") {
        SpritePosesController.show(item);
      }
    }
  }
};
