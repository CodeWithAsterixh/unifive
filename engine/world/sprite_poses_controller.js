const SpritePosesController = {
  panelEl: null,
  charNameEl: null,
  themeBadgeEl: null,
  countEl: null,
  gridEl: null,
  btnCloseEl: null,
  btnMinimizeEl: null,
  btnAutoplayToggleEl: null,
  autoplayLabelEl: null,
  activeItem: null,
  activeAnimators: [],
  loadedImages: {},

  init() {
    this.panelEl = document.getElementById("floating-sprite-poses-panel");
    this.charNameEl = document.getElementById("sprite-poses-char-name");
    this.themeBadgeEl = document.getElementById("sprite-poses-theme-badge");
    this.countEl = document.getElementById("sprite-poses-count");
    this.gridEl = document.getElementById("sprite-poses-grid");
    this.btnCloseEl = document.getElementById("btn-close-sprite-poses");
    this.btnMinimizeEl = document.getElementById("btn-minimize-sprite-poses");
    this.btnAutoplayToggleEl = document.getElementById("btn-toggle-sprite-autoplay");
    this.autoplayLabelEl = document.getElementById("sprite-autoplay-label");

    if (this.btnCloseEl) {
      this.btnCloseEl.addEventListener("click", () => {
        this.hide();
        SoundEngine.playChiptuneTone(380, "square", 0.05, 0.08);
      });
    }

    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.addEventListener("click", () => {
        this.toggleMinimize();
      });
    }

    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.addEventListener("click", () => {
        this.toggleAutoplay();
      });
    }

    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const spd = parseInt(chip.getAttribute("data-speed")) || 100;
        if (this.activeItem) {
          this.activeItem.animSpeed = spd;
          WorldObjectsManager.saveHistory();
        }
        speedChips.forEach(c => c.classList.toggle("active", c === chip));
        SoundEngine.playChiptuneTone(540, "square", 0.04, 0.08);
      });
    });

    // Close on Escape key
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.panelEl && this.panelEl.style.display !== "none") {
        this.hide();
      }
    });
  },

  toggleMinimize() {
    if (!this.panelEl) return;
    const isMin = this.panelEl.classList.toggle("minimized");
    if (this.btnMinimizeEl) {
      this.btnMinimizeEl.innerHTML = isMin ? '<i class="ph ph-caret-up"></i>' : '<i class="ph ph-caret-down"></i>';
    }
    SoundEngine.playChiptuneTone(isMin ? 440 : 580, "square", 0.05, 0.08);
  },

  toggleAutoplay() {
    if (!this.activeItem) return;
    this.activeItem.autoplay = !this.activeItem.autoplay;
    if (this.activeItem.autoplay && this.activeItem.poseData) {
      this.preparePoseAssetsForCanvas(this.activeItem, this.activeItem.poseData);
    }
    this.updateAutoplayUI();
    WorldObjectsManager.saveHistory();
    SoundEngine.playChiptuneTone(this.activeItem.autoplay ? 680 : 380, "square", 0.06, 0.1);
  },

  updateAutoplayUI() {
    const isAuto = this.activeItem ? !!this.activeItem.autoplay : false;
    if (this.btnAutoplayToggleEl) {
      this.btnAutoplayToggleEl.classList.toggle("active", isAuto);
      const icon = this.btnAutoplayToggleEl.querySelector("i");
      if (icon) icon.className = `ph ${isAuto ? "ph-pause" : "ph-play"}`;
    }
    if (this.autoplayLabelEl) {
      this.autoplayLabelEl.textContent = isAuto ? "AUTOPLAY: ON" : "AUTOPLAY: OFF";
    }
    const currentSpd = this.activeItem ? (this.activeItem.animSpeed || 100) : 100;
    const speedChips = document.querySelectorAll(".btn-speed-chip");
    speedChips.forEach(chip => {
      const chipSpd = parseInt(chip.getAttribute("data-speed")) || 100;
      chip.classList.toggle("active", chipSpd === currentSpd);
    });
  },

  preloadImage(src) {
    if (this.loadedImages[src]) return Promise.resolve(this.loadedImages[src]);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.loadedImages[src] = img;
        resolve(img);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = src;
    });
  },

  preparePoseAssetsForCanvas(item, poseData) {
    if (!item || !poseData) return;
    item.frameCount = poseData.frameCount || (poseData.frames ? poseData.frames.length : 1);
    item.frameWidth = poseData.frameWidth || 128;
    item.frameHeight = poseData.frameHeight || 128;
    item.animType = poseData.type;

    if (poseData.type === "frames" && Array.isArray(poseData.frames)) {
      item.p5FrameImgs = item.p5FrameImgs || [];
      poseData.frames.forEach((f, idx) => {
        WorldObjectsManager.loadImageAsset(f, (entry) => {
          if (entry.loaded && entry.img) item.p5FrameImgs[idx] = entry.img;
        });
      });
    } else if (poseData.sheet || typeof poseData === "string") {
      const sheetSrc = poseData.sheet || poseData;
      WorldObjectsManager.loadImageAsset(sheetSrc, (entry) => {
        if (entry.loaded && entry.img) item.p5SheetImg = entry.img;
      });
    }
  },

  show(item) {
    if (!this.panelEl) return;
    if (!item) {
      this.hide();
      return;
    }

    // Retrieve pose dictionary if missing on canvas instance
    let poses = item.poses;
    let theme = item.theme || "";
    let name = item.name || "Sprite";

    if ((!poses || Object.keys(poses).length === 0) && typeof CreatePanelController !== "undefined" && CreatePanelController.assetsData) {
      const allCategories = (CreatePanelController.assetsData.sidefacing || []).concat(CreatePanelController.assetsData.topdown || []);
      for (const cat of allCategories) {
        const found = (cat.items || []).find(it => it.id === item.assetId || it.id === item.id);
        if (found && found.poses) {
          poses = found.poses;
          theme = found.theme || theme;
          name = found.name || name;
          item.poses = found.poses;
          item.theme = found.theme;
          item.type = "sprite";
          break;
        }
      }
    }

    if (!poses || Object.keys(poses).length === 0) {
      this.hide();
      return;
    }

    this.activeItem = item;
    // Default autoplay to false if undefined
    if (typeof item.autoplay === "undefined") {
      item.autoplay = false;
    }

    const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];
    const activePoseData = poses[currentPoseName] || poses[Object.keys(poses)[0]];
    if (activePoseData) {
      item.poseData = activePoseData;
      this.preparePoseAssetsForCanvas(item, activePoseData);
    }

    if (this.charNameEl) this.charNameEl.textContent = name.toUpperCase();
    if (this.themeBadgeEl) this.themeBadgeEl.textContent = (theme || "CHARACTER").toUpperCase();
    const poseKeys = Object.keys(poses);
    if (this.countEl) this.countEl.textContent = `${poseKeys.length} ${poseKeys.length === 1 ? "POSE" : "POSES"}`;

    this.updateAutoplayUI();
    this.renderPoseCards(item, poses);
    this.panelEl.style.display = "flex";
  },

  hide() {
    this.stopAllAnimators();
    if (this.panelEl) this.panelEl.style.display = "none";
    this.activeItem = null;
  },

  stopAllAnimators() {
    this.activeAnimators.forEach(stopFn => {
      try { stopFn(); } catch (e) {}
    });
    this.activeAnimators = [];
  },

  renderPoseCards(item, poses) {
    if (!this.gridEl) return;
    this.stopAllAnimators();
    this.gridEl.innerHTML = "";

    const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];

    Object.entries(poses).forEach(([poseName, poseData]) => {
      const card = document.createElement("div");
      const isActive = currentPoseName === poseName || currentPoseName.toLowerCase() === poseName.toLowerCase();
      card.className = `pose-card ${isActive ? "active" : ""}`;
      card.setAttribute("data-pose-name", poseName);
      card.setAttribute("title", `Click to switch pose to ${poseName}`);

      const frameCount = poseData.frameCount || (poseData.frames ? poseData.frames.length : 1);

      card.innerHTML = `
        <div class="pose-preview-box">
          <canvas class="pose-canvas-elt" width="128" height="128"></canvas>
          <span class="pose-hover-indicator">HOVER: ANIMATE</span>
        </div>
        <div class="pose-footer">
          <span class="pose-name-label">${poseName}</span>
          <span class="pose-frames-badge">${frameCount} ${frameCount === 1 ? "FRAME" : "FRAMES"}</span>
        </div>
      `;

      const canvas = card.querySelector(".pose-canvas-elt");
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;

      // Draw initial static frame 0
      const previewSrc = poseData.preview || (typeof poseData === "string" ? poseData : poseData.sheet || (poseData.frames && poseData.frames[0]));
      
      let staticImg = null;
      this.preloadImage(previewSrc).then(img => {
        if (img) {
          staticImg = img;
          ctx.clearRect(0, 0, 128, 128);
          const ratio = Math.min(128 / img.width, 128 / img.height);
          const drawW = img.width * ratio;
          const drawH = img.height * ratio;
          const drawX = (128 - drawW) / 2;
          const drawY = (128 - drawH) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);
        }
      });

      // Hover Animation Controller
      let animTimer = null;
      let currentFrameIdx = 0;
      let isHovering = false;

      const stopAnimation = () => {
        isHovering = false;
        if (animTimer) {
          clearInterval(animTimer);
          animTimer = null;
        }
        currentFrameIdx = 0;
        if (staticImg) {
          ctx.clearRect(0, 0, 128, 128);
          const ratio = Math.min(128 / staticImg.width, 128 / staticImg.height);
          const drawW = staticImg.width * ratio;
          const drawH = staticImg.height * ratio;
          const drawX = (128 - drawW) / 2;
          const drawY = (128 - drawH) / 2;
          ctx.drawImage(staticImg, 0, 0, staticImg.width, staticImg.height, drawX, drawY, drawW, drawH);
        }
      };

      const startAnimation = async () => {
        isHovering = true;
        if (frameCount <= 1) return;

        if (poseData.type === "frames" && Array.isArray(poseData.frames)) {
          // Sequence of individual frame images (e.g. Police)
          const loadedFrames = await Promise.all(poseData.frames.map(f => this.preloadImage(f)));
          if (!isHovering) return;

          animTimer = setInterval(() => {
            currentFrameIdx = (currentFrameIdx + 1) % loadedFrames.length;
            const fImg = loadedFrames[currentFrameIdx];
            if (fImg) {
              ctx.clearRect(0, 0, 128, 128);
              const ratio = Math.min(128 / fImg.width, 128 / fImg.height);
              const drawW = fImg.width * ratio;
              const drawH = fImg.height * ratio;
              const drawX = (128 - drawW) / 2;
              const drawY = (128 - drawH) / 2;
              ctx.drawImage(fImg, 0, 0, fImg.width, fImg.height, drawX, drawY, drawW, drawH);
            }
          }, 100); // 10 FPS
        } else {
          // Horizontal sprite sheet strip animation
          const sheetSrc = poseData.sheet || (typeof poseData === "string" ? poseData : null);
          if (!sheetSrc) return;
          const sheetImg = await this.preloadImage(sheetSrc);
          if (!isHovering || !sheetImg) return;

          const fw = poseData.frameWidth || poseData.frameHeight || 128;
          const fh = poseData.frameHeight || 128;

          animTimer = setInterval(() => {
            currentFrameIdx = (currentFrameIdx + 1) % frameCount;
            const sx = currentFrameIdx * fw;
            ctx.clearRect(0, 0, 128, 128);
            ctx.drawImage(sheetImg, sx, 0, fw, fh, 0, 0, 128, 128);
          }, 100); // 10 FPS
        }
      };

      card.addEventListener("mouseenter", () => {
        startAnimation();
      });

      card.addEventListener("mouseleave", () => {
        stopAnimation();
      });

      this.activeAnimators.push(stopAnimation);

      // Click to select pose
      card.addEventListener("click", () => {
        this.selectPose(item, poseName, poseData);
      });

      this.gridEl.appendChild(card);
    });
  },

  selectPose(item, poseName, poseData) {
    if (!item) return;

    item.currentPose = poseName;
    item.poseData = poseData;
    this.preparePoseAssetsForCanvas(item, poseData);

    // Update image src to the preview single frame of the chosen pose
    const newSrc = poseData.preview || (typeof poseData === "string" ? poseData : (poseData.frames && poseData.frames[0]) || poseData.sheet);
    if (newSrc) {
      item.src = newSrc;
      WorldObjectsManager.loadImageAsset(newSrc, (cacheEntry) => {
        if (cacheEntry.loaded && cacheEntry.img) {
          item.p5Img = cacheEntry.img;
          item.loaded = true;
          
          const oldNatH = item.naturalH || item.h || 70;
          const currentScale = (oldNatH > 0 && item.h > 0) ? (item.h / oldNatH) : 1.5;

          item.naturalW = cacheEntry.naturalW;
          item.naturalH = cacheEntry.naturalH;

          // Preserve exact character pixel scale and keep feet grounded at the bottom
          const newH = Math.max(20, Math.round(cacheEntry.naturalH * currentScale));
          const newW = Math.max(20, Math.round(cacheEntry.naturalW * currentScale));
          
          const oldBottomY = item.y + item.h;
          item.y = oldBottomY - newH;
          item.w = newW;
          item.h = newH;

          if (!item.crop || !item.crop.isCropped) {
            item.crop = { x: 0, y: 0, w: cacheEntry.naturalW, h: cacheEntry.naturalH, isCropped: false };
          }
        }
      });
    }

    // Update active class on cards
    if (this.gridEl) {
      this.gridEl.querySelectorAll(".pose-card").forEach(c => {
        c.classList.toggle("active", c.getAttribute("data-pose-name") === poseName);
      });
    }

    WorldObjectsManager.saveHistory();
    if (typeof PropertiesController !== "undefined") {
      PropertiesController.updateFromSelected(item);
    }

    SoundEngine.playChiptuneTone(640, "square", 0.05, 0.1);
  }
};

// ============================================================================
// 7. WORLD OBJECTS & INTERACTIVE TRANSFORM GIZMO SYSTEM
// ============================================================================