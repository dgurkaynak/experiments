export class Particle {
  constructor() {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.dampingFactor = 0.9;
    this.type = null; // 'cocaine' | 'ketamine';
    this.dirty = false;
  }

  update(force = { x: 0, y: 0 }) {
    if (Math.abs(force.x) > 0) {
      this.velocity.x += force.x;
    } else {
      this.velocity.x *= this.dampingFactor;
      if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
    }

    if (Math.abs(force.y) > 0) {
      this.velocity.y += force.y;
    } else {
      this.velocity.y *= this.dampingFactor;
      if (Math.abs(this.velocity.y) < 0.1) this.velocity.y = 0;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}
