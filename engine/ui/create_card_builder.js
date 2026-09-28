/**
 * UNIFIVE Engine - Create Card Builder Subsystem
 * Handles mouse and touch drag-and-drop of assets onto the canvas stage.
 */
const CreateCardBuilder = {
  closeSidebar() {
    if (typeof MobileNavigationController !== "undefined") {
      MobileNavigationController.closeDrawer();
    }
    const controls = document.getElementById("controls-pane");
    const codePane = document.getElementById("code-toolbox-pane");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (controls) controls.classList.remove("drawer-open");
    if (codePane) codePane.classList.remove("drawer-open");
    if (backdrop) {
      backdrop.classList.remove("active");
      backdrop.style.display = "none";
    }
  },

  createCard(item, cat, controller) {
    const card = document.createElement("div");
    card.className = "create-item-card";
    card.setAttribute("data-item-id", item.id);
    card.setAttribute("title", item.name || item.id);
    card.draggable = true;

    const thumbUrl = item.thumb || item.image || item.src;
    card.innerHTML = `
      <div class="create-card-thumb">
        <img src="${thumbUrl}" alt="${item.name}" loading="lazy" draggable="false" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'ph ph-image-square\\' style=\\'font-size: 2rem; color: #fda4af;\\'></i>';" />
      </div>
      <div class="create-card-label">${item.name}</div>
    `;

    // 1. Desktop HTML5 Drag & Drop
    card.addEventListener("dragstart", (e) => {
      if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = item;
      card.classList.add("dragging");

      // Auto-close sidebar on dragstart
      this.closeSidebar();

      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify(item));
        e.dataTransfer.setData("text/plain", String(item.id));
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = null;
      if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.ghostPreview) {
        WorldObjectsManager.ghostPreview.active = false;
      }
    });

    // 2. Mobile Touch Drag & Drop with Immediate Auto-Closing Sidebar
    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isTouchDragging = false;
    let touchGhost = null;

    card.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      isTouchDragging = false;
    }, { passive: false });

    card.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);

      if (dist > 5 && !isTouchDragging) {
        isTouchDragging = true;
        card.classList.add("dragging");
        if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = item;

        // Auto-close sidebar immediately so the full canvas stage is visible
        this.closeSidebar();

        touchGhost = document.createElement("div");
        touchGhost.className = "create-touch-drag-ghost";
        touchGhost.style.position = "fixed";
        touchGhost.style.pointerEvents = "none";
        touchGhost.style.zIndex = "999999";
        touchGhost.style.width = "64px";
        touchGhost.style.height = "64px";
        touchGhost.style.transform = "translate(-50%, -50%)";
        touchGhost.style.opacity = "0.92";
        touchGhost.style.boxShadow = "0 8px 24px rgba(0,0,0,0.8), 2px 2px 0px #000";
        touchGhost.style.border = "2px solid var(--gold-bright, #fde047)";
        touchGhost.style.background = "rgba(26,4,11,0.95)";
        touchGhost.style.display = "flex";
        touchGhost.style.alignItems = "center";
        touchGhost.style.justifyContent = "center";
        touchGhost.style.overflow = "hidden";
        touchGhost.innerHTML = `<img src="${thumbUrl}" style="max-width:100%;max-height:100%;object-fit:contain;image-rendering:pixelated;pointer-events:none;" />`;
        document.body.appendChild(touchGhost);
      }

      if (isTouchDragging) {
        if (touchGhost) {
          touchGhost.style.left = `${touch.clientX}px`;
          touchGhost.style.top = `${touch.clientY}px`;
        }
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    card.addEventListener("touchend", () => {
      if (isTouchDragging) {
        if (touchGhost && touchGhost.parentNode) {
          touchGhost.parentNode.removeChild(touchGhost);
        }
        touchGhost = null;
        card.classList.remove("dragging");
        if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = null;

        // Check if dropped on stage canvas
        const container = document.getElementById("canvas-container");
        if (container && typeof mainCanvas !== "undefined" && mainCanvas) {
          const rect = container.getBoundingClientRect();
          if (lastTouchX >= rect.left && lastTouchX <= rect.right && lastTouchY >= rect.top && lastTouchY <= rect.bottom) {
            const cam = (typeof getActiveStageCamera === "function") ? getActiveStageCamera() : { panX: 1000, panY: 750, zoom: 1.0 };
            const sx = lastTouchX - rect.left;
            const sy = lastTouchY - rect.top;
            const wx = Math.round(cam.panX + (sx - width / 2) / cam.zoom);
            const wy = Math.round(cam.panY + (sy - height / 2) / cam.zoom);

            if (typeof WorldObjectsManager !== "undefined") {
              WorldObjectsManager.addItemFromPalette(item, wx, wy);
              if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
            }
          }
        }
      }
      isTouchDragging = false;
    });

    card.addEventListener("touchcancel", () => {
      if (touchGhost && touchGhost.parentNode) {
        touchGhost.parentNode.removeChild(touchGhost);
      }
      touchGhost = null;
      card.classList.remove("dragging");
      if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = null;
      isTouchDragging = false;
    });

    // 3. Click / Tap to Add Item
    card.addEventListener("click", () => {
      if (isTouchDragging) return;
      if (typeof WorldObjectsManager !== "undefined") {
        WorldObjectsManager.addItemFromPalette(item);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
      }
    });

    return card;
  }
};

if (typeof window !== "undefined") window.CreateCardBuilder = CreateCardBuilder;
if (typeof globalThis !== "undefined") globalThis.CreateCardBuilder = CreateCardBuilder;
