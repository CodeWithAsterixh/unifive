/**
 * UNIFIVE Landing Page - Sticky Multi-Chapter Animation Engine
 * Adapted directly from WorldLoadingScreen.tsx architecture:
 * - 700vh scroll track with pinned 100dvh sticky viewport
 * - Butter-smooth physics spring interpolation (LERP)
 * - 7 distinct cross-fading & 3D tilting chapter layers
 * - Chapter navigation dots with live progress tracking & smooth click-to-jump
 * - Frame-by-frame animated sprite sheet cycler with hover amplifications
 * - Web Audio 8-bit retro sound effects synthesizer
 */

document.addEventListener("DOMContentLoaded", () => {
  // ========================================================================
  // 1. WEB AUDIO 8-BIT SOUND SYNTHESIZER (from WorldLoadingScreen.tsx)
  // ========================================================================
  let isSoundOn = false;
  let audioCtx = null;

  const getAudioContext = () => {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  };

  const playRetroSound = (type) => {
    if (!isSoundOn) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "fanfare") {
        [261.63, 329.63, 392.0, 523.25].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.06 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.06);
          osc.stop(ctx.currentTime + idx * 0.06 + 0.35);
        });
      }
    } catch (e) {}
  };



  // ========================================================================
  // 3. STICKY MULTI-CHAPTER SCROLL ENGINE (WorldLoadingScreen Architecture)
  // ========================================================================
  const progressBar = document.getElementById("scroll-progress-bar");
  const chapterDots = document.querySelectorAll(".chapter-dot");
  const navLinkBtns = document.querySelectorAll(".nav-link-btn");
  const scrollHint = document.getElementById("scroll-hint");

  // Chapter layers definitions: 7 continuous chapters across [0.0, 1.0]
  const chapters = [
    { id: "chapter-0", el: document.getElementById("chapter-0"), range: [0.00, 0.00, 0.11, 0.15], center: 0.05 },
    { id: "chapter-1", el: document.getElementById("chapter-1"), range: [0.12, 0.16, 0.25, 0.29], center: 0.20 },
    { id: "chapter-2", el: document.getElementById("chapter-2"), range: [0.26, 0.30, 0.39, 0.43], center: 0.34 },
    { id: "chapter-3", el: document.getElementById("chapter-3"), range: [0.40, 0.44, 0.53, 0.57], center: 0.48 },
    { id: "chapter-4", el: document.getElementById("chapter-4"), range: [0.54, 0.58, 0.67, 0.71], center: 0.62 },
    { id: "chapter-5", el: document.getElementById("chapter-5"), range: [0.68, 0.72, 0.81, 0.85], center: 0.76 },
    { id: "chapter-6", el: document.getElementById("chapter-6"), range: [0.82, 0.87, 1.00, 1.00], center: 0.93 },
  ];

  // Physics Spring Interpolation State
  let targetProgress = 0;
  let smoothProgress = 0;
  let activeChapterIdx = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  // Update target progress from window scroll
  const onScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    targetProgress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  // Helper to jump to a specific chapter smoothly
  const jumpToChapter = (chapterIdx) => {
    const ch = chapters[chapterIdx];
    if (!ch) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: ch.center * maxScroll,
      behavior: "smooth",
    });
    playRetroSound("click");
  };

  // Attach click listeners to all chapter navigation buttons
  document.querySelectorAll("[data-target-chapter]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const targetIdx = parseInt(btn.getAttribute("data-target-chapter"), 10);
      if (!isNaN(targetIdx)) {
        jumpToChapter(targetIdx);
      }
    });
  });

  // Main Render Animation Loop (Runs on requestAnimationFrame for butter-smooth feel)
  const renderFrame = () => {
    // Physics LERP spring interpolation
    smoothProgress = lerp(smoothProgress, targetProgress, 0.08);

    // 1. Update Top Progress Bar
    if (progressBar) {
      progressBar.style.transform = `scaleX(${smoothProgress})`;
      progressBar.setAttribute("aria-valuenow", Math.round(smoothProgress * 100));
    }

    // 2. Compute Transitions for each Chapter Layer
    let currentActiveIdx = 0;

    chapters.forEach((ch, idx) => {
      const el = ch.el;
      if (!el) return;

      const [start, enterDone, exitStart, exitEnd] = ch.range;

      if (smoothProgress < start || smoothProgress > exitEnd) {
        // Outside chapter window
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.style.visibility = "hidden";
        el.classList.remove("active");
      } else {
        el.style.visibility = "visible";
        let opacity = 1;
        let translateY = 0;
        let rotateX = 0;
        let scale = 1;

        // Entrance phase (start -> enterDone)
        if (smoothProgress <= enterDone) {
          const ratio = enterDone > start ? (smoothProgress - start) / (enterDone - start) : 1;
          opacity = clamp(ratio, 0, 1);
          translateY = (1 - ratio) * 28;
          rotateX = (1 - ratio) * -10;
          scale = 0.94 + ratio * 0.06;
          el.style.pointerEvents = ratio > 0.5 ? "auto" : "none";
        }
        // Dwell phase (enterDone -> exitStart)
        else if (smoothProgress < exitStart) {
          opacity = 1;
          translateY = 0;
          rotateX = 0;
          scale = 1;
          el.style.pointerEvents = "auto";
          currentActiveIdx = idx;
        }
        // Exit phase (exitStart -> exitEnd)
        else {
          const ratio = exitEnd > exitStart ? (smoothProgress - exitStart) / (exitEnd - exitStart) : 1;
          opacity = clamp(1 - ratio, 0, 1);
          translateY = ratio * -24;
          rotateX = ratio * 12;
          scale = 1 - ratio * 0.08;
          el.style.pointerEvents = ratio < 0.5 ? "auto" : "none";
          if (ratio < 0.5) currentActiveIdx = idx;
        }

        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `perspective(1200px) translateY(${translateY.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.classList.add("active");
      }
    });

    // 3. Sync Active Chapter Dots & Nav Links
    if (currentActiveIdx !== activeChapterIdx) {
      activeChapterIdx = currentActiveIdx;

      chapterDots.forEach((dot, dIdx) => {
        if (dIdx === activeChapterIdx) {
          dot.classList.add("active");
          dot.setAttribute("aria-selected", "true");
        } else {
          dot.classList.remove("active");
          dot.setAttribute("aria-selected", "false");
        }
      });

      navLinkBtns.forEach((btn) => {
        const tIdx = parseInt(btn.getAttribute("data-target-chapter"), 10);
        if (tIdx === activeChapterIdx) {
          btn.classList.add("active");
          btn.setAttribute("aria-current", "step");
        } else {
          btn.classList.remove("active");
          btn.removeAttribute("aria-current");
        }
      });
    }

    // 4. Scroll Hint Visibility
    if (scrollHint) {
      scrollHint.style.opacity = smoothProgress < 0.06 ? (1 - smoothProgress / 0.06).toFixed(2) : "0";
    }

    requestAnimationFrame(renderFrame);
  };

  // Start Animation Loop
  requestAnimationFrame(renderFrame);

  // ========================================================================
  // 4. BUY ME A COFFEE MODAL & DYNAMIC PAYPAL CHECKOUT ENGINE
  // ========================================================================
  const coffeeModal = document.getElementById("modal-coffee");
  const closeCoffeeBtn = document.getElementById("btn-close-coffee");
  const coffeePresets = document.querySelectorAll(".coffee-preset");
  const customAmountInput = document.getElementById("coffee-custom-amount");
  const paypalBtn = document.getElementById("btn-paypal-checkout");
  const paypalBtnLabel = document.getElementById("paypal-btn-label");

  const openCoffeeModal = () => {
    if (!coffeeModal) return;
    coffeeModal.removeAttribute("hidden");
    playRetroSound("click");
    if (customAmountInput) {
      customAmountInput.focus();
    }
  };

  const closeCoffeeModal = () => {
    if (!coffeeModal) return;
    coffeeModal.setAttribute("hidden", "true");
    playRetroSound("click");
  };

  // Attach open triggers to all Buy Me a Coffee buttons
  document.querySelectorAll(".btn-open-coffee").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openCoffeeModal();
    });
  });

  if (closeCoffeeBtn) {
    closeCoffeeBtn.addEventListener("click", closeCoffeeModal);
  }

  if (coffeeModal) {
    coffeeModal.addEventListener("click", (e) => {
      if (e.target === coffeeModal) {
        closeCoffeeModal();
      }
    });
  }

  // Handle Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && coffeeModal && !coffeeModal.hasAttribute("hidden")) {
      closeCoffeeModal();
    }
  });

  // Dynamic PayPal URL & Label Generator
  const updatePayPalUrl = (amount) => {
    const parsed = Math.max(1, parseFloat(amount) || 3);
    const formatted = parsed.toFixed(2);
    
    // Standard PayPal donation link with custom amount & item name
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=peterpauleyinnaya%40gmail.com&currency_code=USD&amount=${parsed}&item_name=Support+UNIFIVE+Pixel+Game+Studio`;
    
    if (paypalBtn) {
      paypalBtn.href = paypalUrl;
      paypalBtn.setAttribute("aria-label", `Proceed to PayPal checkout for $${formatted}`);
    }
    if (paypalBtnLabel) {
      paypalBtnLabel.textContent = `CONTINUE TO PAYPAL ($${formatted})`;
    }
  };

  // Preset chips click listeners
  coffeePresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const amount = preset.getAttribute("data-amount");
      
      coffeePresets.forEach((p) => {
        p.classList.remove("active");
        p.setAttribute("aria-checked", "false");
      });
      preset.classList.add("active");
      preset.setAttribute("aria-checked", "true");

      if (customAmountInput) {
        customAmountInput.value = amount;
      }

      updatePayPalUrl(amount);
      playRetroSound("click");
    });
  });

  // Custom amount numeric input listener
  if (customAmountInput) {
    customAmountInput.addEventListener("input", () => {
      const val = customAmountInput.value;
      
      // Match active preset or clear active
      let matched = false;
      coffeePresets.forEach((p) => {
        if (p.getAttribute("data-amount") === val) {
          p.classList.add("active");
          p.setAttribute("aria-checked", "true");
          matched = true;
        } else {
          p.classList.remove("active");
          p.setAttribute("aria-checked", "false");
        }
      });

      updatePayPalUrl(val);
    });
  }

  // Initialize with default amount
  updatePayPalUrl(3);

  // ========================================================================
  // 6. MOBILE SIDEBAR DRAWER CONTROLLER
  // ========================================================================
  const mobileMenuToggleBtn = document.getElementById("btn-mobile-menu-toggle");
  const mobileSidebarDrawer = document.getElementById("mobile-sidebar-drawer");
  const mobileSidebarBackdrop = document.getElementById("mobile-sidebar-backdrop");
  const mobileSidebarCloseBtn = document.getElementById("btn-close-sidebar");

  const openMobileSidebar = () => {
    if (!mobileSidebarDrawer) return;
    if (mobileSidebarBackdrop) mobileSidebarBackdrop.removeAttribute("hidden");
    mobileSidebarDrawer.removeAttribute("hidden");
    if (mobileMenuToggleBtn) {
      mobileMenuToggleBtn.setAttribute("aria-expanded", "true");
    }
    playRetroSound("click");
  };

  const closeMobileSidebar = () => {
    if (!mobileSidebarDrawer) return;
    if (mobileSidebarBackdrop) mobileSidebarBackdrop.setAttribute("hidden", "true");
    mobileSidebarDrawer.setAttribute("hidden", "true");
    if (mobileMenuToggleBtn) {
      mobileMenuToggleBtn.setAttribute("aria-expanded", "false");
    }
    playRetroSound("click");
  };

  if (mobileMenuToggleBtn) {
    mobileMenuToggleBtn.addEventListener("click", openMobileSidebar);
  }
  if (mobileSidebarCloseBtn) {
    mobileSidebarCloseBtn.addEventListener("click", closeMobileSidebar);
  }
  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener("click", closeMobileSidebar);
  }

  // Auto-close sidebar on mobile chapter jump clicks
  document.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileSidebar();
    });
  });

  // Global Escape key handler for both coffee modal and mobile drawer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (coffeeModal && !coffeeModal.hasAttribute("hidden")) {
        closeCoffeeModal();
      }
      if (mobileSidebarDrawer && !mobileSidebarDrawer.hasAttribute("hidden")) {
        closeMobileSidebar();
      }
    }
  });
});



