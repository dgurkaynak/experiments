// Global deps
// - p5
// - stats.js
// - dat.gui
// - lodash (times,sampleSize)
// - nice-color-palettes

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Clock } from '../lib/clock.js';
import { saveImage } from '../lib/canvas-helper.js';

/**
 * Constants
 */
const ENABLE_STATS = false;

const Y_NEGATIVE_OFFSET = 250;

const GUISettings = class {
  // Some other favs:
  // #a6f6af #66b6ab #4f2958
  // #cccccc #9f111b #000000
  // #cad7b2 #ebe3aa #5d4157
  // #a8a7a7 #e8175d #363636
  // #e5f04c #a82743 #5c323e
  bgColor = '#dee1b6';
  lineColorUp = '#73c8a9';
  lineColorDown = '#bd5532';

  radius = 300;
  lineControlPoint = 10;
  lineWidth = 1;
  yStep = 3;

  noiseSpeed = 0.2;
  noiseXStep = 1.0;
  noiseYFactor = 0.1;

  randomizeColors = () => {
    const randomTwoColors = _.sampleSize(
      _.sampleSize(niceColorPalettes100, 1)[0],
      3
    );
    settings.bgColor = randomTwoColors[0];
    settings.lineColorUp = randomTwoColors[1];
    settings.lineColorDown = randomTwoColors[2];

    redraw();
  };

  redraw = () => redraw();
  saveImage = () => saveImage(resizer.canvas);
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
  dimension: [1024, 1024],
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const clock = new Clock();
let i = 0;

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  // Settings
  const lineSettings = gui.addFolder('Line');
  lineSettings.add(settings, 'radius', 10, 800).step(1).onChange(redraw);
  lineSettings
    .add(settings, 'lineControlPoint', 5, 25)
    .step(1)
    .onChange(redraw);
  lineSettings.add(settings, 'lineWidth', 1, 10).step(1).onChange(redraw);
  lineSettings.add(settings, 'yStep', 1, 100).step(1).onChange(redraw);

  const noiseSettings = gui.addFolder('Noise');
  noiseSettings.add(settings, 'noiseSpeed', 0.1, 1).step(0.1).onChange(redraw);
  noiseSettings.add(settings, 'noiseXStep', 0.1, 10).step(0.1).onChange(redraw);
  noiseSettings
    .add(settings, 'noiseYFactor', 0.01, 1)
    .step(0.01)
    .onChange(redraw);

  const viewSettings = gui.addFolder('View');
  viewSettings.addColor(settings, 'bgColor').listen().onChange(redraw);
  viewSettings.addColor(settings, 'lineColorUp').listen().onChange(redraw);
  viewSettings.addColor(settings, 'lineColorDown').listen().onChange(redraw);
  viewSettings.add(settings, 'randomizeColors');

  gui.add(settings, 'redraw');
  gui.add(settings, 'saveImage');
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
  p.frameRate(30);
  p.background(settings.bgColor);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();
}

/**
 * Redraw again.
 */
function redraw() {
  p.background(settings.bgColor);
  i = 0;
  p.loop();
}

/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.noFill();
  p.strokeWeight(settings.lineWidth);

  const color = p.lerpColor(
    p.color(settings.lineColorUp),
    p.color(settings.lineColorDown),
    i / resizer.height
  );
  p.stroke(color);

  if (i > resizer.height + 2 * Y_NEGATIVE_OFFSET) {
    console.log('end');
    p.noLoop();
    return;
  }

  const baseX = clock.getElapsedTime() * settings.noiseSpeed;
  const center = {
    x: resizer.width / 2,
    y: resizer.height + Y_NEGATIVE_OFFSET - i,
  };

  p.beginShape();

  const sampleCount = (2 * Math.PI) / (Math.PI / settings.lineControlPoint);
  _.times(sampleCount + 3, (j) => {
    const angle = j * (Math.PI / settings.lineControlPoint);
    const noise = p.noise(baseX + settings.noiseXStep * (j % sampleCount));
    const noiseMapped = p.map(noise, 0, 1, 0, 2);
    const x = center.x + settings.radius * Math.cos(angle) * noiseMapped;
    const y =
      center.y +
      settings.radius * Math.sin(angle) * noiseMapped * settings.noiseYFactor;

    p.curveVertex(x, y);
  });

  p.endShape();

  i += settings.yStep;

  if (ENABLE_STATS) stats.end();
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
