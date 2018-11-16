export default class Animator {
  id: number;
  handler: Function;


  constructor(handler: Function) {
    this.handler = handler;
  }


  animate() {
    this.id = requestAnimationFrame(() => {
      this.handler();
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
