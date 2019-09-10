import CCapture from 'ccapture.js';


/**
 * Records the canvas keyframes to be combined into a video.
 * Required 3 parameters:
 *  - `canvas`: Canvas element
 *  - `duration`: Desired video duration in ms
 *  - `frameRate`: Desired video frame rate
 *
 * Example usage:
 * ```js
 * // We want to record `canvasEl` for 15 seconds in 30 fps
 * const canvasRecorder = new CanvasRecorder(canvasEl, 15000, 30);
 *
 * // Just a notification for record ending
 * canvasRecorder.onEnded = () => console.log('record ended');
 *
 * // In your draw or requestAnimationFrame function, call `capture()` method
 * // Don't worry, we don't started capturing yet, so this is a no-op for now
 * canvasRecorder.capture();
 *
 * // Then start your recording, you can trigger it by a button click:
 * captureButton.addEventListener('click', () => {
 *    canvasRecorder.start();
 * }, false);
 * ```
 *
 * After calling `start()` method, CanvasRecorder will capture every keyframe until
 * desired number of keyframes are collected. All the keyframes are saved as PNG files
 * that their dimension is exactly same with canvas element. (canvasEl.width and canvasEl.height)
 *
 * When capture is ended, you will see `capture ended` console message, because we did it so.
 * A random tar file should be automatically downloaded when it ends.
 *
 * Extract it, go to that folder in terminal, and combine them with ffmpeg with this command:
 * ```sh
 * ffmpeg -r 30 -f image2 -s 1024x1024 -i "%07d.png" -vcodec libx264 -crf 0 -pix_fmt yuv420p output.mp4
 * ```
 */
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
