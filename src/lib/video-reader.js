import { waitEvent } from './promise-helper.js';

export class VideoReader {
  constructor(src, fps = 30) {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.canvasContext = this.canvas.getContext('2d');
    this.src = src;
    this.fps = fps;
  }

  async init() {
    this.video.src = this.src;
    await waitEvent(this.video, 'canplaythrough');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.draw();
  }

  async nextFrame() {
    const t = Math.min(
      this.video.currentTime + 1 / this.fps,
      this.video.duration
    );
    this.video.currentTime = t;
    await waitEvent(this.video, 'seeked');
    this.draw();
  }

  async previousFrame() {
    this.video.currentTime = Math.max(this.video.currentTime - 1 / this.fps, 0);
    await waitEvent(this.video, 'seeked');
    this.draw();
  }

  async jumpToBegining() {
    this.video.currentTime = 0;
    await waitEvent(this.video, 'seeked');
    this.draw();
  }

  read() {
    return this.canvasContext.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  setFPS(fps) {
    this.fps = fps;
  }

  draw() {
    this.canvasContext.drawImage(this.video, 0, 0);
  }
}
