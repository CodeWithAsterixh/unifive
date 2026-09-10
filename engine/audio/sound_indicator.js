/**
 * UNIFIVE Engine - Sound Indicator Subsystem
 */
const SoundIndicator = {
  update(enabled = typeof SoundEngine !== "undefined" ? SoundEngine.enabled : true) {
    const btn = document.getElementById("btn-sound");
    const icon = document.getElementById("sound-icon");
    const label = document.getElementById("sound-label");
    if (enabled) {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-speaker-high";
      if (label) label.textContent = "AUDIO: ON";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-speaker-slash";
      if (label) label.textContent = "AUDIO: OFF";
    }
  }
};
