/**
 * UNIFIVE Engine - Create Category Button Subsystem
 */
const CreateCatButton = {
  createButton(cat, controller, sidebarEl) {
    const btn = document.createElement("button");
    btn.className = "create-cat-btn" + (cat.id === controller.activeCategoryId ? " active" : "");
    btn.setAttribute("data-cat-id", cat.id);
    btn.setAttribute("title", cat.name + (cat.description ? " - " + cat.description : ""));
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", cat.id === controller.activeCategoryId ? "true" : "false");
    btn.innerHTML = '<i class="ph ' + (cat.icon || "ph-squares-four") + '"></i><span class="cat-label">' + cat.name + '</span>';

    btn.addEventListener("click", () => {
      if (controller.activeCategoryId !== cat.id) {
        controller.activeCategoryId = cat.id;
        const allBtns = sidebarEl.querySelectorAll(".create-cat-btn");
        for (const b of allBtns) {
          const isActive = b.getAttribute("data-cat-id") === cat.id;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-selected", isActive ? "true" : "false");
        }
        if (typeof AsyncSceneStore !== "undefined") AsyncSceneStore.saveCurrentScene();
        if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
        if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, cat);
      }
    });
    return btn;
  }
};
