export class Animator {
  id = null;

  constructor(handler) {
    this.handler = handler;
  }

  animate() {
    this.id = requestAnimationFrame((highResTimestamp) => {
      this.handler(highResTimestamp);
      this.animate();
    });
  }

  start() {
    this.animate();
  }

  stop() {
    cancelAnimationFrame(this.id);
  }

  dispose() {
    this.stop();
    this.id = null;
    this.handler = null;
  }
}
