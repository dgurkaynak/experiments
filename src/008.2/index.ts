import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import Clock from '../utils/clock';
// import colors from 'nice-color-palettes';
// import sample from 'lodash/sample';


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
const COLORS = [ // Some selected colors
  {BG: "#000000", UP: "#ffffff", DOWN: "#ffffff"},
  {BG: "#8b7a5e", UP: "#d0ecea", DOWN: "#fffee4"},
  {BG: "#f8fcc1", UP: "#e6781e", DOWN: "#1693a7"},
  {BG: "#363636", UP: "#474747", DOWN: "#e8175d"},
  {BG: "#f1efa5", UP: "#60b99a", DOWN: "#f77825"},
  {BG: "#fdf1cc", UP: "#987f69", DOWN: "#fcd036"},
  {BG: "#f8b195", UP: "#355c7d", DOWN: "#f67280"},
  {BG: "#031634", UP: "#036564", DOWN: "#cdb380"},
  {BG: "#f4ead5", UP: "#d68189", DOWN: "#c6e5d9"},
  {BG: "#e8d5b7", UP: "#0e2430", DOWN: "#fc3a51"},
  {BG: "#fdf1cc", UP: "#e3ad40", DOWN: "#c6d6b8"},
  {BG: "#615375", UP: "#f9bf76", DOWN: "#e5625c"},
  {BG: "#f03c02", UP: "#6b0103", DOWN: "#a30006"},
  {BG: "#f0f0d8", UP: "#604848", DOWN: "#c0d860"},
][12];
const RADIUS = 400;
const Y_FACTOR = 0.1;
const LINE_WIDTH = 3;
const CIRCLE_DRAW_SAMPLE_ANGLE = Math.PI / 10;
const NOISE_X_CLOCK_FACTOR = 0.4; // 0.2
const NOISE_X_STEP = 2.5;
const Y_STEP = 10; // 5
const Y_NEGATIVE_OFFSET = 50;


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
  // p.frameRate(30);
  p.background(COLORS.BG);
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.noFill();
  p.strokeWeight(LINE_WIDTH);

  const color = p.lerpColor(
    p.color(COLORS.UP),
    p.color(COLORS.DOWN),
    i / resizer.height
  );
  // p.stroke(255, 255, 255);
  p.stroke(color);

  if (i > resizer.height + (2 * Y_NEGATIVE_OFFSET)) {
    console.log('end');
    p.noLoop();
    return;
  }

  const baseX = clock.getElapsedTime() * NOISE_X_CLOCK_FACTOR;
  const center = {
    x: resizer.width / 2,
    y: resizer.height + Y_NEGATIVE_OFFSET - i
  };

  p.beginShape();

  const sampleCount = 2 * Math.PI / CIRCLE_DRAW_SAMPLE_ANGLE;
  times(sampleCount + 3, (j) => {
    const angle = j * CIRCLE_DRAW_SAMPLE_ANGLE;
    const noise = p.noise(baseX + NOISE_X_STEP * (j % sampleCount));
    const noiseMapped = p.map(noise, 0, 1, 0, 2);
    const x = center.x + RADIUS * Math.cos(angle) * noiseMapped;
    const y = center.y + RADIUS * Math.sin(angle) * noiseMapped * Y_FACTOR;

    p.curveVertex(x, y);
  });

  p.endShape();

  i += Y_STEP;

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
