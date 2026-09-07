/**
 * UNIFIVE - Standalone Game Player Module
 * (C) 2026 UNIFIVE.P5 Game Studio
 * Aggregator coordinating MobileControlsManager (mobile_controls.js), PlayerInputManager (player_input.js), and GamePlayerEngine (game_player_engine.js).
 */

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    if (typeof GamePlayerEngine !== "undefined") {
      GamePlayerEngine.init();
    }
  });
}
