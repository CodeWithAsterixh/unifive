/**
 * UNIFIVE Engine - Create Card Builder Subsystem
 */
const CreateCardBuilder = {
  createCard(item, cat, controller) {
    const card = document.createElement("div");
    card.className = "create-item-card";
    card.setAttribute("data-item-id", item.id);
    card.setAttribute("title", item.name || item.id);
    card.draggable = true;

    const thumbUrl = item.thumb || item.image || item.src;
    card.innerHTML = `
      <div class="create-card-thumb">
        <img src="${thumbUrl}" alt="${item.name}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'ph ph-image-square\\' style=\\'font-size: 2rem; color: #fda4af;\\'></i>';" />
      </div>
      <div class="create-card-label">${item.name}</div>
    `;

    card.addEventListener("dragstart", (e) => {
      if (typeof CreatePanelController !== "undefined") CreatePanelController.draggedItem = item;
      card.classList.add("dragging");
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

    card.addEventListener("click", () => {
      if (typeof WorldObjectsManager !== "undefined") {
        WorldObjectsManager.addItemFromPalette(item);
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(580, "square", 0.05, 0.08);
      }
    });
    return card;
  }
};
