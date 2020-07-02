// Global deps:
// - p5
// - stats.js
// - dat.gui
// - lodash (times, sampleSize, throttle)
// - randomColor

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { saveImage } from '../lib/canvas-helper.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const MARGIN = [150, 150];

const GUISettings = class {
  constructor() {
    this.gridCount = 5;
    this.gridSpacing = 75;

    this.innerGridCount = 25;
    this.minStrokeWidth = 3;
    this.maxStrokeWidth = 7;
    this.lineCount = 3;
    this.lineCurvePoint = 10;
    this.lineAlpha = 0.75;

    this.hue = 'all';
    this.luminosity = 'light';
  }

  saveImage() {
    saveImage(resizer.canvas);
  }

  redraw() {
    redrawThrottle();
  }
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
  dimension: [1080, 1080],
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();

let coords;

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

  // Settings
  gui.add(settings, 'gridCount', 1, 20).step(1).onChange(redrawThrottle);
  gui.add(settings, 'gridSpacing', 10, 100).step(1).onChange(redrawThrottle);
  gui.add(settings, 'innerGridCount', 3, 50).step(1).onChange(redrawThrottle);
  gui.add(settings, 'minStrokeWidth', 1, 5).step(1).onChange(redrawThrottle);
  gui.add(settings, 'maxStrokeWidth', 5, 15).step(1).onChange(redrawThrottle);
  gui.add(settings, 'lineCount', 1, 10).step(1).onChange(redrawThrottle);
  gui.add(settings, 'lineCurvePoint', 3, 25).step(1).onChange(redrawThrottle);
  gui.add(settings, 'lineAlpha', 0.1, 1.0).step(0.01).onChange(redrawThrottle);
  gui
    .add(settings, 'hue', [
      'all',
      'monochrome',
      'red',
      'orange',
      'yellow',
      'green',
      'blue',
      'purple',
      'pink',
      'random',
    ])
    .onChange(redrawThrottle);
  gui
    .add(settings, 'luminosity', ['all', 'light', 'dark', 'random'])
    .onChange(redrawThrottle);
  gui.add(settings, 'saveImage');
  gui.add(settings, 'redraw');
  gui.close();

  configure();
}

const redrawThrottle = _.throttle(() => {
  configure();
  p.loop();
}, 250);

function configure() {
  coords = [];
  const gridWidth =
    (resizer.width -
      2 * MARGIN[0] -
      (settings.gridCount - 1) * settings.gridSpacing) /
    settings.gridCount;
  const gridHeight =
    (resizer.height -
      2 * MARGIN[1] -
      (settings.gridCount - 1) * settings.gridSpacing) /
    settings.gridCount;
  for (let y = 0; y < settings.gridCount; y++) {
    for (let x = 0; x < settings.gridCount; x++) {
      const minX = MARGIN[0] + x * (gridWidth + settings.gridSpacing);
      const minY = MARGIN[1] + y * (gridHeight + settings.gridSpacing);
      coords.push({
        x: _.times(settings.innerGridCount, (i) =>
          p.lerp(minX, minX + gridWidth, i / settings.innerGridCount)
        ),
        y: _.times(settings.innerGridCount, (i) =>
          p.lerp(minY, minY + gridHeight, i / settings.innerGridCount)
        ),
      });
    }
  }
}

/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background('#ffffff');
  coords.forEach(({ x, y }) => {
    // p.stroke('#000');
    // x.forEach((elX) => {
    //   y.forEach((elY) => {
    //     p.line(elX, elY, elX + 1, elY + 1);
    //   });
    // });

    _.times(settings.lineCount, (i) => {
      const xCoords = _.sampleSize(x, settings.lineCurvePoint);
      const yCoords = _.sampleSize(y, settings.lineCurvePoint);

      const color = randomColor({
        format: 'rgba',
        hue: settings.hue == 'all' ? null : settings.hue,
        luminosity: settings.luminosity == 'all' ? null : settings.luminosity,
        alpha: settings.lineAlpha,
      });
      p.stroke(color);
      p.strokeWeight(
        p.lerp(
          settings.maxStrokeWidth,
          settings.minStrokeWidth,
          Math.pow(i / settings.lineCount, 1 / 3)
        )
      );

      // p.line(xCoords[0], yCoords[0], xCoords[1], yCoords[1]);

      p.noFill();
      p.beginShape();
      _.times(settings.lineCurvePoint, (i) =>
        p.curveVertex(xCoords[i], yCoords[i])
      );
      p.endShape();
    });
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
