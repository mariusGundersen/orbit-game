// @ts-check

import { H, W, worldToScreen } from "./main.js";
import Planet from "./planet.js";

const THRUST_POWER = 40;
const MAX_TRAIL_AGE = 1000;
const TRAIL_PERIODICITY = 3;

export default class Ship {
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
  fuel = 1000;

  /**
   * @param {Planet} orbiting
   * @param {Planet} target
   */
  constructor(orbiting, target) {
    this.target = target;
    this.orbiting = orbiting;
    this.x = this.orbiting.x + this.orbiting.radius * 2;
    this.y = this.orbiting.y;
    this.vy = -Math.sqrt(this.orbiting.massG / (this.orbiting.radius * 2));
  }

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
    if(this.fuel <= 0) return;
    this.thrustDir = dir;
  }

  /**
   * @param {number} dt
   * @param {-1 | 0 | 1} [dir]
   */
  thrust(dt, dir = this.thrustDir) {
    if (dir === 0 || this.fuel <= 0) return false;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 0) {
      const dv = Math.min(this.fuel, THRUST_POWER * dt) * dir;
      this.vx += (this.vx / speed) * dv;
      this.vy += (this.vy / speed) * dv;
      this.fuel -= Math.abs(dv);
    }

    return true;
  }

  /**
   * @param {number} dt
   * @param {{ax: number, ay: number}} acceleration
   */
  update(dt, { ax, ay }) {
    this.vx += ax * dt;
    this.vy += ay * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.unshift({ x: this.x, y: this.y, time: 0 });
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(this.x, this.y);
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
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} maxTrailAge
   */
  drawTrail(ctx, maxTrailAge = MAX_TRAIL_AGE) {
    ctx.fillStyle = "#00ffff";
    let i = 0;
    for (const p of this.trail) {
      i++;
      if ((this.trail.length - i) % TRAIL_PERIODICITY !== 0) continue;
      if (i > maxTrailAge) break;
      ctx.globalAlpha = 1 - i / maxTrailAge;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawPointer(ctx) {
    const pos = worldToScreen(this.x, this.y);

    const margin = 0;
    let edgeX, edgeY;

    if (pos.x < margin) {
      edgeX = margin;
      if (pos.y < margin) {
        edgeY = margin;
      } else if (pos.y > H - margin) {
        edgeY = H - margin;
      } else {
        edgeY = pos.y;
      }
    } else if (pos.x > W - margin) {
      edgeX = W - margin;
      if (pos.y < margin) {
        edgeY = margin;
      } else if (pos.y > H - margin) {
        edgeY = H - margin;
      } else {
        edgeY = pos.y;
      }
    } else if (pos.y < margin) {
      edgeY = margin;
      edgeX = pos.x;
    } else if (pos.y > H - margin) {
      edgeY = H - margin;
      edgeX = pos.x;
    } else {
      return;
    }

    const planetPos = worldToScreen(this.orbiting.x, this.orbiting.y);

    const cx = planetPos.x;
    const cy = planetPos.y;

    const pointerAngle = Math.atan2(edgeY - cy, edgeX - cx);

    ctx.save();
    ctx.translate(edgeX, edgeY);
    ctx.rotate(pointerAngle);

    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    const dist = this.distanceToPlanet;

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = "#ff6b35";
    ctx.textAlign = "center";
    const { width } = ctx.measureText(`${Math.round(dist)}`);
    ctx.fillText(
      `${Math.round(dist)}`,
      edgeX - Math.cos(pointerAngle) * (20 + width / 2),
      edgeY - Math.sin(pointerAngle) * (20 + width / 2),
    );
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawSOIs(ctx) {
    const p1 = this.orbiting;
    const p2 = this.target;

    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const radius1 = (p1.mass / (p1.mass + p2.mass)) * dist;
    const radius2 = (p2.mass / (p1.mass + p2.mass)) * dist;
    const dir = Math.atan2(dy, dx);

    const arcSize = Math.PI / 5;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, radius2, dir - arcSize, dir + arcSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(
      p1.x,
      p1.y,
      radius1,
      dir + Math.PI - arcSize,
      dir + Math.PI + arcSize,
    );
    ctx.stroke();
    ctx.restore();
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawOrbitPath(ctx) {
    const body = this.orbiting;

    const dx = this.x - body.x;
    const dy = this.y - body.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    const vx = this.vx;
    const vy = this.vy;
    const speedSq = vx * vx + vy * vy;

    const rx = dx / currentDist;
    const ry = dy / currentDist;

    const h = dx * vy - dy * vx;
    const eVecX = (vy * h) / body.massG - rx;
    const eVecY = (-vx * h) / body.massG - ry;
    const e = Math.sqrt(eVecX * eVecX + eVecY * eVecY);

    const a = body.massG / ((2 * body.massG) / currentDist - speedSq);

    if (a > 0 && e < 1 && e > 0.01) {
      /*if(perigeePos){
              const perigeeDist = a * (1 - e);
              
              perigeePos.x = body.x + (perigeeDist * eVecX / e);
              perigeePos.y = body.y + (perigeeDist * eVecY / e);
          }*/

      const cx = body.x - a * eVecX;
      const cy = body.y - a * eVecY;
      const b = a * Math.sqrt(1 - e * e);

      const angle = Math.atan2(eVecY, eVecX);

      ctx.strokeStyle = body.color + "80";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, angle, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (e >= 1) {
      ctx.strokeStyle = body.color + "80";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);

      const angle = Math.atan2(eVecY, eVecX);

      ctx.beginPath();
      const semiMajor = Math.abs(a);

      const r = (semiMajor * (e * e - 1)) / (1 + e);
      const cx = r * Math.cos(angle);
      const cy = r * Math.sin(angle);

      let ox = cx;
      let oy = cy;
      let nx = 0;
      let ny = 0;

      ctx.moveTo(body.x + cx, body.y + cy);
      for (let i = 1; i <= 20; i++) {
        const t = i * 0.1;
        const r = (semiMajor * (e * e - 1)) / (1 + e * Math.cos(t));
        const px = r * Math.cos(t + angle);
        const py = r * Math.sin(t + angle);

        // Don't draw the line if floating point arithmetic fails
        if (cx * px + cy * py < 0) {
          ctx.lineTo(body.x + ox + nx * 10, body.y + oy + ny * 10);
          break;
        }

        ctx.lineTo(body.x + px, body.y + py);
        nx = px - ox;
        ny = py - oy;
        ox = px;
        oy = py;
      }

      ox = cx;
      oy = cy;
      nx = 0;
      ny = 0;

      ctx.moveTo(body.x + cx, body.y + cy);
      for (let i = -1; i >= -20; i--) {
        const t = i * 0.1;
        const r = (semiMajor * (e * e - 1)) / (1 + e * Math.cos(t));
        const px = r * Math.cos(t + angle);
        const py = r * Math.sin(t + angle);

        // Don't draw the line if floating point arithmetic fails
        if (cx * px + cy * py < 0) {
          ctx.lineTo(body.x + ox + nx * 10, body.y + oy + ny * 10);
          break;
        }
        ctx.lineTo(body.x + px, body.y + py);
        nx = px - ox;
        ny = py - oy;
        ((ox = px), (oy = py));
      }
      ctx.stroke();
      ctx.setLineDash([]);

      //perigeePos = null;
    } else {
      ctx.strokeStyle = body.color + "80";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(body.x, body.y, currentDist, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      //perigeePos = null;
    }
  }
}
