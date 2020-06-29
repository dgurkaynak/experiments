// Global deps:
// - p5
// - stats.js
// - lodash (times, sampleSize)
// - randomColor

import { CanvasResizer } from '../lib/canvas-resizer.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const MARGIN = 150;
const SAMPLE_COUNT = 50;
const STROKE_WIDTH_RANGE = { MIN: 5, MAX: 250 };
const LINE_COUNT = 15;
const LINE_POINT_CURVE_COUNT = 5;
const LINE_ALPHA = 1.0;

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p;
const resizer = new CanvasResizer(null, {
  dimension: [1080, 1080],
  dimensionScaleFactor: 1,
});
const stats = new Stats();

let validXCoords;
let validYCoords;

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
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
  const renderer = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  validXCoords = _.times(SAMPLE_COUNT, (i) =>
    p.lerp(MARGIN, resizer.width - MARGIN, i / SAMPLE_COUNT)
  );
  validYCoords = _.times(SAMPLE_COUNT, (i) =>
    p.lerp(MARGIN, resizer.height - MARGIN, i / SAMPLE_COUNT)
  );
}

/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background('#ffffff');
  _.times(LINE_COUNT, (i) => {
    const xCoords = _.sampleSize(validXCoords, LINE_POINT_CURVE_COUNT);
    const yCoords = _.sampleSize(validYCoords, LINE_POINT_CURVE_COUNT);

    const color = randomColor({
      format: 'rgba',
      // hue: 'monochrome',
      luminosity: 'light',
      alpha: LINE_ALPHA,
    });
    p.stroke(color);
    p.strokeWeight(
      p.lerp(
        STROKE_WIDTH_RANGE.MAX,
        STROKE_WIDTH_RANGE.MIN,
        Math.pow(i / LINE_COUNT, 1 / 3)
      )
    );

    // p.line(xCoords[0], yCoords[0], xCoords[1], yCoords[1]);

    p.noFill();
    p.beginShape();
    _.times(LINE_POINT_CURVE_COUNT, (i) => p.curveVertex(xCoords[i], yCoords[i]));
    p.endShape();
  });
  p.noLoop();

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
