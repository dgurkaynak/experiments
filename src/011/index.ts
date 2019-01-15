import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './yt_cgm5nEdnuhE.mp4';
import oflow from 'oflow';
import CanvasRecorder from '../utils/canvas-recorder';



/**
 * Constants
 */
const VIDEO_SIZE = [1280, 720];
const FPS = 30;
const ZONE_SIZE = 1;
const BG_ALPHA = 50; // max 255
const STROKE_WIDTH = 1;
const STROKE_ALPHA = 200; // max 255
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
const flowCalculator = new oflow.FlowCalculator(ZONE_SIZE);
let frame: ImageData;
let canvasRecorder: CanvasRecorder;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  await videoReader.init();
  // videoReader.video.currentTime = 60;

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

  frame = videoReader.read();
  p.background('#000000');

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);
  canvasRecorder = new CanvasRecorder(p.canvas, videoReader.video.duration * 1000, FPS);
  // canvasRecorder = new CanvasRecorder(p.canvas, 60000, FPS);
  // canvasRecorder.start();
  canvasRecorder.onEnded = () => {
    console.log('record ended');
  };

  // draw();
}



async function draw() {
  if (videoReader.video.ended) {
    console.log('video ended');
    canvasRecorder.capture();
    return;
  }

  if (ENABLE_STATS) stats.begin();

  const prevFrame = frame;
  await videoReader.nextFrame();
  frame = videoReader.read();
  console.log(videoReader.video.currentTime);

  const flow = flowCalculator.calculate(prevFrame.data, frame.data, frame.width, frame.height);

  p.background(p.color(0, 0, 0, BG_ALPHA));
  flow.zones.forEach((zone) => {
    // const shouldSkip = Math.abs(zone.u) < DISPLACEMENT_THRESHOLD || Math.abs(zone.v) < DISPLACEMENT_THRESHOLD;
    // if (shouldSkip) return;

    const i = (zone.y * frame.width + zone.x) * 4;
    const color = p.color(frame.data[i + 0], frame.data[i + 1], frame.data[i + 2], STROKE_ALPHA);
    p.stroke(color);
    p.strokeWeight(STROKE_WIDTH);
    p.line(zone.x, zone.y, zone.x - zone.u, zone.y + zone.v);
  });


  if (ENABLE_STATS) stats.end();
  canvasRecorder.capture();
  requestAnimationFrame(draw);
}
(window as any).go = draw;


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  p.resizeCanvas(width, height);
}


function spatial2index(x: number, y: number, width: number, height: number) {
  return y * width + x;
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
