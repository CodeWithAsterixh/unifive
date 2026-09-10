/**
 * UNIFIVE Engine - Player Physics & Collision Subsystem
 */
const PlayerPhysics = {
  getSolidObstacleCollision(boxX, boxY, boxW, boxH, ignoreId = null) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return null;
    const items = WorldObjectsManager.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.id === ignoreId || !it.isSolid || it.hidden || it.hiddenInPlayer) continue;
      const obsW = it.w || 40;
      const obsH = it.h || 40;
      const obsX = it.x;
      const obsY = it.y + obsH * 0.4;
      const obsBoxH = obsH * 0.6;
      if (boxX < obsX + obsW && boxX + boxW > obsX && boxY < obsY + obsBoxH && boxY + boxH > obsY) {
        return { item: it, x: obsX, y: obsY, w: obsW, h: obsBoxH, centerX: obsX + obsW / 2, centerY: obsY + obsBoxH / 2 };
      }
    }
    return null;
  },

  applyMovementWithCollision(engine, hero, dx, dy) {
    const autoGoAround = (typeof WorldConfig !== "undefined" && WorldConfig.autoGoAround !== false);
    const speed = engine.playerSpeed;
    const heroW = Math.max(14, (hero.w || 40) * 0.5);
    const heroH = Math.max(10, (hero.h || 40) * 0.3);
    const getFootX = (hx) => hx + ((hero.w || 40) - heroW) / 2;
    const getFootY = (hy) => hy + (hero.h || 40) - heroH;

    if (dx !== 0) {
      const nextFootX = getFootX(hero.x + dx);
      const currFootY = getFootY(hero.y);
      const colX = this.getSolidObstacleCollision(nextFootX, currFootY, heroW, heroH, hero.id);
      if (!colX) hero.x += dx;
      else if (autoGoAround && dy === 0) {
        const nudgeY = (currFootY + heroH / 2 < colX.centerY ? -1 : 1) * speed * 0.8;
        if (!this.getSolidObstacleCollision(getFootX(hero.x), currFootY + nudgeY, heroW, heroH, hero.id)) hero.y += nudgeY;
      }
    }

    if (dy !== 0) {
      const currFootX = getFootX(hero.x);
      const nextFootY = getFootY(hero.y + dy);
      const colY = this.getSolidObstacleCollision(currFootX, nextFootY, heroW, heroH, hero.id);
      if (!colY) hero.y += dy;
      else if (autoGoAround && dx === 0) {
        const nudgeX = (currFootX + heroW / 2 < colY.centerX ? -1 : 1) * speed * 0.8;
        if (!this.getSolidObstacleCollision(currFootX + nudgeX, getFootY(hero.y), heroW, heroH, hero.id)) hero.x += nudgeX;
      }
    }
  },

  updateMovement(engine) {
    if (!engine.activePlayableItem || !engine.isControlEnabled) return;
    const hero = engine.activePlayableItem;
    const view = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";
    const moveLeft = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("left");
    const moveRight = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("right");
    const moveUp = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("up");
    const moveDown = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("down");

    let dx = 0;
    let dy = 0;

    if (view === "topdown") {
      if (moveLeft) dx -= engine.playerSpeed;
      if (moveRight) dx += engine.playerSpeed;
      if (moveUp) dy -= engine.playerSpeed;
      if (moveDown) dy += engine.playerSpeed;
      if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
      this.applyMovementWithCollision(engine, hero, dx, dy);
      if (hero.poses) {
        if (dx < 0) hero.currentPose = "Walk Left";
        else if (dx > 0) hero.currentPose = "Walk Right";
        else if (dy < 0) hero.currentPose = "Walk Back";
        else if (dy > 0) hero.currentPose = "Walk Front";
        else if (hero.currentPose && hero.currentPose.startsWith("Walk")) hero.currentPose = hero.currentPose.replace("Walk", "Idle");
      }
    } else {
      if (moveLeft) {
        dx -= engine.playerSpeed;
        hero.flipH = true;
        if (hero.poses && (!hero.currentPose || hero.currentPose === "Idle" || hero.currentPose.startsWith("Walk"))) hero.currentPose = "Walk";
      } else if (moveRight) {
        dx += engine.playerSpeed;
        hero.flipH = false;
        if (hero.poses && (!hero.currentPose || hero.currentPose === "Idle" || hero.currentPose.startsWith("Walk"))) hero.currentPose = "Walk";
      } else if (hero.poses && hero.currentPose === "Walk") {
        hero.currentPose = "Idle";
      }
      if (moveUp) dy -= engine.playerSpeed * 0.75;
      else if (moveDown) dy += engine.playerSpeed * 0.75;
      this.applyMovementWithCollision(engine, hero, dx, dy);
    }

    const worldW = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth : 2000;
    const worldH = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight : 1500;
    const marginX = Math.min(16, (hero.w || 40) * 0.2);
    const marginY = Math.min(16, (hero.h || 40) * 0.2);
    hero.x = Math.max(marginX, Math.min(worldW - marginX, hero.x));
    hero.y = Math.max(marginY, Math.min(worldH - marginY, hero.y));
  }
};
