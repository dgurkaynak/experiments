import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './yt_cgm5nEdnuhE.mp4';
import oflow from 'oflow';



/**
 * Constants
 */
const ENABLE_STATS = true;
const VIDEO_SIZE = [1280, 720];

const GUISettings = class {
  fps = 30;
  zoneSize = 1;
  bgAlpha = 50;
  strokeWidth = 1;
  strokeAlpha = 200;

  play = async () => {
    cancelAnimationFrame(rAF);
    await videoReader.jumpToBegining();
    draw();
  }

  stop = () => {
    cancelAnimationFrame(rAF);
    console.log('Stopped');
  }
};


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
const settings = new GUISettings();
const gui = new dat.GUI();
const videoReader = new VideoReader(videoPath, settings.fps);
let flowCalculator = new oflow.FlowCalculator(settings.zoneSize);
let frame: ImageData;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  await videoReader.init();

  new p5((p_) => {
    p = p_;
    p.setup = setup;
  }, elements.container);

  // Settings
  gui.add(settings, 'fps', 1, 30).step(1).onChange(val => videoReader.setFPS(val));
  gui.add(settings, 'zoneSize', 1, 30).step(1).onChange((val) => {
    flowCalculator = new oflow.FlowCalculator(val);
  });
  gui.add(settings, 'bgAlpha', 1, 255).step(1);
  gui.add(settings, 'strokeWidth', 1, 25).step(1);
  gui.add(settings, 'strokeAlpha', 1, 255).step(1);
  gui.add(settings, 'play');
  gui.add(settings, 'stop');
  // gui.close();

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
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  frame = videoReader.read();
  p.background('#000000');

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);

  // draw();
}


let rAF: number;
async function draw() {
  if (videoReader.video.ended) {
    console.log('video ended');
    return;
  }

  if (ENABLE_STATS) stats.begin();

  const prevFrame = frame;
  await videoReader.nextFrame();
  frame = videoReader.read();
  console.log('Current time', videoReader.video.currentTime);

  const flow = flowCalculator.calculate(prevFrame.data, frame.data, frame.width, frame.height);

  p.background(p.color(0, 0, 0, settings.bgAlpha));
  flow.zones.forEach((zone) => {
    // const shouldSkip = Math.abs(zone.u) < DISPLACEMENT_THRESHOLD || Math.abs(zone.v) < DISPLACEMENT_THRESHOLD;
    // if (shouldSkip) return;

    const i = (zone.y * frame.width + zone.x) * 4;
    const color = p.color(frame.data[i + 0], frame.data[i + 1], frame.data[i + 2], settings.strokeAlpha);
    p.stroke(color);
    p.strokeWeight(settings.strokeWidth);
    p.line(zone.x, zone.y, zone.x - zone.u, zone.y + zone.v);
  });


  if (ENABLE_STATS) stats.end();
  rAF = requestAnimationFrame(draw);
}


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
