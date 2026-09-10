/**
 * UNIFIVE Engine - Layers Drag Reordering Subsystem
 */
const LayersDrag = {
  init(listEl, onReorder) {
    let draggedCard = null;

    listEl.addEventListener("dragstart", (e) => {
      const card = e.target.closest(".layer-item-card");
      if (!card) return;
      draggedCard = card;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.getAttribute("data-id"));
      card.classList.add("dragging");
    });

    listEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const targetCard = e.target.closest(".layer-item-card");
      if (targetCard && targetCard !== draggedCard) {
        const rect = targetCard.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        listEl.insertBefore(draggedCard, next ? targetCard.nextSibling : targetCard);
      }
    });

    listEl.addEventListener("dragend", (e) => {
      if (!draggedCard) return;
      draggedCard.classList.remove("dragging");
      const cards = Array.from(listEl.querySelectorAll(".layer-item-card"));
      const newIndex = cards.indexOf(draggedCard);
      const id = draggedCard.getAttribute("data-id");
      draggedCard = null;
      if (newIndex >= 0 && typeof onReorder === "function") {
        onReorder(id, newIndex);
      }
    });
  }
};
