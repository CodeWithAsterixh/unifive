/**
 * UNIFIVE Scripting - Visual Code Runtime Engine
 * Manages thread scheduler, execution loops, and delegates builtins/events/evaluators.
 */
const CodeRuntimeEngine = {
  isRunning: false,
  activeThreads: [],

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  init() {
    const btnRun = document.getElementById("btn-code-run");
    if (btnRun) {
      btnRun.addEventListener("click", () => this.toggleRun());
    }

    // Spacebar listener for 'when [space] key pressed'
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.contentEditable === "true") return;
      if (this.isRunning) {
        const keyName = e.code === "Space" ? "space" : e.key.toLowerCase();
        this.triggerEvent("when_key", keyName);
      }
    });
  },

  toggleRun() {
    if (this.isRunning) {
      this.stopAll();
    } else {
      this.start("when_flag");
    }
  },

  start(trigger = "when_flag", arg = null) {
    this.isRunning = true;
    this.updateRunButtonUI(true);

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(523, "square", 0.08, 0.12);
      setTimeout(() => SoundEngine.playChiptuneTone(659, "square", 0.08, 0.12), 60);
      setTimeout(() => SoundEngine.playChiptuneTone(784, "square", 0.12, 0.15), 120);
    }

    this.triggerEvent(trigger, arg);
  },

  stopAll() {
    this.isRunning = false;
    this.activeThreads = [];
    this.updateRunButtonUI(false);

    document.querySelectorAll(".code-block-item.executing-halo").forEach(el => {
      el.classList.remove("executing-halo");
    });

    if (typeof WorldObjectsManager !== "undefined" && WorldObjectsManager.items) {
      WorldObjectsManager.items.forEach(it => {
        if (it.speechBubble) delete it.speechBubble;
      });
    }

    if (typeof SoundEngine !== "undefined") {
      SoundEngine.playChiptuneTone(330, "square", 0.08, 0.12);
      setTimeout(() => SoundEngine.playChiptuneTone(220, "square", 0.12, 0.12), 70);
    }
  },

  updateRunButtonUI(running) {
    const btnRun = document.getElementById("btn-code-run");
    if (!btnRun) return;
    if (running) {
      btnRun.classList.remove("btn-run");
      btnRun.classList.add("btn-stop");
      btnRun.innerHTML = '<i class="ph ph-stop-fill"></i><span>STOP</span>';
    } else {
      btnRun.classList.remove("btn-stop");
      btnRun.classList.add("btn-run");
      btnRun.innerHTML = '<i class="ph ph-play-fill"></i><span>RUN</span>';
    }
  },

  triggerEvent(triggerType, eventArg = null, specificTargetId = null) {
    return RuntimeEvents.triggerEvent(this, triggerType, eventArg, specificTargetId);
  },

  isEventHatMatch(block, triggerType, eventArg) {
    return RuntimeEvents.isEventHatMatch(block, triggerType, eventArg);
  },

  runBlockImmediately(block, targetId = null) {
    return RuntimeEvents.runBlockImmediately(this, block, targetId);
  },

  broadcast(messageName) {
    return RuntimeEvents.broadcast(this, messageName);
  },

  launchThread(rootBlock, targetItem, targetId) {
    const thread = this.runScriptThread(rootBlock, targetItem, targetId);
    this.activeThreads.push(thread);
    thread.finally(() => {
      const idx = this.activeThreads.indexOf(thread);
      if (idx >= 0) this.activeThreads.splice(idx, 1);
    });
  },

  async runScriptThread(rootBlock, targetItem, targetId) {
    let curr = rootBlock;
    const scripts = (typeof AppModeController !== "undefined" && AppModeController.objectScripts)
      ? (AppModeController.objectScripts[targetId] || AppModeController.getCurrentScripts())
      : [];

    while (curr && this.isRunning) {
      const nextId = curr.nextId;
      await this.executeBlock(curr, targetItem);
      if (!this.isRunning) break;

      if (nextId) {
        curr = scripts.find(b => b.id === nextId) || null;
      } else {
        curr = null;
      }
    }
  },

  async executeBlock(block, targetItem) {
    return RuntimeBuiltins.executeBlock(this, block, targetItem);
  },

  getBlockInput(block, index = 0) {
    return RuntimeEvaluator.getBlockInput(block, index);
  },

  evalBlockInput(block, index, targetItem, fallback = "") {
    return RuntimeEvaluator.evalBlockInput(block, index, targetItem, fallback);
  },

  checkOverlap(a, b) {
    return RuntimeEvaluator.checkOverlap(a, b);
  },

  evaluateCondition(conditionStr, targetItem) {
    return RuntimeEvaluator.evaluateCondition(conditionStr, targetItem);
  },

  evaluateConditionBlock(condBlock, targetItem) {
    return RuntimeEvaluator.evaluateConditionBlock(condBlock, targetItem);
  },

  evaluateReporterBlock(repBlock, targetItem) {
    return RuntimeEvaluator.evaluateReporterBlock(repBlock, targetItem);
  },

  resolveValue(identifier, targetItem) {
    return RuntimeEvaluator.resolveValue(identifier, targetItem);
  }
};