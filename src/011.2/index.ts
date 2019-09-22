import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './yt_us79TMh5Dkk.mp4';
import oflow from 'oflow';



/**
 * Constants
 */
const VIDEO_SIZE = [1280, 720];
const ENABLE_STATS = true;

const GUISettings = class {
  fps = 30;
  zoneSize = 10;
  displacementThreshold = 1.0;

  play = () => {
    shouldStop = true;
    setTimeout(async () => {
      shouldStop = false;
      await videoReader.jumpToBegining();
      const pContext: CanvasRenderingContext2D = (p as any).drawingContext;
      pContext.drawImage(videoReader.canvas, 0, 0);
      draw();
    }, 250);
  }

  stop = () => {
    shouldStop = true;
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
let shouldStop = false;




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
  gui.add(settings, 'zoneSize', 1, 50).step(1).onFinishChange((val) => {
    flowCalculator = new oflow.FlowCalculator(val);
  });
  gui.add(settings, 'displacementThreshold', 0.1, 2.0).step(0.1);
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
  p.background('#000');
  const pContext: CanvasRenderingContext2D = (p as any).drawingContext;
  pContext.drawImage(videoReader.canvas, 0, 0);

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);

  // draw();
}



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

  // debug
  // flow.zones.forEach((zone) => {
  //   const shouldSkip = Math.abs(zone.u) < settings.displacementThreshold || Math.abs(zone.v) < settings.displacementThreshold;
  //   if (shouldSkip) return;

  //   p.stroke('#ff0000');
  //   p.line(zone.x, zone.y, zone.x - zone.u, zone.y + zone.v);
  // });
  // return;

  flow.zones.forEach((zone) => {
    const shouldSkip = Math.abs(zone.u) < settings.displacementThreshold || Math.abs(zone.v) < settings.displacementThreshold;
    if (shouldSkip) return;

    const targetX = Math.round(zone.x - zone.u);
    const targetY = Math.round(zone.y + zone.v);

    for (let x = targetX - settings.zoneSize; x <= targetX + settings.zoneSize; x++) {
      for (let y = targetY - settings.zoneSize; y <= targetY + settings.zoneSize; y++) {
        const i = spatial2index(x, y, frame.width, frame.height) * 4;
        const color = p.color(
          frame.data[i + 0],
          frame.data[i + 1],
          frame.data[i + 2]
        );
        p.stroke(color);
        p.point(x, y);
      }
    }

  });

  if (ENABLE_STATS) stats.end();

  if (shouldStop) {
    shouldStop = false;
    return;
  }

  requestAnimationFrame(draw);
}


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
