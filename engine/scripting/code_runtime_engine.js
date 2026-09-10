/**
 * UNIFIVE Scripting - Visual Code Runtime Engine
 */
const CodeRuntimeEngine = {
  isRunning: false,
  activeThreads: [],

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  init() {
    document.addEventListener("click", this.handleClick);
  },

  handleClick(e) {
    if (e.target && e.target.closest("#btn-code-run")) CodeRuntimeEngine.toggleRun();
  },

  toggleRun() {
    if (this.isRunning) this.stopAll();
    else this.start("when_flag");
  },

  start(trigger = "when_flag", arg = null) {
    this.isRunning = true;
    this.updateRunButtonUI(true);
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(523, "square", 0.08, 0.15);
    if (typeof RuntimeEvents !== "undefined") RuntimeEvents.triggerEvent(this, trigger, arg);
  },

  triggerEvent(triggerType, eventArg = null, specificTargetId = null) {
    if (typeof RuntimeEvents !== "undefined") RuntimeEvents.triggerEvent(this, triggerType, eventArg, specificTargetId);
  },

  launchThread(startBlock, targetItem, targetId) {
    if (typeof RuntimeThreads === "undefined") return;
    const thread = RuntimeThreads.launchThread(this, startBlock, targetItem, targetId);
    this.activeThreads.push(thread);
    Promise.resolve(thread).finally(() => {
      const index = this.activeThreads.indexOf(thread);
      if (index >= 0) this.activeThreads.splice(index, 1);
    });
  },

  stopAll() {
    this.isRunning = false;
    this.activeThreads = [];
    this.updateRunButtonUI(false);
    document.querySelectorAll(".code-block-item.executing-halo").forEach(el => el.classList.remove("executing-halo"));
    if (typeof WorldObjectsManager !== "undefined") {
      WorldObjectsManager.items.forEach(item => { if (item.speechBubble) delete item.speechBubble; });
    }
    if (typeof SoundEngine !== "undefined") SoundEngine.playChiptuneTone(330, "square", 0.08, 0.12);
  },

  updateRunButtonUI(running) {
    const button = document.getElementById("btn-code-run");
    if (!button) return;
    button.classList.toggle("btn-run", !running);
    button.classList.toggle("btn-stop", running);
    button.innerHTML = running ? '<i class="ph ph-stop-fill"></i><span>STOP</span>' : '<i class="ph ph-play-fill"></i><span>RUN</span>';
  }
};
