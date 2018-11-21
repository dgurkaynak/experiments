import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
// import sample from 'lodash/sample';
import Clock from '../utils/clock';
// import colors from 'nice-color-palettes';


// Random color selection
// const COLOR_PALETTE = sample(colors);
// const COLORS = {
//   BG: sample(COLOR_PALETTE),
//   UP: sample(COLOR_PALETTE),
//   DOWN: sample(COLOR_PALETTE)
// };
// console.log(COLORS);


/**
 * Constants
 */
const ENABLE_STATS = true;
const COLORS = [ // Some pre-selected colors
  {BG: "#f1edd0", UP: "#f38a8a", DOWN: "#55443d"},
  {BG: "#151101", UP: "#b3204d", DOWN: "#edf6ee"},
  {BG: "#edf6ee", UP: "#b3204d", DOWN: "#151101"},
  {BG: "#3b2d38", UP: "#f02475", DOWN: "#f27435"},
  {BG: "#f7e4be", UP: "#b38184", DOWN: "#f0b49e"},
][3];
const PADDING_RATIO = { TOP: 0.15, RIGHT: 0.15, BOTTOM: 0.15, LEFT: 0.15 };
const LINE_COUNT = 50;
const HORIZONTAL_SAMPLE_COUNT = 30;
const LINE_WIDTH = 3;
const NOISE_X_STEP = 0.20;
const NOISE_X_CLOCK_FACTOR = 0.4;
const NOISE_Y_STEP = 0.125;
const NOISE_Y_INFLUENCE = 17;
const LEFT_RIGHT_DAMPING_FACTOR = 3;


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

  p.background(COLORS.BG);
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
  const lineVerticalMargin = (resizer.height - padding.top - padding.bottom) / (LINE_COUNT - 1);
  const horizontalSampleWidth = (resizer.width - padding.left - padding.right) / (HORIZONTAL_SAMPLE_COUNT - 1);

  times(LINE_COUNT, (i) => {
    p.beginShape();

    const color = p.lerpColor(
      p.color(COLORS.UP),
      p.color(COLORS.DOWN),
      p.map(i, 0, LINE_COUNT, 0, 1)
    );
    p.stroke(color);

    const baseY = padding.top + (lineVerticalMargin * i);
    times(HORIZONTAL_SAMPLE_COUNT, (j) => {
      const x = padding.left + (horizontalSampleWidth * j);

      const noise = p.noise(
        baseX + NOISE_X_STEP * j,
        NOISE_Y_STEP * i
      );
      const offsetY = (noise - 0.5) * lineVerticalMargin * NOISE_Y_INFLUENCE;

      const dampingFactorLeft = 1 - (1 / Math.pow(Math.E, j / HORIZONTAL_SAMPLE_COUNT * LEFT_RIGHT_DAMPING_FACTOR));
      const dampingFactorRight = 1 - (1 / Math.pow(Math.E, (1 - (j / HORIZONTAL_SAMPLE_COUNT)) * LEFT_RIGHT_DAMPING_FACTOR));

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
