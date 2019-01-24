import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import sampleSize from 'lodash/sampleSize';
import randomColor from 'randomcolor';
import Entity from '../010/entity/line-curve';


/**
 * Constants
 */
const ENABLE_STATS = true;
const MARGIN = [150, 150];
const SAMPLE_COUNT = [25, 25];
const STROKE_WIDTH_RANGE = { MIN: 3, MAX: 7 };
const LINE_COUNT = 3;
const LINE_POINT_CURVE_COUNT = 10;
const LINE_ALPHA = 0.75;
const GRID = [5, 5];
const GRID_SPACING = [75, 75];


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: [1080, 1080],
  dimensionScaleFactor: 1
});
const stats = new Stats();

let coords: {x: number[], y: number[]}[];



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

  // p.pixelDensity(1);

  coords = [];
  const gridWidth = (resizer.width - (2 * MARGIN[0]) - ((GRID[0] - 1) * GRID_SPACING[0])) / GRID[0];
  const gridHeight = (resizer.height - (2 * MARGIN[1]) - ((GRID[1] - 1) * GRID_SPACING[1])) / GRID[1];
  for (let y = 0; y < GRID[1]; y++) {
    for (let x = 0; x < GRID[0]; x++) {
      const minX = MARGIN[0] + (x * (gridWidth + GRID_SPACING[0]));
      const minY = MARGIN[1] + (y * (gridHeight + GRID_SPACING[1]));
      coords.push({
        x: times(SAMPLE_COUNT[0], i => p.lerp(minX, minX + gridWidth, i / SAMPLE_COUNT[0])),
        y: times(SAMPLE_COUNT[1], i => p.lerp(minY, minY + gridHeight, i / SAMPLE_COUNT[1]))
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
  coords.forEach(({x, y}) => {
    // p.stroke('#000');
    // x.forEach((elX) => {
    //   y.forEach((elY) => {
    //     p.line(elX, elY, elX + 1, elY + 1);
    //   });
    // });


    times(LINE_COUNT, (i) => {
      const xCoords = sampleSize(x, LINE_POINT_CURVE_COUNT);
      const yCoords = sampleSize(y, LINE_POINT_CURVE_COUNT);

      const color = randomColor({
        format: 'rgba',
        // hue: 'blue',
        luminosity: 'light',
        alpha: LINE_ALPHA
      });
      p.stroke(color);
      p.strokeWeight(p.lerp(STROKE_WIDTH_RANGE.MAX, STROKE_WIDTH_RANGE.MIN, Math.pow(i / LINE_COUNT, 1 / 3)));

      // p.line(xCoords[0], yCoords[0], xCoords[1], yCoords[1]);

      p.noFill();
      p.beginShape();
      times(LINE_POINT_CURVE_COUNT, i => p.curveVertex(xCoords[i], yCoords[i]));
      p.endShape();
    });


  });

  p.noLoop();

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
