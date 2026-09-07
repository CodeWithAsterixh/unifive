/**
 * UNIFIVE Scripting - Block Connectors & Layout Engine
 * Calculates stack dimensions, magnetic snap coordinates, nested loop mouth heights, and hierarchy alignments.
 */
(function (global) {
  'use strict';

  const BlockConnectors = {
    getBlockElement(blockId) {
      if (!blockId) return null;
      const workspace = document.getElementById("code-workspace-blocks");
      if (workspace) {
        const el = workspace.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
        if (el) return el;
      }
      return document.querySelector(`.code-block-item[data-block-id="${blockId}"]`);
    },

    getBranchHeight(startBlockId, map) {
      if (!startBlockId || !map.has(startBlockId)) return 24;
      let totalH = 0;
      let currId = startBlockId;
      const visited = new Set();
      while (currId && map.has(currId) && !visited.has(currId)) {
        visited.add(currId);
        const b = map.get(currId);
        const bH = this.getFullBlockHeight(b, map);
        totalH += (totalH === 0 ? bH : (bH - 2));
        currId = b.nextId;
      }
      return Math.max(24, totalH);
    },

    getFullBlockHeight(block, map) {
      if (!block) return 34;
      if (block.c_block) {
        const headerH = 34;
        const bodyH = this.getBranchHeight(block.childId, map || new Map());
        const footerH = 14;
        return headerH + bodyH + footerH - 4;
      }
      if (block.e_block) {
        const headerH = 34;
        const ifBodyH = this.getBranchHeight(block.childId_if, map || new Map());
        const dividerH = 26;
        const elseBodyH = this.getBranchHeight(block.childId_else, map || new Map());
        const footerH = 14;
        return headerH + ifBodyH + dividerH + elseBodyH + footerH - 6;
      }
      if (block.hat) return 38;
      return 34;
    },

    getBlockDimensions(block) {
      if (!block) return { w: 140, h: 34 };
      const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
      const map = new Map(scripts.map(b => [b.id, b]));
      const h = this.getFullBlockHeight(block, map);
      const el = block.id ? this.getBlockElement(block.id) : null;
      if (el && el.offsetWidth > 0) {
        return { w: el.offsetWidth, h: h };
      }
      const len = (block.name || "").length;
      const estW = Math.max(140, Math.min(270, len * 9 + 40));
      return { w: estW, h: h };
    },

    getConnectedStack(rootBlock) {
      const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
      const map = new Map(scripts.map(b => [b.id, b]));
      const stack = [];
      const visited = new Set();

      const collect = (node) => {
        if (!node || visited.has(node.id)) return;
        visited.add(node.id);
        stack.push(node);

        // Collect inside C-block body
        if (node.c_block && node.childId && map.has(node.childId)) {
          collect(map.get(node.childId));
        }

        // Collect inside E-block branches
        if (node.e_block) {
          if (node.childId_if && map.has(node.childId_if)) {
            collect(map.get(node.childId_if));
          }
          if (node.childId_else && map.has(node.childId_else)) {
            collect(map.get(node.childId_else));
          }
        }

        // Collect downstream connected next block
        if (node.nextId && map.has(node.nextId)) {
          collect(map.get(node.nextId));
        }
      };

      collect(rootBlock);
      return stack;
    },

    findSnapTarget(draggedBlock, draggedX, draggedY, excludeIds = new Set(), ignoreTargetId = null) {
      const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
      if (!scripts || scripts.length === 0) return null;

      const map = new Map(scripts.map(b => [b.id, b]));
      const draggedDims = this.getBlockDimensions(draggedBlock);
      let bestTarget = null;
      let minDistance = 999999;

      const snapThresholdX = 65;
      const snapThresholdY = 32;

      for (let i = 0; i < scripts.length; i++) {
        const target = scripts[i];
        if (excludeIds.has(target.id)) continue;
        if (draggedBlock.id && target.id === draggedBlock.id) continue;

        const fullTargetH = this.getFullBlockHeight(target, map);

        if (ignoreTargetId && target.id === ignoreTargetId) {
          if (Math.hypot(draggedX - target.x, draggedY - target.y) < 55) {
            continue;
          }
        }

        // 1. SNAP INSIDE C-BLOCK MOUTH
        if (target.c_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
          if (!target.childId && draggedY < target.y + fullTargetH - 14) {
            const snapX = target.x + 16;
            const snapY = target.y + 32;
            const dx = Math.abs(draggedX - snapX);
            const dy = Math.abs(draggedY - snapY);

            if (dx <= 80 && dy <= 45) {
              const dist = dx + dy;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "inside",
                  snapX: snapX,
                  snapY: snapY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }
        }

        // 2. SNAP INSIDE DUAL-MOUTH E-BLOCK
        if (target.e_block && !draggedBlock.hat && !draggedBlock.isBoolean) {
          const ifBodyH = this.getBranchHeight(target.childId_if, map);
          
          if (!target.childId_if && draggedY < target.y + 30 + ifBodyH) {
            const snapIfX = target.x + 16;
            const snapIfY = target.y + 32;
            const dxIf = Math.abs(draggedX - snapIfX);
            const dyIf = Math.abs(draggedY - snapIfY);

            if (dxIf <= 80 && dyIf <= 45) {
              const dist = dxIf + dyIf;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "inside_if",
                  snapX: snapIfX,
                  snapY: snapIfY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }

          if (!target.childId_else && draggedY >= target.y + 30 + ifBodyH && draggedY < target.y + fullTargetH - 14) {
            const snapElseX = target.x + 16;
            const snapElseY = target.y + 54 + ifBodyH;
            const dxElse = Math.abs(draggedX - snapElseX);
            const dyElse = Math.abs(draggedY - snapElseY);

            if (dxElse <= 80 && dyElse <= 45) {
              const dist = dxElse + dyElse;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "inside_else",
                  snapX: snapElseX,
                  snapY: snapElseY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }
        }

        // 3. SNAP UNDERNEATH TARGET BLOCK
        if (!target.cap && !draggedBlock.hat && !draggedBlock.isBoolean) {
          const isMouthContainer = target.c_block || target.e_block;
          const isNearFooterOrRegular = !isMouthContainer || (draggedY >= target.y + fullTargetH - 26);

          if (isNearFooterOrRegular) {
            const snapX = target.x;
            const snapY = target.y + fullTargetH - 2;
            const dx = Math.abs(draggedX - snapX);
            const dy = Math.abs(draggedY - snapY);

            if (dx <= snapThresholdX && dy <= snapThresholdY) {
              const dist = dx + dy;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "bottom",
                  snapX: snapX,
                  snapY: snapY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          }
        }

        // 4. SNAP ABOVE TARGET BLOCK
        if (!target.hat && !draggedBlock.cap && !draggedBlock.isBoolean) {
          const snapX = target.x;
          const snapY = target.y - draggedDims.h + 2;
          const dx = Math.abs(draggedX - snapX);
          const dy = Math.abs(draggedY - snapY);

          if (dx <= snapThresholdX && dy <= snapThresholdY) {
            const dist = dx + dy;
            if (dist < minDistance) {
              minDistance = dist;
              bestTarget = {
                target: target,
                position: "top",
                snapX: snapX,
                snapY: snapY,
                snapW: draggedDims.w,
                snapH: draggedDims.h
              };
            }
          }
        }

        // 5. SNAP INTO CONDITION SOCKET
        const isDraggedBool = !!(draggedBlock.isBoolean || draggedBlock.boolean || draggedBlock.color === "#0284c7" || (draggedBlock.id && draggedBlock.id.startsWith("op_") && (draggedBlock.isBoolean || draggedBlock.opType)));
        if (isDraggedBool) {
          if (target.isConditionBlock || target.c_block || target.e_block) {
            const snapCondX = target.x + 36;
            const snapCondY = target.y + 2;
            const dxCond = Math.abs(draggedX - snapCondX);
            const dyCond = Math.abs(draggedY - snapCondY);

            if (dxCond <= 75 && dyCond <= 32) {
              const dist = dxCond + dyCond;
              if (dist < minDistance) {
                minDistance = dist;
                bestTarget = {
                  target: target,
                  position: "condition",
                  snapX: snapCondX,
                  snapY: snapCondY,
                  snapW: draggedDims.w,
                  snapH: draggedDims.h
                };
              }
            }
          } else if (target.isLogical) {
            if (target.opType === "not") {
              const snapCondX = target.x + 38;
              const snapCondY = target.y + 2;
              const dxCond = Math.abs(draggedX - snapCondX);
              const dyCond = Math.abs(draggedY - snapCondY);

              if (dxCond <= 60 && dyCond <= 32) {
                const dist = dxCond + dyCond;
                if (dist < minDistance) {
                  minDistance = dist;
                  bestTarget = {
                    target: target,
                    position: "condition",
                    snapX: snapCondX,
                    snapY: snapCondY,
                    snapW: draggedDims.w,
                    snapH: draggedDims.h
                  };
                }
              }
            } else {
              const snapLeftX = target.x + 10;
              const snapLeftY = target.y + 2;
              const dxLeft = Math.abs(draggedX - snapLeftX);
              const dyLeft = Math.abs(draggedY - snapLeftY);

              if (dxLeft <= 45 && dyLeft <= 32) {
                const dist = dxLeft + dyLeft;
                if (dist < minDistance) {
                  minDistance = dist;
                  bestTarget = {
                    target: target,
                    position: "left_condition",
                    snapX: snapLeftX,
                    snapY: snapLeftY,
                    snapW: draggedDims.w,
                    snapH: draggedDims.h
                  };
                }
              }

              const snapRightX = target.x + 65;
              const snapRightY = target.y + 2;
              const dxRight = Math.abs(draggedX - snapRightX);
              const dyRight = Math.abs(draggedY - snapRightY);

              if (dxRight <= 45 && dyRight <= 32) {
                const dist = dxRight + dyRight;
                if (dist < minDistance) {
                  minDistance = dist;
                  bestTarget = {
                    target: target,
                    position: "right_condition",
                    snapX: snapRightX,
                    snapY: snapRightY,
                    snapW: draggedDims.w,
                    snapH: draggedDims.h
                  };
                }
              }
            }
          }
        }
      }

      return bestTarget;
    },

    showSnapIndicator(snapTarget) {
      let indicator = document.getElementById("code-snap-ghost-indicator");
      const workspace = document.getElementById("code-workspace-blocks");

      document.querySelectorAll(".snap-target-highlight").forEach(el => {
        el.classList.remove("snap-target-highlight");
      });

      if (!snapTarget) {
        if (indicator) indicator.style.display = "none";
        return;
      }

      if (!indicator && workspace) {
        indicator = document.createElement("div");
        indicator.id = "code-snap-ghost-indicator";
        indicator.className = "code-snap-ghost-indicator";
        workspace.appendChild(indicator);
      }

      if (indicator) {
        indicator.style.left = `${snapTarget.snapX}px`;
        indicator.style.top = `${snapTarget.snapY}px`;
        const isInside = snapTarget.position === "inside" || snapTarget.position === "inside_if" || snapTarget.position === "inside_else";
        indicator.style.width = isInside ? `${Math.max(110, snapTarget.snapW - 20)}px` : `${Math.max(100, snapTarget.snapW)}px`;
        indicator.style.height = isInside ? `26px` : `${Math.max(30, snapTarget.snapH)}px`;
        indicator.style.display = "block";
      }

      if (snapTarget.target && snapTarget.target.id) {
        const targetEl = this.getBlockElement(snapTarget.target.id);
        if (targetEl) {
          if (snapTarget.position === "condition") {
            const slotEl = targetEl.querySelector('.code-condition-slot[data-slot="condition"], .code-condition-slot:not([data-slot])');
            if (slotEl) slotEl.classList.add("snap-target-highlight");
          } else if (snapTarget.position === "left_condition") {
            const slotEl = targetEl.querySelector('.code-condition-slot.left-slot, .code-condition-slot[data-slot="left"]');
            if (slotEl) slotEl.classList.add("snap-target-highlight");
          } else if (snapTarget.position === "right_condition") {
            const slotEl = targetEl.querySelector('.code-condition-slot.right-slot, .code-condition-slot[data-slot="right"]');
            if (slotEl) slotEl.classList.add("snap-target-highlight");
          } else {
            targetEl.classList.add("snap-target-highlight");
          }
        }
      }
    },

    layoutConnectedStacks() {
      const scripts = typeof AppModeController !== "undefined" ? AppModeController.getCurrentScripts() : [];
      if (!scripts || scripts.length === 0) return;

      const map = new Map(scripts.map(b => [b.id, b]));
      const visited = new Set();
      const roots = scripts.filter(b => !b.prevId && !b.parentCBlockId && !b.parentEBlockId);

      const layoutNode = (node, curX, curY) => {
        if (!node || visited.has(node.id)) return;
        visited.add(node.id);

        curX = typeof curX === "number" && !isNaN(curX) ? curX : 60;
        curY = typeof curY === "number" && !isNaN(curY) ? curY : 60;

        node.x = curX;
        node.y = curY;

        const el = this.getBlockElement(node.id);
        if (el) {
          el.style.left = `${node.x}px`;
          el.style.top = `${node.y}px`;
        }

        if (node.c_block) {
          const bodyH = this.getBranchHeight(node.childId, map);
          if (el) {
            const bodyEl = el.querySelector(".c-block-body");
            if (bodyEl) {
              bodyEl.style.height = `${bodyH}px`;
              bodyEl.style.minHeight = `${bodyH}px`;
            }
          }
          if (node.childId && map.has(node.childId)) {
            let childNode = map.get(node.childId);
            let childY = curY + 32;
            while (childNode && !visited.has(childNode.id)) {
              layoutNode(childNode, curX + 16, childY);
              const childDims = this.getBlockDimensions(childNode);
              childY += childDims.h - 2;
              childNode = childNode.nextId ? map.get(childNode.nextId) : null;
            }
          }
        } else if (node.e_block) {
          const ifBodyH = this.getBranchHeight(node.childId_if, map);
          const elseBodyH = this.getBranchHeight(node.childId_else, map);
          if (el) {
            const bodyIfEl = el.querySelector(".e-block-body-if");
            if (bodyIfEl) {
              bodyIfEl.style.height = `${ifBodyH}px`;
              bodyIfEl.style.minHeight = `${ifBodyH}px`;
            }
            const bodyElseEl = el.querySelector(".e-block-body-else");
            if (bodyElseEl) {
              bodyElseEl.style.height = `${elseBodyH}px`;
              bodyElseEl.style.minHeight = `${elseBodyH}px`;
            }
          }
          if (node.childId_if && map.has(node.childId_if)) {
            let childNode = map.get(node.childId_if);
            let childY = curY + 32;
            while (childNode && !visited.has(childNode.id)) {
              layoutNode(childNode, curX + 16, childY);
              const childDims = this.getBlockDimensions(childNode);
              childY += childDims.h - 2;
              childNode = childNode.nextId ? map.get(childNode.nextId) : null;
            }
          }
          if (node.childId_else && map.has(node.childId_else)) {
            let childNode = map.get(node.childId_else);
            let childY = curY + 32 + ifBodyH + 24;
            while (childNode && !visited.has(childNode.id)) {
              layoutNode(childNode, curX + 16, childY);
              const childDims = this.getBlockDimensions(childNode);
              childY += childDims.h - 2;
              childNode = childNode.nextId ? map.get(childNode.nextId) : null;
            }
          }
        }

        if (node.nextId && map.has(node.nextId)) {
          const nextNode = map.get(node.nextId);
          const fullH = this.getFullBlockHeight(node, map);
          const nextY = curY + fullH - 2;
          layoutNode(nextNode, curX, nextY);
        }
      };

      roots.forEach(root => {
        layoutNode(root, root.x, root.y);
      });

      scripts.forEach(b => {
        if (!visited.has(b.id)) {
          layoutNode(b, b.x, b.y);
        }
      });
    }
  };

  global.BlockConnectors = BlockConnectors;
})(typeof window !== 'undefined' ? window : globalThis);
