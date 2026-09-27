/**
 * UNIFIVE Engine - Player Physics & Collision Subsystem
 * Supports customizable Speed, Velocity, Weight/Mass, Jump Force, Gravity, and Friction dynamics.
 */
const PlayerPhysics = {
  getSolidObstacleCollision(boxX, boxY, boxW, boxH, ignoreId = null) {
    if (typeof WorldObjectsManager === "undefined" || !WorldObjectsManager.items) return null;
    const items = WorldObjectsManager.items;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.id === ignoreId || !it.isSolid || it.hidden || it.hiddenInPlayer) continue;

      const fullW = it.w || 40;
      const fullH = it.h || 40;
      const isCharacter = it.type === "sprite" || (it.assetId && it.assetId.startsWith("sprite_")) || it.poses || it.isPlayable;

      // Centered, tight base hitbox for sprites/characters so players can walk close to NPCs
      const obsBoxW = isCharacter ? Math.max(10, fullW * 0.28) : Math.max(16, fullW * 0.65);
      const obsBoxH = isCharacter ? Math.max(8, fullH * 0.2) : Math.max(12, fullH * 0.35);
      const obsX = it.x + (fullW - obsBoxW) / 2;
      const obsY = it.y + fullH - obsBoxH;

      if (boxX < obsX + obsBoxW && boxX + boxW > obsX && boxY < obsY + obsBoxH && boxY + boxH > obsY) {
        return {
          item: it,
          x: obsX,
          y: obsY,
          w: obsBoxW,
          h: obsBoxH,
          centerX: obsX + obsBoxW / 2,
          centerY: obsY + obsBoxH / 2
        };
      }
    }
    return null;
  },

  applyMovementWithCollision(engine, hero, dx, dy) {
    const autoGoAround = (typeof WorldConfig !== "undefined" && WorldConfig.autoGoAround !== false);
    const speed = hero.speed || engine.playerSpeed || 6.5;
    const heroFullW = hero.w || 40;
    const heroFullH = hero.h || 40;
    const heroW = Math.max(10, heroFullW * 0.28);
    const heroH = Math.max(8, heroFullH * 0.2);
    const getFootX = (hx) => hx + (heroFullW - heroW) / 2;
    const getFootY = (hy) => hy + heroFullH - heroH;

    let movedX = 0;
    let movedY = 0;

    // 1. Move X axis
    if (dx !== 0) {
      const nextFootX = getFootX(hero.x + dx);
      const currFootY = getFootY(hero.y);
      const colX = this.getSolidObstacleCollision(nextFootX, currFootY, heroW, heroH, hero.id);
      if (!colX) {
        hero.x += dx;
        movedX = dx;
      } else {
        if (autoGoAround && dy === 0) {
          const nudgeY = (currFootY + heroH / 2 < colX.centerY ? -1 : 1) * speed * 0.8;
          if (!this.getSolidObstacleCollision(getFootX(hero.x), currFootY + nudgeY, heroW, heroH, hero.id)) {
            hero.y += nudgeY;
          }
        }
      }
    }

    // 2. Move Y axis
    if (dy !== 0) {
      const currFootX = getFootX(hero.x);
      const nextFootY = getFootY(hero.y + dy);
      const colY = this.getSolidObstacleCollision(currFootX, nextFootY, heroW, heroH, hero.id);
      if (!colY) {
        hero.y += dy;
        movedY = dy;
      } else {
        if (autoGoAround && dx === 0) {
          const nudgeX = (currFootX + heroW / 2 < colY.centerX ? -1 : 1) * speed * 0.8;
          if (!this.getSolidObstacleCollision(currFootX + nudgeX, getFootY(hero.y), heroH, hero.id)) {
            hero.x += nudgeX;
          }
        }
      }
    }

    return { movedX, movedY };
  },

  updateMovement(engine) {
    if (!engine.activePlayableItem || !engine.isControlEnabled) return;
    const hero = engine.activePlayableItem;
    const view = (typeof ViewController !== "undefined" && ViewController.currentView) ? ViewController.currentView : "sidefacing";

    // Extract Character Physics Units (with smart fallbacks)
    const baseSpeed = (hero.speed !== undefined ? hero.speed : (engine.playerSpeed || 6.5));
    const weight = Math.max(0.1, (hero.weight !== undefined ? hero.weight : 1.0));
    const jumpForce = Math.max(0, (hero.jumpForce !== undefined ? hero.jumpForce : 12.0));
    const gravity = Math.max(0, (hero.gravity !== undefined ? hero.gravity : 0.65));
    const friction = Math.max(0.1, Math.min(0.98, (hero.friction !== undefined ? hero.friction : 0.82)));

    // Initialize runtime velocities if not set
    if (hero.vx === undefined) hero.vx = 0;
    if (hero.vy === undefined) hero.vy = 0;

    const moveLeft = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("left");
    const moveRight = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("right");
    const moveUp = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("up");
    const moveDown = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("down");
    const isAttacking = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("attack");
    const isJumping = typeof PlayerInputManager !== "undefined" && PlayerInputManager.isActionActive("jump");

    // Inertia & responsiveness scale based on character weight
    const responsiveness = Math.max(0.15, Math.min(0.95, (1.0 - friction) / Math.sqrt(weight)));

    if (view === "topdown") {
      let targetVx = 0;
      let targetVy = 0;

      if (moveLeft) targetVx -= baseSpeed;
      if (moveRight) targetVx += baseSpeed;
      if (moveUp) targetVy -= baseSpeed;
      if (moveDown) targetVy += baseSpeed;

      if (targetVx !== 0 && targetVy !== 0) {
        targetVx *= 0.7071;
        targetVy *= 0.7071;
      }

      // Smooth velocity interpolation with inertia
      hero.vx = hero.vx * (1 - responsiveness) + targetVx * responsiveness;
      hero.vy = hero.vy * (1 - responsiveness) + targetVy * responsiveness;

      if (Math.abs(hero.vx) < 0.05) hero.vx = 0;
      if (Math.abs(hero.vy) < 0.05) hero.vy = 0;

      this.applyMovementWithCollision(engine, hero, hero.vx, hero.vy);

      if (typeof PoseAnimator !== "undefined") {
        if (isAttacking) {
          PoseAnimator.setPose(hero, "Attack");
        } else if (hero.vx < -0.3) {
          hero.flipH = true;
          PoseAnimator.setPose(hero, "Walk Left");
        } else if (hero.vx > 0.3) {
          hero.flipH = false;
          PoseAnimator.setPose(hero, "Walk Right");
        } else if (hero.vy < -0.3) {
          PoseAnimator.setPose(hero, "Walk Back");
        } else if (hero.vy > 0.3) {
          PoseAnimator.setPose(hero, "Walk Front");
        } else {
          if (hero.currentPose && hero.currentPose.startsWith("Walk")) {
            PoseAnimator.setPose(hero, hero.currentPose.replace("Walk", "Idle"));
          } else if (!hero.currentPose || !hero.currentPose.startsWith("Idle")) {
            PoseAnimator.setPose(hero, "Idle");
          }
        }
      }
    } else {
      // Side-facing mode
      let targetVx = 0;
      if (moveLeft) {
        targetVx -= baseSpeed;
        hero.flipH = true;
      } else if (moveRight) {
        targetVx += baseSpeed;
        hero.flipH = false;
      }

      // Accelerate/Decelerate X velocity
      hero.vx = hero.vx * (1 - responsiveness) + targetVx * responsiveness;
      if (Math.abs(hero.vx) < 0.05) hero.vx = 0;

      // Vertical Up / Down movement (or Jump)
      let targetVy = 0;
      if (moveUp) {
        targetVy -= baseSpeed * 0.75;
      } else if (moveDown) {
        targetVy += baseSpeed * 0.75;
      }

      hero.vy = hero.vy * (1 - responsiveness) + targetVy * responsiveness;
      if (Math.abs(hero.vy) < 0.05) hero.vy = 0;

      this.applyMovementWithCollision(engine, hero, hero.vx, hero.vy);

      if (typeof PoseAnimator !== "undefined") {
        if (isAttacking) {
          PoseAnimator.setPose(hero, "Attack 1");
        } else if (isJumping) {
          PoseAnimator.setPose(hero, "Jump");
        } else if (Math.abs(hero.vx) > 0.2 || Math.abs(hero.vy) > 0.2) {
          PoseAnimator.setPose(hero, "Walk");
        } else {
          if (hero.currentPose !== "Idle" && hero.currentPose !== "Idle 2") {
            PoseAnimator.setPose(hero, "Idle");
          }
        }
      }
    }

    // Strict boundary clamping to prevent character from leaving world/screen
    const worldW = (typeof WorldConfig !== "undefined") ? WorldConfig.worldWidth : 2000;
    const worldH = (typeof WorldConfig !== "undefined") ? WorldConfig.worldHeight : 1500;
    const hw = hero.w || 40;
    const hh = hero.h || 40;
    hero.x = Math.max(0, Math.min(Math.max(0, worldW - hw), hero.x));
    hero.y = Math.max(0, Math.min(Math.max(0, worldH - hh), hero.y));
  }
};

if (typeof window !== "undefined") window.PlayerPhysics = PlayerPhysics;
if (typeof globalThis !== "undefined") globalThis.PlayerPhysics = PlayerPhysics;
