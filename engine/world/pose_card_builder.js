/**
 * UNIFIVE World - Pose Card Builder Subsystem
 */
(function (global) {
  'use strict';

  const PoseCardBuilder = {
    buildCard(poseName, poseData, isActive, item, onSelect) {
      const card = document.createElement("div");
      card.className = "pose-card" + (isActive ? " active" : "");
      card.setAttribute("data-pose-name", poseName);
      card.innerHTML = '<span class="pose-name-label">' + poseName + '</span>';
      card.addEventListener("click", () => {
        if (typeof onSelect === "function") onSelect(poseName, poseData);
      });
      return card;
    }
  };

  global.PoseCardBuilder = PoseCardBuilder;
})(typeof window !== 'undefined' ? window : globalThis);
