import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './rotate_hd_1280_lossless.mp4';
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
let frameCounter = 0;



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

  p.blendMode(p.DIFFERENCE);

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

  const pContext: CanvasRenderingContext2D = p.drawingContext;
  pContext.putImageData(frame, 0, 0);



  // draw horizontal difference line random to random
  // DO NOT FORGET => p.blendMode(p.DIFFERENCE);
  // for (let y = 0; y <= frame.height; y++) {
  //   if (Math.random() < 0.25) continue;

  //   const x = Math.floor(Math.random() * frame.width);
  //   const i = spatial2index(x, y, frame.width, frame.height) * 4;

  //   const color = p.color(
  //     frame.data[i + 0],
  //     frame.data[i + 1],
  //     frame.data[i + 2]
  //   );
  //   p.stroke(color);
  //   p.strokeCap(p.PROJECT);
  //   p.strokeWeight(3 + Math.floor(Math.random() * 5));
  //   p.line(x, y, randomIntegerBetween(x, frame.width - 1), y);
  // }



  // for every line, reference the center color and apply difference to whole line
  // reference pixel ossilates around the center
  // DO NOT FORGET => p.blendMode(p.DIFFERENCE);
  const LINE_HEIGHT = 1;
  // const LINE_HEIGHT = 3 + Math.floor(Math.random() * 10);
  for (let y = 0; y <= frame.height; y = y + LINE_HEIGHT) {
    // const refX = frame.width / 2;
    const xOffset = Math.round(Math.sin(y / frame.height * 2 * Math.PI + (frameCounter / 20 * Math.PI)) * 100);
    const refX = frame.width / 2 + xOffset;
    const i = spatial2index(refX, y, frame.width, frame.height) * 4;

    const color = p.color(
      frame.data[i + 0],
      frame.data[i + 1],
      frame.data[i + 2]
    );
    p.stroke(color);
    p.strokeCap(p.PROJECT);
    p.strokeWeight(LINE_HEIGHT);
    p.line(0, y, frame.width - 1, y);
  }



  frameCounter++;
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


function spatial2index(x: number, y: number, width: number, height: number) {
  return y * width + x;
}


function randomIntegerBetween(a: number, b: number) {
  return Math.round(a + Math.random() * (b - a));
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
