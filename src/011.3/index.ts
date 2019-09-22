import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import CanvasResizer from '../utils/canvas-resizer';
import saveImage from '../utils/canvas-save-image';
import VideoReader from '../utils/video-reader';
import videoPath from './rotate_hd_1280_lossless.mp4';
import isBoolean from 'lodash/isBoolean';



/**
 * Constants
 */
const ENABLE_STATS = true;
const VIDEO_SIZE = [1280, 720];


const GUISettings = class {
  fps = 30;
  lineHeight = 5;
  sinPeriod = 20;

  saveImage = async () => {
    saveImage(resizer.canvas);
  }

  play = () => {
    shouldStop = true;
    setTimeout(async () => {
      shouldStop = false;
      await videoReader.jumpToBegining();
      const pContext: CanvasRenderingContext2D = (p as any).drawingContext;
      pContext.drawImage(videoReader.canvas, 0, 0);
      draw(true);
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
let frameCounter = 0;
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
  gui.add(settings, 'lineHeight', 1, 100).step(1);
  gui.add(settings, 'sinPeriod', 1, 30).step(1);
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
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  const frame = videoReader.read();
  const pContext: CanvasRenderingContext2D = (p as any).drawingContext;
  pContext.putImageData(frame, 0, 0);

  p.blendMode(p.DIFFERENCE);

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);

  draw(true);
}



async function draw(loop = false) {
  loop = isBoolean(loop) ? loop : false;

  if (videoReader.video.ended) {
    console.log('video ended');
    return;
  }

  if (ENABLE_STATS) stats.begin();

  await videoReader.nextFrame();
  const frame = videoReader.read();
  console.log('Current time', videoReader.video.currentTime);

  const pContext: CanvasRenderingContext2D = (p as any).drawingContext;
  pContext.putImageData(frame, 0, 0);

  // for every line, reference the center color and apply difference to whole line
  // reference pixel ossilates around the center
  for (let y = 0; y <= frame.height; y = y + settings.lineHeight) {
    // const refX = frame.width / 2;
    const xOffset = Math.round(Math.sin(y / frame.height * 2 * Math.PI + (frameCounter / settings.sinPeriod * Math.PI)) * 100);
    const refX = frame.width / 2 + xOffset;
    const i = spatial2index(refX, y, frame.width, frame.height) * 4;

    const color = p.color(
      frame.data[i + 0],
      frame.data[i + 1],
      frame.data[i + 2]
    );
    p.stroke(color);
    p.strokeCap(p.PROJECT);
    p.strokeWeight(settings.lineHeight);

    p.line(0, y, frame.width - 1, y);
  }

  frameCounter++;
  if (ENABLE_STATS) stats.end();

  if (shouldStop) {
    shouldStop = false;
    return;
  }

  loop && requestAnimationFrame(() => draw(true));
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
