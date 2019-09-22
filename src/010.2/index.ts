import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import CanvasResizer from '../utils/canvas-resizer';
import saveImage from '../utils/canvas-save-image';
import times from 'lodash/times';
import sampleSize from 'lodash/sampleSize';
import throttle from 'lodash/throttle';
import randomColor from 'randomcolor';


/**
 * Constants
 */
const ENABLE_STATS = false;
const MARGIN = [150, 150];

const GUISettings = class {
  gridCount = 5;
  gridSpacing = 75;

  innerGridCount = 25;
  minStrokeWidth = 3;
  maxStrokeWidth = 7;
  lineCount = 3;
  lineCurvePoint = 10;
  lineAlpha = 0.75;

  hue = 'all';
  luminosity = 'light';

  saveImage = () => saveImage(resizer.canvas);
  redraw = () => redrawThrottle();
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
  dimension: [1080, 1080],
  dimensionScaleFactor: 1
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();

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
  gui.add(settings, 'hue', ['all', 'monochrome', 'red', 'orange', 'yellow', 'green', 'blue','purple', 'pink', 'random']).onChange(redrawThrottle);
  gui.add(settings, 'luminosity', ['all', 'light', 'dark', 'random']).onChange(redrawThrottle);
  gui.add(settings, 'saveImage');
  gui.add(settings, 'redraw');
  gui.close();

  configure();
}


const redrawThrottle = throttle(() => {
  configure();
  p.loop();
}, 250);


function configure() {
  coords = [];
  const gridWidth = (resizer.width - (2 * MARGIN[0]) - ((settings.gridCount - 1) * settings.gridSpacing)) / settings.gridCount;
  const gridHeight = (resizer.height - (2 * MARGIN[1]) - ((settings.gridCount - 1) * settings.gridSpacing)) / settings.gridCount;
  for (let y = 0; y < settings.gridCount; y++) {
    for (let x = 0; x < settings.gridCount; x++) {
      const minX = MARGIN[0] + (x * (gridWidth + settings.gridSpacing));
      const minY = MARGIN[1] + (y * (gridHeight + settings.gridSpacing));
      coords.push({
        x: times(settings.innerGridCount, i => p.lerp(minX, minX + gridWidth, i / settings.innerGridCount)),
        y: times(settings.innerGridCount, i => p.lerp(minY, minY + gridHeight, i / settings.innerGridCount))
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


    times(settings.lineCount, (i) => {
      const xCoords = sampleSize(x, settings.lineCurvePoint);
      const yCoords = sampleSize(y, settings.lineCurvePoint);

      const color = randomColor({
        format: 'rgba',
        hue: settings.hue == 'all' ? null : settings.hue,
        luminosity: settings.luminosity == 'all' ? null : settings.luminosity,
        alpha: settings.lineAlpha
      });
      p.stroke(color);
      p.strokeWeight(p.lerp(settings.maxStrokeWidth, settings.minStrokeWidth, Math.pow(i / settings.lineCount, 1 / 3)));

      // p.line(xCoords[0], yCoords[0], xCoords[1], yCoords[1]);

      p.noFill();
      p.beginShape();
      times(settings.lineCurvePoint, i => p.curveVertex(xCoords[i], yCoords[i]));
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
