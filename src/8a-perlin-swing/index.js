// Global deps
// - p5
// - stats.js
// - dat.gui
// - lodash (times,sampleSize)
// - nice-color-palettes

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Clock } from '../lib/clock.js';

/**
 * Constants
 */
const ENABLE_STATS = false;

const PADDING_RATIO = { TOP: 0.15, RIGHT: 0.15, BOTTOM: 0.15, LEFT: 0.15 };

const GUISettings = class {
  bgColor = '#3b2d38';
  lineColorUp = '#f02475';
  lineColorDown = '#f27435';

  lineCount = 100;
  lineControlPoint = 50;
  lineWidth = 1;

  noiseSpeed = 0.4;
  noiseXStep = 0.2;
  noiseYStep = 0.075;
  noiseYFactor = 30;
  dampingFactor = 3;

  randomizeColors = () => {
    const randomTwoColors = _.sampleSize(_.sampleSize(niceColorPalettes100, 1)[0], 3);
    settings.bgColor = randomTwoColors[0];
    settings.lineColorUp = randomTwoColors[1];
    settings.lineColorDown = randomTwoColors[2];
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
  dimension: [1024, 1024],
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const clock = new Clock();

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
  gui.close();

  const lineSettings = gui.addFolder('Line');
  lineSettings.add(settings, 'lineCount', 10, 500).step(1);
  lineSettings.add(settings, 'lineControlPoint', 5, 100).step(1);
  lineSettings.add(settings, 'lineWidth', 1, 10).step(1);

  const noiseSettings = gui.addFolder('Noise');
  noiseSettings.add(settings, 'noiseSpeed', 0.1, 1).step(0.1);
  noiseSettings.add(settings, 'noiseXStep', 0.01, 1).step(0.01);
  noiseSettings.add(settings, 'noiseYStep', 0.01, 1).step(0.01);
  noiseSettings.add(settings, 'noiseYFactor', 5, 100).step(1);
  noiseSettings.add(settings, 'dampingFactor', 0.1, 10).step(0.1);

  const viewSettings = gui.addFolder('View');
  viewSettings.addColor(settings, 'bgColor').listen();
  viewSettings.addColor(settings, 'lineColorUp').listen();
  viewSettings.addColor(settings, 'lineColorDown').listen();
  viewSettings.add(settings, 'randomizeColors');

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

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();
}

/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background(settings.bgColor);
  p.noFill();
  p.strokeWeight(settings.lineWidth);
  p.stroke(255, 255, 255);

  const padding = {
    top: resizer.height * PADDING_RATIO.TOP,
    right: resizer.width * PADDING_RATIO.RIGHT,
    bottom: resizer.height * PADDING_RATIO.BOTTOM,
    left: resizer.width * PADDING_RATIO.LEFT,
  };
  const baseX = clock.getElapsedTime() * settings.noiseSpeed;
  const lineVerticalMargin =
    (resizer.height - padding.top - padding.bottom) / (settings.lineCount - 1);
  const horizontalSampleWidth =
    (resizer.width - padding.left - padding.right) /
    (settings.lineControlPoint - 1);

  _.times(settings.lineCount, (i) => {
    p.beginShape();

    const color = p.lerpColor(
      p.color(settings.lineColorUp),
      p.color(settings.lineColorDown),
      p.map(i, 0, settings.lineCount, 0, 1)
    );
    p.stroke(color);

    const baseY = padding.top + lineVerticalMargin * i;
    _.times(settings.lineControlPoint, (j) => {
      const x = padding.left + horizontalSampleWidth * j;

      const noise = p.noise(
        baseX + settings.noiseXStep * j,
        settings.noiseYStep * i
      );
      const offsetY =
        (noise - 0.5) * lineVerticalMargin * settings.noiseYFactor;

      const dampingFactorLeft =
        1 -
        1 /
          Math.pow(
            Math.E,
            (j / settings.lineControlPoint) * settings.dampingFactor
          );
      const dampingFactorRight =
        1 -
        1 /
          Math.pow(
            Math.E,
            (1 - j / settings.lineControlPoint) * settings.dampingFactor
          );

      const y = baseY + offsetY * dampingFactorLeft * dampingFactorRight;
      p.curveVertex(x, y);
    });

    p.endShape();
  });

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
