import CCapture from 'ccapture.js';


export default class CanvasRecorder {
  capturer: CCapture;
  onEnded = () => {};
  private startDate: number;
  private isStarted = false;
  private isEnded = false;


  constructor(public canvas: HTMLCanvasElement, public duration = 5000, frameRate = 30) {
    this.capturer = new CCapture({ format: 'png', framerate: frameRate });
  }


  start() {
    this.isStarted = true;
    this.capturer.start();
  }


  capture() {
    // If already ended or not started, ignore
    if (this.isEnded || !this.isStarted) return;

    // Save start date
    if (!this.startDate) this.startDate = Date.now();

    // Check whether finished
    if (Date.now() - this.startDate > this.duration) {
      this.capturer.stop();
      this.capturer.save();
      this.isEnded = true;
      this.onEnded();
      return;
    }

    // Capture
    this.capturer.capture(this.canvas);
  }
}
