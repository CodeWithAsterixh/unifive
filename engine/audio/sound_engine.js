const SoundEngine = {
  enabled: true,
  audioCtx: null,

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  },

  playChiptuneTone(freq, type = "square", duration = 0.08, volume = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("8-Bit Audio error:", e);
    }
  },

  playAction(action) {
    switch (action) {
      case "undo":
        this.playChiptuneTone(320, "square", 0.07, 0.12);
        setTimeout(() => this.playChiptuneTone(240, "square", 0.09, 0.12), 60);
        break;
      case "redo":
        this.playChiptuneTone(260, "square", 0.07, 0.12);
        setTimeout(() => this.playChiptuneTone(390, "square", 0.09, 0.12), 60);
        break;
      case "save":
        this.playChiptuneTone(523.25, "square", 0.08, 0.12);
        setTimeout(() => this.playChiptuneTone(659.25, "square", 0.08, 0.12), 70);
        setTimeout(() => this.playChiptuneTone(783.99, "square", 0.08, 0.12), 140);
        setTimeout(() => this.playChiptuneTone(1046.50, "square", 0.18, 0.15), 210);
        break;
      case "toggle_on":
        this.playChiptuneTone(440, "square", 0.06, 0.1);
        setTimeout(() => this.playChiptuneTone(880, "square", 0.1, 0.12), 60);
        break;
      case "toggle_off":
        this.playChiptuneTone(600, "square", 0.06, 0.1);
        setTimeout(() => this.playChiptuneTone(300, "square", 0.1, 0.1), 60);
        break;
      default:
        this.playChiptuneTone(440, "square", 0.08, 0.1);
    }
  },

  playSoundEffect(name) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const t = this.audioCtx.currentTime;
      switch (name) {
        case "jump": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.18);
          break;
        }
        case "laser": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(1200, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.15);
          break;
        }
        case "coin": {
          this.playChiptuneTone(987.77, "triangle", 0.08, 0.15);
          setTimeout(() => this.playChiptuneTone(1318.51, "triangle", 0.2, 0.15), 70);
          break;
        }
        case "hit": {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
          break;
        }
        case "powerup": {
          const notes = [330, 392, 494, 659];
          notes.forEach((freq, idx) => {
            setTimeout(() => this.playChiptuneTone(freq, "square", 0.07, 0.12), idx * 60);
          });
          break;
        }
        default:
          this.playChiptuneTone(440, "square", 0.08, 0.1);
      }
    } catch (e) {
      console.warn("Sound effect error:", e);
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById("btn-sound");
    const icon = document.getElementById("sound-icon");
    const label = document.getElementById("sound-label");

    if (this.enabled) {
      this.playAction("toggle_on");
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "ph ph-speaker-high";
      if (label) label.textContent = "AUDIO: ON";
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "ph ph-speaker-slash";
      if (label) label.textContent = "AUDIO: OFF";
    }
    return this.enabled;
  }
};

// ============================================================================
// 4. VIEW PERSPECTIVE CONTROLLER (Top-Down vs Side-Facing)
// ============================================================================