// @ts-check

import { worldToScreen } from "./main.js";

export default class Planet {
  static DENSITY = 80;
  static COLORS = [
    "#ff6b35",
    "#7b2cbf",
    "#2ec4b6",
    "#e71d36",
    "#ff9f1c",
    "#7209b7",
    "#06d6a0",
    "#ffd166",
  ];

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} mass
   * @param {string} color
   */

  /*
    

    const radius = 35 + Math.random() * 30;
    const mass = radius * 80;
    */
  constructor(x, y, mass = Planet.randomMass(), color = Planet.randomColor()) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = mass / Planet.DENSITY;
    this.color = color;
  }

  static randomColor() {
    return Planet.COLORS[Math.floor(Math.random() * Planet.COLORS.length)];
  }

  static randomMass() {
    return (35 + Math.random() * 30) * Planet.DENSITY;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawGlow(ctx, intensity = 1) {
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      this.radius * 2,
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.4, this.color + "80");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.globalAlpha = intensity;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time
   */
  draw(ctx, time) {
    const pos = worldToScreen(this.x, this.y);
    const pulse = Math.sin(time * 2) * 0.1 + 1;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 40 * pulse;

    const grad = ctx.createRadialGradient(
      pos.x - this.radius * 0.3,
      pos.y - this.radius * 0.3,
      0,
      pos.x,
      pos.y,
      this.radius,
    );
    grad.addColorStop(0, this.color + "ff");
    grad.addColorStop(0.7, this.color + "aa");
    grad.addColorStop(1, this.color + "44");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.drawGlow(ctx, 0.3);
  }
}
