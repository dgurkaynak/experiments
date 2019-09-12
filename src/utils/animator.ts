export default class Animator {
  id: number;
  handler: Function;


  constructor(handler: (highResTimestamp: number) => void) {
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
