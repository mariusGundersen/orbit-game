// @ts-check

import { rand } from "./random.js";

const SATELLITE_COLOR = "#ffd700";
const SATELLITE_RADIUS = 8;
const VISITED_ALPHA = 0.3;
const COLLISION_DISTANCE = 20;

export default class Satellite {
  x = 0;
  y = 0;
  /**
   * @param {import("./planet.js").default} planet
   * @param {number} distance
   * @param {number} [angle]
   * @param {number} [orbitSpeed]
   */
  constructor(planet, distance, angle = rand() * Math.PI * 2, orbitSpeed = 0) {
    this.planet = planet;
    this.distance = distance;
    this.angle = angle;
    this.rotationAngle = rand() * Math.PI * 2;
    this.orbitSpeed = orbitSpeed;
    this.visited = false;
  }

  updatePosition() {
    this.x = this.planet.x + Math.cos(this.angle) * this.distance;
    this.y = this.planet.y + Math.sin(this.angle) * this.distance;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (!this.visited) {
      this.rotationAngle += 1.5 * dt;
    }
    this.angle += this.orbitSpeed * dt;
    this.updatePosition();
  }

  /**
   * @returns {boolean}
   */
  isVisited() {
    return this.visited;
  }

  visit() {
    this.visited = true;
  }

  /**
   * @param {{x: number, y: number}} ship
   * @returns {boolean}
   */
  checkCollision(ship) {
    if (this.visited) return false;
    const dx = this.x - ship.x;
    const dy = this.y - ship.y;
    return Math.sqrt(dx * dx + dy * dy) < COLLISION_DISTANCE;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.x === 0 && this.y === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotationAngle);

    ctx.fillStyle = SATELLITE_COLOR;
    ctx.shadowColor = SATELLITE_COLOR;
    ctx.shadowBlur = this.visited ? 5 : 15;
    ctx.globalAlpha = this.visited ? VISITED_ALPHA : 1;

    ctx.beginPath();
    ctx.arc(0, 0, SATELLITE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (!this.visited) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = SATELLITE_COLOR;
      ctx.setLineDash([2 * Math.PI, 2 * Math.PI]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, SATELLITE_RADIUS + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}