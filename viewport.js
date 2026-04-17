// @ts-check

export default class Viewport {
  x = 0;
  y = 0;
  progress = 1;
  prevX = 0;
  prevY = 0;
  targetX = 0;
  targetY = 0;
  zoom = 1;
  targetZoom = 1;
  prevZoom = 1;

  get sliding() {
    return this.progress < 1;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.progress = 1;
    this.zoom = 1;
    this.targetZoom = 1;
    this.prevZoom = 1;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [zoom]
   */
  slideTo(x, y, zoom = this.zoom) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.targetX = x;
    this.targetY = y;
    this.prevZoom = this.zoom;
    this.targetZoom = Math.max(0.01, zoom);
    if (
      this.targetX !== this.prevX ||
      this.targetY !== this.prevY ||
      this.targetZoom !== this.prevZoom
    ) {
      this.progress = 0;
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  slideBy(x, y) {
    this.slideTo(this.targetX + x, this.targetY + y);
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    if (!this.sliding) return;
    this.progress += dt;
    if (this.progress >= 1) {
      this.progress = 1;
    }
    const t = this.progress;
    const ease = t * (2 - t);
    this.x = this.prevX + (this.targetX - this.prevX) * ease;
    this.y = this.prevY + (this.targetY - this.prevY) * ease;
    this.zoom = this.prevZoom + (this.targetZoom - this.prevZoom) * ease;
  }
}
