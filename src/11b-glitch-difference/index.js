// Global deps
// - p5
// - stats.js
// - dat.gui

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { saveImage } from '../lib/canvas-helper.js';
import { VideoReader } from '../lib/video-reader.js';

/**
 * Constants
 */
const ENABLE_STATS = true;
const VIDEO_SIZE = [1280, 720];

const GUISettings = class {
  fps = 30;
  operation = 'difference';

  saveImage = async () => {
    saveImage(resizer.canvas);
  };

  play = () => {
    shouldStop = true;
    setTimeout(async () => {
      shouldStop = false;
      await videoReader.jumpToBegining();
      const pContext = p.drawingContext;
      pContext.drawImage(videoReader.canvas, 0, 0);
      draw();
    }, 250);
  };

  stop = () => {
    shouldStop = true;
    console.log('Stopped');
  };
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p;
const resizer = new CanvasResizer(null, {
  dimension: VIDEO_SIZE,
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const videoReader = new VideoReader('./yt_VSdnsWANdfA.mp4', settings.fps);
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
  gui
    .add(settings, 'fps', 1, 30)
    .step(1)
    .onChange((val) => videoReader.setFPS(val));
  gui.add(settings, 'operation', ['lighten', 'darken', 'difference']);
  gui.add(settings, 'saveImage');
  gui.add(settings, 'play');
  gui.add(settings, 'stop');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}

/**
 * p5's setup function
 */
function setup() {
  const renderer = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  const pContext = p.drawingContext;
  pContext.drawImage(videoReader.canvas, 0, 0);

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);

  draw();
}

async function draw() {
  if (videoReader.video.ended) {
    console.log('video ended');
    return;
  }
  if (ENABLE_STATS) stats.begin();

  await videoReader.nextFrame();

  const pContext = p.drawingContext;
  const globalCompositeOperation_ = pContext.globalCompositeOperation;
  pContext.globalCompositeOperation = settings.operation;
  pContext.drawImage(videoReader.canvas, 0, 0);
  pContext.globalCompositeOperation = globalCompositeOperation_;

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
function onWindowResize(width, height) {
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
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

main().catch((err) => console.error(err));
