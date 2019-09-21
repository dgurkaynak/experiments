import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import Clock from '../utils/clock';
import colors from 'nice-color-palettes';
import sampleSize from 'lodash/sampleSize';


/**
 * Constants
 */
const ENABLE_STATS = false;
const PADDING_RATIO = { TOP: 0.15, RIGHT: 0.15, BOTTOM: 0.15, LEFT: 0.15 };

const GUISettings = class {
  // Some favs:
  // #7fc7af #ff3d7f #3fb8af
  // #ffedbf #f7803c #f54828
  // #fffcdd #f5a2a2 #dcf7f3
  bgColor = '#ffedbf';
  lineColorOut = '#f7803c';
  lineColorIn = '#f54828';

  lineCount = 100;
  lineControlPoint = 30;
  lineWidth = 1;
  minRadius = 1;

  noiseSpeed = 0.4;
  noiseXStep = 0.20;
  noiseYStep = 0.03;

  randomizeColors = () => {
    const randomTwoColors = sampleSize(sampleSize(colors, 1)[0], 3);
    settings.bgColor = randomTwoColors[0];
    settings.lineColorOut = randomTwoColors[1];
    settings.lineColorIn = randomTwoColors[2];
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
  dimension: [1024, 1024],
  dimensionScaleFactor: 1
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
  lineSettings.add(settings, 'minRadius', 1, 250).step(1);

  const noiseSettings = gui.addFolder('Noise');
  noiseSettings.add(settings, 'noiseSpeed', 0.1, 1).step(0.1);
  noiseSettings.add(settings, 'noiseXStep', 0.01, 1).step(0.01);
  noiseSettings.add(settings, 'noiseYStep', 0.01, 1).step(0.01);

  const viewSettings = gui.addFolder('View');
  viewSettings.addColor(settings, 'bgColor').listen();
  viewSettings.addColor(settings, 'lineColorOut').listen();
  viewSettings.addColor(settings, 'lineColorIn').listen();
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
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
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
    left: resizer.width * PADDING_RATIO.LEFT
  };
  const baseX = clock.getElapsedTime() * settings.noiseSpeed;
  const radiusMarginX = (((resizer.width - padding.left - padding.right) / 2) - settings.minRadius) / (settings.lineCount - 1);
  const radiusMarginY = (((resizer.height - padding.top - padding.bottom) / 2) - settings.minRadius) / (settings.lineCount - 1);
  const radiusMargin = Math.min(radiusMarginX, radiusMarginY);
  const center = {
    x: resizer.width / 2,
    y: resizer.height / 2
  };

  times(settings.lineCount, (i) => {
    p.beginShape();

    const color = p.lerpColor(
      p.color(settings.lineColorIn),
      p.color(settings.lineColorOut),
      p.map(i, 0, settings.lineCount, 0, 1)
    );
    p.stroke(color);

    const radius = settings.minRadius + radiusMargin * i;
    const sampleCount = 2 * Math.PI / (Math.PI / settings.lineControlPoint);
    times(sampleCount + 3, (j) => {
      const angle = j * (Math.PI / settings.lineControlPoint);
      const noise = p.noise(
        baseX + settings.noiseXStep * (j % sampleCount), // Continunity
        settings.noiseYStep * i
      );
      const noiseMapped = p.map(noise, 0, 1, 0.75, 1.25);
      const x = center.x + radius * Math.cos(angle) * noiseMapped;
      const y = center.y + radius * Math.sin(angle) * noiseMapped;

      p.curveVertex(x, y);
    });

    p.endShape();
  });

  if (ENABLE_STATS) stats.end();
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
