export default class VideoReader {
  readonly video = document.createElement('video');
  readonly canvas = document.createElement('canvas');
  private canvasContext = this.canvas.getContext('2d');


  constructor(private src, private fps = 30) {

  }


  async init() {
    this.video.src = this.src;
    await waitEvent(this.video, 'canplaythrough');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    this.draw();
  }


  async nextFrame() {
    this.video.currentTime = Math.min(this.video.currentTime + 1 / this.fps, this.video.duration);
    await waitEvent(this.video, 'seeked');
    this.draw();
  }


  async previousFrame() {
    this.video.currentTime = Math.max(this.video.currentTime - 1 / this.fps, 0);
    await waitEvent(this.video, 'seeked');
    this.draw();
  }


  read() {
    return this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }


  private draw() {
    this.canvasContext.drawImage(this.video, 0, 0);
  }
}


function waitEvent(element: HTMLElement, eventName: string) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });
}
