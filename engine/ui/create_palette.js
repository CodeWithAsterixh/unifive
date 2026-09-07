/**
 * UNIFIVE Engine - Create Palette Subsystem
 * Assets manifest catalog loader, perspective filtering, and categories sidebar rendering.
 */
const CreatePalette = {
  assetsData: null,

  async loadAssetsData() {
    try {
      let response = await fetch("assets.json");
      if (!response.ok) {
        response = await fetch("../assets.json");
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.assetsData = await response.json();
    } catch (e) {
      console.warn("Could not load assets.json via fetch, using fallback data.", e);
      this.assetsData = this.getFallbackAssetsData();
    }
  },

  getCategoriesForCurrentView() {
    if (!this.assetsData) return [];
    const view = (typeof ViewController !== "undefined" && ViewController.currentView) || "topdown";
    return this.assetsData[view] || [];
  },

  renderCategories(controller) {
    const sidebarEl = document.getElementById("create-kinds-list");
    if (!sidebarEl) return;

    const categories = this.getCategoriesForCurrentView();
    sidebarEl.innerHTML = "";

    if (categories.length === 0) {
      if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, null);
      return;
    }

    // Default to the first category if none active or current not in view
    if (!controller.activeCategoryId || !categories.some(c => c.id === controller.activeCategoryId)) {
      controller.activeCategoryId = categories[0].id;
    }

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = `create-cat-btn ${cat.id === controller.activeCategoryId ? "active" : ""}`;
      btn.setAttribute("data-cat-id", cat.id);
      btn.setAttribute("title", cat.name + (cat.description ? ` - ${cat.description}` : ""));
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat.id === controller.activeCategoryId ? "true" : "false");

      btn.innerHTML = `
        <i class="ph ${cat.icon || "ph-squares-four"}"></i>
        <span class="cat-label">${cat.name}</span>
      `;

      btn.addEventListener("click", () => {
        if (controller.activeCategoryId !== cat.id) {
          controller.activeCategoryId = cat.id;
          sidebarEl.querySelectorAll(".create-cat-btn").forEach(b => {
            const isActive = b.getAttribute("data-cat-id") === cat.id;
            b.classList.toggle("active", isActive);
            b.setAttribute("aria-selected", isActive ? "true" : "false");
          });
          if (typeof AsyncSceneStore !== "undefined") {
            AsyncSceneStore.saveCurrentScene();
          }
          if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(520, "square", 0.05, 0.08);
          if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, cat);
        }
      });

      sidebarEl.appendChild(btn);
    });

    const activeCat = categories.find(c => c.id === controller.activeCategoryId) || categories[0];
    if (typeof CreateItems !== "undefined") CreateItems.renderGallery(controller, activeCat);
  },

  getFallbackAssetsData() {
    return {
      sidefacing: [
        {
          id: "city",
          name: "City",
          icon: "ph-buildings",
          description: "Urban skylines & buildings",
          items: [
            { id: "city_1_comp", name: "City 1 Skyline", src: "assets/sidefacing-assets/city-backgrounds/city_1_composite.png" },
            { id: "city_2_comp", name: "City 2 Panorama", src: "assets/sidefacing-assets/city-backgrounds/city_2_composite.png" },
            { id: "city_3_comp", name: "City 3 Metropolis", src: "assets/sidefacing-assets/city-backgrounds/city_3_composite.png" }
          ]
        },
        {
          id: "desert",
          name: "Desert",
          icon: "ph-sun",
          description: "Golden sand dunes & oasis",
          items: [
            { id: "desert_1_comp", name: "Desert Oasis 1", src: "assets/sidefacing-assets/desert-oasis-background/desert_1_composite.png" },
            { id: "desert_2_comp", name: "Desert Oasis 2", src: "assets/sidefacing-assets/desert-oasis-background/desert_2_composite.png" }
          ]
        },
        {
          id: "forest",
          name: "Forest",
          icon: "ph-tree",
          description: "Lush trees & meadows",
          items: [
            { id: "forest_1_comp", name: "Forest Meadow 1", src: "assets/sidefacing-assets/forest-and-trees-backgrounds/forest_1_layer5_composite.png" },
            { id: "forest_2_comp", name: "Forest Woods 2", src: "assets/sidefacing-assets/forest-and-trees-backgrounds/forest_2_composite_hd.png" }
          ]
        },
        {
          id: "mountain",
          name: "Mountain",
          icon: "ph-mountains",
          description: "Rocky peaks & ranges",
          items: [
            { id: "mtn_1_comp", name: "Alpine Peak 1", src: "assets/sidefacing-assets/mountain-backgrounds/mountain_1_composite.png" },
            { id: "mtn_2_comp", name: "Alpine Ridge 2", src: "assets/sidefacing-assets/mountain-backgrounds/mountain_2_composite.png" }
          ]
        },
        {
          id: "ocean",
          name: "Ocean",
          icon: "ph-waves",
          description: "Seascapes & ocean waves",
          items: [
            { id: "ocean_1_comp", name: "Ocean Horizon 1", src: "assets/sidefacing-assets/ocean-and-clouds-backgrounds/ocean_1_composite_hd.png" }
          ]
        },
        {
          id: "post-war",
          name: "Post-War",
          icon: "ph-skull",
          description: "Apocalyptic ruins",
          items: [
            { id: "war_1_comp", name: "Warzone 1", src: "assets/sidefacing-assets/post-war-backgrounds/War1_Bright_War.png" }
          ]
        },
        {
          id: "street",
          name: "Street",
          icon: "ph-road-horizon",
          description: "2D streetscapes & shops",
          items: [
            { id: "street_1_comp", name: "Street 1", src: "assets/sidefacing-assets/street-2d-backgrounds/City1_Bright_City1.png" }
          ]
        },
        {
          id: "summer",
          name: "Summer",
          icon: "ph-sun-horizon",
          description: "Sunny villages & meadows",
          items: [
            { id: "summer_1_comp", name: "Summer Village 1", src: "assets/sidefacing-assets/summer-backgrounds/summer_1_composite_hd.png" }
          ]
        },
        {
          id: "sprites",
          name: "Sprites",
          icon: "ph-person-simple-walk",
          description: "Character sprites with multiple action poses and animations",
          folder: "sidefacing-sprites",
          items: [
            { id: "sprite_archer", name: "Archer", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_archer.png", defaultPose: "Idle" },
            { id: "sprite_swordsman", name: "Swordsman", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_swordsman.png", defaultPose: "Idle" },
            { id: "sprite_wizard", name: "Wizard", theme: "Fantasy Chibi Male", type: "sprite", src: "assets/sprites/single-frames/sprite_wizard.png", defaultPose: "Idle" }
          ]
        }
      ],
      topdown: [
        { id: "tiles", name: "Tiles & Roads", icon: "ph-grid-four", description: "Tropical land, cobblestone roads & paths", items: [] },
        { id: "structures", name: "Structures", icon: "ph-house-line", description: "Medieval city houses, castles & towers", items: [] },
        { id: "nature", name: "Nature & Rocks", icon: "ph-tree", description: "Boulders, moss stones & trees", items: [] },
        { id: "props", name: "Props & Decor", icon: "ph-cube", description: "City decor, stalls, furniture & pets", items: [] },
        { id: "dungeon", name: "Dungeon", icon: "ph-skull", description: "Dungeon walls, traps & chests", items: [] },
        {
          id: "sprites",
          name: "Sprites",
          icon: "ph-person-simple-walk",
          description: "Top-down character sprites & animals with 4-direction animations",
          items: [
            { id: "sprite_male_sword", name: "Male Warrior (Sword)", theme: "Top-Down RPG Hero", type: "sprite", src: "assets/sprites/topdown/male_sword/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_male_unarmed", name: "Male Adventurer (Unarmed)", theme: "Top-Down RPG Hero", type: "sprite", src: "assets/sprites/topdown/male_unarmed/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_boar", name: "Wild Boar", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/boar/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_deer", name: "Forest Deer", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/deer/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_fox", name: "Red Fox", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/fox/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_hare", name: "Field Hare", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/hare/single_frame.png", defaultPose: "Idle Front" },
            { id: "sprite_black_grouse", name: "Black Grouse", theme: "Top-Down Animals", type: "sprite", src: "assets/sprites/topdown/black_grouse/single_frame.png", defaultPose: "Idle Front" }
          ]
        }
      ]
    };
  }
};
