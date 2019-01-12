import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './yt_cgm5nEdnuhE.mp4';
// import CanvasRecorder from '../utils/canvas-recorder';



/**
 * Constants
 */
const VIDEO_SIZE = [1280, 720];
const FPS = 30;
const ENABLE_STATS = true;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: VIDEO_SIZE as [number, number],
  dimensionScaleFactor: 1
});
const stats = new Stats();
const videoReader = new VideoReader(videoPath, FPS);
// let canvasRecorder: CanvasRecorder;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  await videoReader.init();

  new p5((p_) => {
    p = p_;
    p.setup = setup;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  p.pixelDensity(1);

  const frame = videoReader.read();
  const pContext: CanvasRenderingContext2D = p.drawingContext;
  pContext.putImageData(frame, 0, 0);

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);
  // canvasRecorder = new CanvasRecorder(p.canvas, videoReader.video.duration * 1000, FPS);
  // canvasRecorder.start();
  // canvasRecorder.onEnded = () => {
  //   console.log('record ended');
  // };

  draw(true);
}



async function draw(loop = false) {
  if (videoReader.video.ended) {
    console.log('video ended');
    // canvasRecorder.capture();
    return;
  }

  if (ENABLE_STATS) stats.begin();

  await videoReader.nextFrame();
  const frame = videoReader.read();
  console.log(videoReader.video.currentTime);

  // Random skip bits
  p.loadPixels();
  let j = 0;
  const asd = Math.random() * 0.00001;
  frame.data.forEach((val, i) => {
    if (Math.random() < asd) return;
    p.pixels[j] = val;
    j++;
  });
  p.updatePixels();

  if (ENABLE_STATS) stats.end();
  // canvasRecorder.capture();
  loop && requestAnimationFrame(draw);
}
// (window as any).go = draw;


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  p.resizeCanvas(width, height);
}


/**
 * Clean your shit
 */
function dispose() {
  resizer.destroy();
  p.remove();
  p = null;

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
