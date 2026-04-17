// @ts-check

import { generateArray } from "./utils.js";

export default class Explosion {
  time = 2;
  /**
   * @type {Particle[]}
   */
  particles = [];

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} radius
   */
  constructor(x, y, color, radius) {
    this.particles = generateArray(50, () => new Particle(x, y, radius, color));
  }

  get expired() {
    return this.time <= 0;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (this.expired) return;

    this.time -= dt;

    for (const particle of this.particles) {
      particle.update(dt);
    }
  }

  /**
   *
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.expired) return;

    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }
}

class Particle {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {string} color
   */
  constructor(x, y, radius, color) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 200;
    this.x = x + Math.cos(angle) * radius;
    this.y = y + Math.sin(angle) * radius;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.size = 3 + Math.random() * 6;
    this.color = color;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.alpha -= dt * 0.8;
    this.size *= 0.99;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
