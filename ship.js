// @ts-check

import { G, worldToScreen } from "./main.js";
import Planet from "./planet.js";

const THRUST_POWER = 40;
const MAX_TRAIL_AGE = 1000;
const TRAIL_PERIODICITY = 3;

export default class Ship {
  /**
   * @param {Planet} orbiting
   * @param {Planet} target
   */
  constructor(orbiting, target) {
    this.target = target;
    this.orbiting = orbiting;
    this.x = this.orbiting.x + this.orbiting.radius * 2;
    this.y = this.orbiting.y;
    this.vy = -Math.sqrt((G * this.orbiting.mass) / (this.orbiting.radius * 2));
  }
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  orbiting;
  target;
  /** @type {{x: number, y: number, time: number}[]} */
  trail = [];
  /** @type {-1 | 0 | 1} */
  thrustDir = 0;
  consumedDeltaV = 0;

  get distanceToPlanet() {
    return Math.sqrt(
      Math.pow(this.x - this.orbiting.x, 2) +
        Math.pow(this.y - this.orbiting.y, 2),
    );
  }

  /**
   * @param {-1 | 0 | 1} dir
   */
  setThrust(dir) {
    this.thrustDir = dir;
  }

  /**
   * @param {number} dt
   * @param {number} [dir]
   */
  thrust(dt, dir = this.thrustDir) {
    if (dir === 0) return false;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0) {
      const dv = THRUST_POWER * dt * dir;
      this.vx += (this.vx / speed) * dv;
      this.vy += (this.vy / speed) * dv;
      this.consumedDeltaV += Math.abs(dv);
    }

    return true;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time
   */
  draw(ctx, time) {
    const pos = worldToScreen(this.x, this.y);
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    if (this.thrustDir !== 0) {
      ctx.shadowColor = this.thrustDir < 0 ? "#ff6600" : "#00ff88";
      ctx.shadowBlur = 20;

      const flameDir = this.thrustDir;
      const flameGrad = ctx.createLinearGradient(
        -20 * flameDir,
        0,
        -8 * flameDir,
        0,
      );
      flameGrad.addColorStop(0, "transparent");
      flameGrad.addColorStop(1, this.thrustDir < 0 ? "#ff6600" : "#00ff88");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(-6 * flameDir, -4);
      ctx.lineTo(-18 * flameDir - Math.random() * 8, 0);
      ctx.lineTo(-6 * flameDir, 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowColor =
      this.thrustDir === 0
        ? "#00ffff"
        : this.thrustDir < 0
          ? "#ff6600"
          : "#00ff88";
    ctx.shadowBlur = this.thrustDir === 0 ? 10 : 15;

    ctx.fillStyle = this.thrustDir ? "#ffffff" : "#ffaa00";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    this.drawTrail(ctx, time);
    this.drawPointer(ctx);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time
   */
  drawTrail(ctx, time) {
    ctx.fillStyle = "#00ffff";
    let i = 0;
    for (const p of this.trail) {
      i++;
      if ((this.trail.length - i) % TRAIL_PERIODICITY !== 0) continue;
      if (i > MAX_TRAIL_AGE) break;
      const pos = worldToScreen(p.x, p.y);
      ctx.globalAlpha = 1 - i / MAX_TRAIL_AGE;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawPointer(ctx) {
    const pos = worldToScreen(this.x, this.y);
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;

    if (pos.x >= 0 && pos.x <= W && pos.y >= 0 && pos.y <= H) return;

    const cx = W / 2;
    const cy = H / 2;
    const angle = Math.atan2(pos.y - cy, pos.x - cx);

    let edgeX, edgeY;
    const margin = 20;

    if (pos.x < 0 || pos.x > W) {
      if (pos.y < 0) {
        const t = -cy / (pos.y - cy);
        edgeX = cx + t * (pos.x - cx);
        edgeY = -margin;
      } else if (pos.y > H) {
        const t = (H - cy) / (pos.y - cy);
        edgeX = cx + t * (pos.x - cx);
        edgeY = H + margin;
      } else if (pos.x < 0) {
        edgeX = -margin;
        edgeY = pos.y;
      } else {
        edgeX = W + margin;
        edgeY = pos.y;
      }
    } else if (pos.y < 0) {
      edgeX = pos.x;
      edgeY = -margin;
    } else if (pos.y > H) {
      edgeX = pos.x;
      edgeY = H + margin;
    }

    edgeX = Math.max(margin, Math.min(W - margin, edgeX));
    edgeY = Math.max(margin, Math.min(H - margin, edgeY));

    const pointerAngle = Math.atan2(edgeY - cy, edgeX - cx);

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(pointerAngle);

    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const dist = this.distanceToPlanet;

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = "#ff6b35";
    ctx.textAlign = "center";
    ctx.fillText(
      `${Math.round(dist)}`,
      edgeX,
      edgeY + (edgeY < H / 2 ? 20 : -10),
    );
  }
}
