/**
 * UNIFIVE Engine - Create Items Gallery Subsystem
 */
const CreateItems = {
  renderGallery(controller, cat) {
    const galleryEl = document.getElementById("create-items-grid");
    const titleEl = document.getElementById("gallery-header-title");
    const iconEl = document.getElementById("gallery-header-icon");
    const countEl = document.getElementById("gallery-header-count");

    if (cat) {
      if (titleEl) titleEl.textContent = (cat.name || cat.id || "").toUpperCase();
      if (iconEl) iconEl.className = "ph " + (cat.icon || "ph-squares-four");
      if (countEl) countEl.textContent = (cat.items ? cat.items.length : 0) + " ITEMS";
    } else {
      if (titleEl) titleEl.textContent = "GALLERY";
      if (countEl) countEl.textContent = "0 ITEMS";
    }

    if (!galleryEl) return;
    galleryEl.innerHTML = "";

    if (!cat || !Array.isArray(cat.items) || cat.items.length === 0) {
      galleryEl.innerHTML = '<div class="create-empty-notice" style="grid-column: 1/-1; padding: 20px; text-align: center; color: #a38290;">No items in this category.</div>';
      return;
    }

    for (const item of cat.items) {
      if (typeof CreateCardBuilder !== "undefined") {
        const card = CreateCardBuilder.createCard(item, cat, controller);
        galleryEl.appendChild(card);
      }
    }
  }
};
