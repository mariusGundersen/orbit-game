// @ts-check

import Explosion from "./explosion.js";
import Planet from "./planet.js";
import { rand, reset } from "./random.js";
import Ship from "./ship.js";
import Viewport from "./viewport.js";

export default class Game {
  level = 1;
  time = 0;
  gameOver = false;
  viewport = new Viewport();
  planets = [
    new Planet(this.viewport.worldWidth * 0.5, this.viewport.worldHeight * 0.75, 5000, "#00e5ff"),
    new Planet(this.viewport.worldWidth * 0.5, this.viewport.worldHeight * 0.25, 4500, "#ff6b35"),
  ];
  ship = new Ship(this.planets[0], this.planets[1]);

  /**
   * @type {Explosion[]}
   */
  explosions = [];


  /**
     * @param {Viewport} [viewport]
     */
  constructor(viewport = new Viewport()) {
    reset(new Date().toDateString());
    this.viewport = viewport;
    viewport.slideTo(0, 0, 1);
  }

  /**
   * @param {number} dt
   */
  updateExplosions(dt) {
    for (const explosion of this.explosions) {
      explosion.update(dt);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawExplosions(ctx) {
    for (const explosion of this.explosions) {
      explosion.draw(ctx);
    }
    ctx.globalAlpha = 1;
  }

  /**
   * @param {number} refX
   * @param {number} refY
   */
  generateRandomPlanet(refX, refY) {
    const t = Math.min(1, Math.max(0, (this.level - 1) / 9));
    const inline = 0.5 + (rand() - 0.5) * t;
    const block = 0.5 + (rand() - 0.5) * t * 0.5;
    const x = this.viewport.worldWidth * inline;
    const y = refY - this.viewport.worldHeight * block;

    return new Planet(x, y);
  }

  transitionToNextLevel() {
    const oldOrbit = this.ship.orbiting;
    const newOrbit = this.ship.target;

    this.viewport.slideBy(oldOrbit.x - newOrbit.x, oldOrbit.y - newOrbit.y);

    this.explosions.push(
      new Explosion(oldOrbit.x, oldOrbit.y, oldOrbit.color, oldOrbit.radius),
    );

    const newTarget = this.generateRandomPlanet(newOrbit.x, newOrbit.y);
    this.planets.push(newTarget);
    this.ship.target = newTarget;
    this.ship.orbiting = newOrbit;

    /*
      levelDeltaVs[this.level] = this.ship.consumedDeltaV;
      saveHighScore(this.level, this.ship.consumedDeltaV);
      */

    this.level++;

    /*
      perigeePos = AUTO_CIRCULARIZE ? {
          x: this.ship.orbiting.x,
          y: this.ship.orbiting.y,
      } : null;
       */
  }

  endGame() {
    this.gameOver = true;

    const orbitedPlanets = this.planets.slice(0, -1);

    const minX = Math.min(...orbitedPlanets.map((p) => p.x));
    const maxX = Math.max(...orbitedPlanets.map((p) => p.x));
    const minY = Math.min(...orbitedPlanets.map((p) => p.y));
    const maxY = Math.max(...orbitedPlanets.map((p) => p.y));

    const trailX = this.ship.trail.map((t) => t.x);
    const trailY = this.ship.trail.map((t) => t.y);
    const trailMinX = trailX.length ? Math.min(...trailX) : 0;
    const trailMaxX = trailX.length ? Math.max(...trailX) : 0;
    const trailMinY = trailY.length ? Math.min(...trailY) : 0;
    const trailMaxY = trailY.length ? Math.max(...trailY) : 0;

    const contentMinX = Math.min(minX, trailMinX) - 100;
    const contentMaxX = Math.max(maxX, trailMaxX) + 100;
    const contentMinY = Math.min(minY, trailMinY) - 100;
    const contentMaxY = Math.max(maxY, trailMaxY) + 100;

    const contentW = contentMaxX - contentMinX;
    const contentH = contentMaxY - contentMinY;

    const scaleX = this.viewport.worldWidth / contentW;
    const scaleY = this.viewport.worldHeight / contentH;
    const targetZoom = Math.min(scaleX, scaleY, 1);

    const contentCenterX = (contentMinX + contentMaxX) / 2;
    const contentCenterY = (contentMinY + contentMaxY) / 2;

    this.viewport.slideTo(
      this.viewport.worldWidth / 2 - contentCenterX,
      this.viewport.worldHeight / 2 - contentCenterY,
      targetZoom,
    );
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this.updateExplosions(dt);
    this.viewport.update(dt);

    if (this.gameOver) {
      return;
    }

    this.time += dt;

    if (this.ship.thrust(dt)) {
      /*
          perigeePos = null;
          */
      return;
    }

    if (this.ship.fuel <= 0) {
      this.endGame();
      return;
    }


    /*
      if (perigeePos) {
          const distToPerigee = Math.sqrt(
              Math.pow(this.ship.x - perigeePos.x, 2) + 
              Math.pow(this.ship.y - perigeePos.y, 2)
          );
          if (distToPerigee < 15) {
              const orbitDist = Math.sqrt(
                  Math.pow(this.ship.x - body.x, 2) + 
                  Math.pow(this.ship.y - body.y, 2)
              );
              const circularSpeed = Math.sqrt(G * body.mass / orbitDist);
              const currentSpeed = Math.sqrt(this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy);
              if (currentSpeed > circularSpeed) {
                  this.ship.thrust(dt, 1);
                  return;
              } else {
                  const scale = circularSpeed / currentSpeed;
                  this.ship.vx *= scale;
                  this.ship.vy *= scale;
                  perigeePos = null;
              }
          }
      }
    */

    const grav = this.ship.orbiting.calculateForceOnObject(this.ship);
    const targetGrav = this.ship.target.calculateForceOnObject(this.ship);

    if (grav.dist < this.ship.orbiting.radius) {
      this.endGame();
      return;
    } else if (targetGrav.force > grav.force) {
      this.transitionToNextLevel();
      this.ship.update(dt, targetGrav);
    } else {
      this.ship.update(dt, grav);
    }

    if (!this.viewport.sliding) {
      const body = this.ship.orbiting;
      const dx = this.ship.x - body.x;
      const dy = this.ship.y - body.y;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const speedSq = this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy;

      const rx = dx / currentDist;
      const ry = dy / currentDist;

      const h = dx * this.ship.vy - dy * this.ship.vx;
      const eVecX = (this.ship.vy * h) / (body.massG) - rx;
      const eVecY = (-this.ship.vx * h) / (body.massG) - ry;
      const e = Math.sqrt(eVecX * eVecX + eVecY * eVecY);

      if (e >= 1) {
        const screenPos = this.viewport.worldToScreen(this.ship.x, this.ship.y);
        if (
          screenPos.x < -100 ||
          screenPos.x > this.viewport.worldWidth + 100 ||
          screenPos.y < -100 ||
          screenPos.y > this.viewport.worldHeight + 100
        ) {
          this.endGame();
        }
      }
    }
  }


  /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {() => void} cb
     */
  transformScreen(ctx, cb) {
    ctx.save();
    ctx.translate(this.viewport.worldWidth / 2, this.viewport.worldHeight / 2);
    ctx.scale(this.viewport.zoom, this.viewport.zoom);
    ctx.translate(this.viewport.x - this.viewport.worldWidth / 2, this.viewport.y - this.viewport.worldHeight / 2);
    cb();
    ctx.restore();
  }

  /**
     * @param {CanvasRenderingContext2D} ctx
     */
  draw(ctx) {
    if (this.gameOver) {
      this.transformScreen(ctx, () => {
        this.planets.forEach(p => p.draw(ctx, this.time));
        this.ship.draw(ctx);
        this.ship.drawTrail(ctx, Infinity);
      });
    } else {
      this.transformScreen(ctx, () => {
        this.ship.drawOrbitPath(ctx);
        if (this.level === 1) {
          ctx.strokeStyle = '#444';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.ellipse(240, 300, 275, 230, Math.PI / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (this.level === 2) {
          ctx.strokeStyle = '#444';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(this.planets[1].x, this.planets[1].y, this.planets[1].radius*2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (this.level < 4) {
          this.ship.drawSOIs(ctx);
        }
        this.planets.slice(-3).forEach(p => p.draw(ctx, this.time));
        this.ship.drawTrail(ctx);
        this.ship.draw(ctx);
        this.drawExplosions(ctx);
        /*
        drawPerigee();
        */
        this.drawPointerToShip(ctx);
      });
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  drawPointerToShip(ctx) {
    const pos = this.viewport.worldToScreen(this.ship.x, this.ship.y);

    const W = this.viewport.screenWidth;
    const H = this.viewport.screenHeight;

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

    const pointerPos = this.viewport.screenToWorld(edgeX, edgeY);

    const pointerAngle = Math.atan2(pointerPos.y - this.ship.orbiting.y, pointerPos.x - this.ship.orbiting.x);

    const dist = Math.sqrt(
      Math.pow(this.ship.x - pointerPos.x, 2) +
      Math.pow(this.ship.y - pointerPos.y, 2)
    );

    ctx.save();
    ctx.translate(pointerPos.x, pointerPos.y);
    ctx.rotate(pointerAngle);

    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-16, -6);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = "#ff6b35";
    ctx.textAlign = "center";
    const { width } = ctx.measureText(`${Math.round(dist)}`);
    ctx.fillText(
      `${Math.round(dist)}`,
      pointerPos.x - Math.cos(pointerAngle) * (20 + width / 2),
      pointerPos.y - Math.sin(pointerAngle) * (20 + width / 2),
    );
  }
}

/*
function drawPerigee() {
    if (!perigeePos) return;
    
    const pulse = Math.sin(time * 5) * 0.3 + 0.7;
    
    ctx.fillStyle = '#ffff00';
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(perigeePos.x, perigeePos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse * 0.5;
    ctx.beginPath();
    ctx.arc(perigeePos.x, perigeePos.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
}
    */