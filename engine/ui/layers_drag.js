/**
 * UNIFIVE Engine - Layers Drag & Reorder Subsystem
 * Pointer-based drag and drop reordering of layer cards in the layers panel.
 */
const LayersDrag = {
  dragState: null,

  init(listEl, onReorder) {
    if (!listEl) return;

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

      this.dragState = {
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
      if (!this.dragState || e.pointerId !== this.dragState.pointerId) return;
      e.preventDefault();

      const { card, placeholder, offsetX, offsetY } = this.dragState;

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
      if (!this.dragState || e.pointerId !== this.dragState.pointerId) return;

      const { card, placeholder, startId } = this.dragState;
      
      // Determine where the placeholder ended up relative to other cards
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

      // UI list is in reverse array order: top of list = highest array index (frontmost)
      const uiIndexFromTop = cardsBeforePlaceholder.length;
      if (typeof onReorder === "function") {
        onReorder(startId, uiIndexFromTop);
      }

      this.dragState = null;
    };

    listEl.addEventListener("pointerup", finishDrag);
    listEl.addEventListener("pointercancel", finishDrag);
  }
};
