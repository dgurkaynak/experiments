interface Vector { x: number, y: number };

export default class Particle {
  position: Vector = { x: 0, y: 0 };
  velocity: Vector = { x: 0, y: 0 };
  dampingFactor = 0.9;
  type: 'cocaine' | 'ketamine';
  dirty = false;


  update(force: Vector = { x: 0, y: 0 }) {
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
