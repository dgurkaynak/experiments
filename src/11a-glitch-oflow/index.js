// Global deps:
// - p5
// - stats.js
// - dat.gui
// - oflow

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { VideoReader } from '../lib/video-reader.js';

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
  };

  stop = () => {
    cancelAnimationFrame(rAF);
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
const videoReader = new VideoReader('./yt_cgm5nEdnuhE.mp4', settings.fps);
let flowCalculator = new oflow.FlowCalculator(settings.zoneSize);
let frame;

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
  gui
    .add(settings, 'zoneSize', 1, 30)
    .step(1)
    .onChange((val) => {
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
  const renderer = p.createCanvas(resizer.width, resizer.height);
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

let rAF;
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

  const flow = flowCalculator.calculate(
    prevFrame.data,
    frame.data,
    frame.width,
    frame.height
  );

  p.background(p.color(0, 0, 0, settings.bgAlpha));
  flow.zones.forEach((zone) => {
    // const shouldSkip = Math.abs(zone.u) < DISPLACEMENT_THRESHOLD || Math.abs(zone.v) < DISPLACEMENT_THRESHOLD;
    // if (shouldSkip) return;

    const i = (zone.y * frame.width + zone.x) * 4;
    const color = p.color(
      frame.data[i + 0],
      frame.data[i + 1],
      frame.data[i + 2],
      settings.strokeAlpha
    );
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
