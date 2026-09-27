/**
 * UNIFIVE World - Pose Cards & Selector Subsystem
 */
(function (global) {
  'use strict';

  const PoseCards = {
    renderPoseCards(controller, item, poses) {
      if (!controller || !controller.gridEl) return;
      if (typeof PoseAnimator !== "undefined") PoseAnimator.stopAllAnimators();
      controller.gridEl.innerHTML = "";

      const currentPoseName = item.currentPose || item.defaultPose || Object.keys(poses)[0];

      const entries = Object.entries(poses);
      for (const [poseName, poseData] of entries) {
        const isActive = (currentPoseName === poseName) || (currentPoseName.toLowerCase() === poseName.toLowerCase());
        if (typeof PoseCardBuilder !== "undefined") {
          const card = PoseCardBuilder.buildCard(poseName, poseData, isActive, item, (pName, pData) => {
            this.selectPose(controller, item, pName, pData);
          });
          controller.gridEl.appendChild(card);
        }
      }
    },

    selectPose(controller, item, poseName, poseData) {
      if (!item) return;

      if (typeof PoseAnimator !== "undefined") {
        PoseAnimator.setPose(item, poseName, poseData);
      } else {
        item.currentPose = poseName;
        item.poseData = poseData;
      }

      if (controller && controller.gridEl) {
        const allCards = controller.gridEl.querySelectorAll(".pose-card");
        for (const c of allCards) {
          c.classList.toggle("active", c.getAttribute("data-pose-name") === poseName);
        }
      }

      if (typeof WorldObjectsManager !== "undefined" && typeof WorldObjectsManager.saveHistory === "function") {
        WorldObjectsManager.saveHistory();
      }
      if (typeof PropertiesController !== "undefined") {
        PropertiesController.updateFromSelected(item);
      }
      if (typeof SoundEngine !== "undefined") {
        SoundEngine.playChiptuneTone(640, "square", 0.05, 0.1);
      }
    }
  };

  global.PoseCards = PoseCards;
})(typeof window !== 'undefined' ? window : globalThis);
