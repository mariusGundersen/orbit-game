// @ts-check

import { rand } from "./random.js";
import Satellite from "./satellite.js";
import { generateArray } from './utils.js';

export default class Planet {
  static G = 800;
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

  static randomColor() {
    return Planet.COLORS[Math.floor(rand() * Planet.COLORS.length)];
  }

  static randomMass() {
    return (35 + rand() * 30) * Planet.DENSITY;
  }

  /**
   * @type {Satellite[]}
   */
  satellites = [];

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} mass
   * @param {string} color
   */
  constructor(x, y, mass = Planet.randomMass(), color = Planet.randomColor()) {
    this.x = x;
    this.y = y;
    this.mass = mass;
    this.radius = mass / Planet.DENSITY;
    this.color = color;
  }

  /**
   * @param {number} distance
   */
  addSatellite(distance, angle = rand() * Math.PI * 2, orbitSpeed = rand() - 0.5) {
    const satellite = new Satellite(this, distance, angle, orbitSpeed);
    this.satellites.push(satellite);
  }

  /**
   * @param {number} level
   */
  generateSatellites(level) {
    const t = Math.min(1, Math.max(0, (level - 1) / 9));
    const count = level <= 3 ? 1 : level <= 6 ? 2 : level <= 9 ? 3 : 1 + Math.floor(rand() * 4);
    const canOrbit = level >= 10;
    const speed = canOrbit ? (rand() - 0.5) : 0;

    const distance = this.radius * (2 - rand() * 0.5 * t);
    const angleOffset = rand() * Math.PI * 2;

    this.satellites = generateArray(count, i => new Satellite(this, distance, ((Math.PI * 2 / count) * i + angleOffset), speed));
  }

  /**
   * @returns {boolean}
   */
  allSatellitesVisited() {
    return this.satellites.every(s => s.visited);
  }

  /**
   * @returns {boolean}
   */
  hasUnvisitedSatellites() {
    return this.satellites.some(s => !s.visited);
  }

  get massG() {
    return Planet.G * this.mass;
  }

  /**
   * @param {{ x: number; y: number; }} pos
   */
  calculateForceOnObject(pos) {
    const dx = this.x - pos.x;
    const dy = this.y - pos.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    const force = (Planet.G * this.mass) / distSq;
    return {
      ax: (force * dx) / dist,
      ay: (force * dy) / dist,
      dist,
      force,
    };
  }

  /**
   * @param {number} dt
   */
  updateSatellites(dt) {
    for (const satellite of this.satellites) {
      satellite.update(dt);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawSatellites(ctx) {
    for (const satellite of this.satellites) {
      satellite.draw(ctx);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time
   */
  draw(ctx, time) {
    const pulse = Math.sin(time * 2) * 0.1 + 1;

    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 40 * pulse;

    const grad = ctx.createRadialGradient(
      this.x - this.radius * 0.3,
      this.y - this.radius * 0.3,
      0,
      this.x,
      this.y,
      this.radius,
    );
    grad.addColorStop(0, this.color + "ff");
    grad.addColorStop(0.7, this.color + "aa");
    grad.addColorStop(1, this.color + "44");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

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
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    this.drawSatellites(ctx);
  }
}
