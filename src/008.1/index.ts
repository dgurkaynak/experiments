import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import Clock from '../utils/clock';


/**
 * Constants
 */
const ENABLE_STATS = true;
const PADDING_RATIO = { TOP: 0.15, RIGHT: 0.15, BOTTOM: 0.15, LEFT: 0.15 };
const CIRCLE_COUNT = 25;
const LINE_WIDTH = 3;
const CIRCLE_MIN_RADIUS = 50;
const CIRCLE_DRAW_SAMPLE_ANGLE = Math.PI / 10;
const NOISE_X_CLOCK_FACTOR = 0.4;
const NOISE_X_STEP = 0.40;
const NOISE_Y_STEP = 0.125;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();
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
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  p.pixelDensity(1);
  p.frameRate(30);
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background(0);
    p.noFill();
    p.strokeWeight(LINE_WIDTH);
    p.stroke(255, 255, 255);

    const padding = {
      top: resizer.height * PADDING_RATIO.TOP,
      right: resizer.width * PADDING_RATIO.RIGHT,
      bottom: resizer.height * PADDING_RATIO.BOTTOM,
      left: resizer.width * PADDING_RATIO.LEFT
    };
    const baseX = clock.getElapsedTime() * NOISE_X_CLOCK_FACTOR;
    const radiusMarginX = (((resizer.width - padding.left - padding.right) / 2) - CIRCLE_MIN_RADIUS) / (CIRCLE_COUNT - 1);
    const radiusMarginY = (((resizer.height - padding.top - padding.bottom) / 2) - CIRCLE_MIN_RADIUS) / (CIRCLE_COUNT - 1);
    const radiusMargin = Math.min(radiusMarginX, radiusMarginY);
    const center = {
      x: resizer.width / 2,
      y: resizer.height / 2
    };

    times(CIRCLE_COUNT, (i) => {
      p.beginShape();

      const radius = CIRCLE_MIN_RADIUS + radiusMargin * i;
      const sampleCount = 2 * Math.PI / CIRCLE_DRAW_SAMPLE_ANGLE;
      times(sampleCount + 3, (j) => {
        const angle = j * CIRCLE_DRAW_SAMPLE_ANGLE;
        const noise = p.noise(
          baseX + NOISE_X_STEP * (j % sampleCount), // Continunity
          NOISE_Y_STEP * i
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
