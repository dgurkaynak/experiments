// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Matter from 'matter-js';
import * as opentype from 'opentype.js';
import Line from '../009/line';
// import sample from 'lodash/sample';
// import sampleSize from 'lodash/sampleSize';
// import colors from 'nice-color-palettes';
import * as colorHelper from '../utils/color-helper';

import fontPath from './ModernSans-Light.otf';


// const PALETTE = sampleSize(sample(colors), 3);
// const COLORS = {
//   BG: PALETTE[0],
//   FONT_UP: PALETTE[1],
//   FONT_DOWN: PALETTE[2]
// };
// console.log(COLORS);


/**
 * Constants
 */
const ENABLE_STATS = true;
const TEXT = [
  'I CAN ONLY',
  'NOTE THAT',
  'THE PAST IS',
  'BEAUTIFUL',
  'BECAUSE',
  'ONE NEVER',
  'REALIZES',
  'AN EMOTION',
  'AT THE TIME,',
  'IT EXPANDS',
  'LATER,',
  'AND THUS',
  'WE DON\'T',
  'HAVE COMPLETE',
  'EMOTIONS',
  'ABOUT',
  'THE PRESENT,',
  'ONLY ABOUT',
  'THE PAST.'
];
const LINE_HEIGHT = 150;
const COLORS = [ // Selected colors
  {BG: "#F9F6F1", FONT_UP: "#000000", FONT_DOWN: "#000000"},
  {BG: "#000000", FONT_UP: "#ffffff", FONT_DOWN: "#ffffff"},
  {BG: "#f03c02", FONT_UP: "#a30006", FONT_DOWN: "#6b0103"},
  {BG: "#1c0113", FONT_UP: "#c21a01", FONT_DOWN: "#a30006"},
  {BG: "#fff7bd", FONT_UP: "#f2f26f", FONT_DOWN: "#f04155"},
][0];
const DROP_INTERVAL = 750;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const resizer = new CanvasResizer(null, { dimension: 'fullscreen' });
const two = new Two({
  type: Two.Types.canvas,
  width: resizer.width,
  height: resizer.height,
  ratio: window.devicePixelRatio
});
const stats = new Stats();
const animator = new Animator(animate);


/**
 * Experiment variables
 */
const lines: Line[] = [];
const engine = Matter.Engine.create({ enableSleeping: true });
// const render = Matter.Render.create({ engine, element: elements.container });


/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  two.appendTo(elements.container);
  resizer.canvas = (two as any).renderer.domElement;
  resizer.resize = onWindowResize;
  resizer.init();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  const [ w, h ] = [ resizer.width, resizer.height ];
  const font = await loadFont(fontPath);

  // Background
  const bgRect = two.makeRectangle(w/2, h/2, w, h);
  bgRect.fill = COLORS.BG;
  bgRect.noStroke();

  // Texts
  const lines = TEXT.map((text, i) => {
    const line = new Line(font, text);
    line.init(two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });
    return line;
  });

  addFirstLine(lines, 0, lines.length);

  initWalls();
  initMouseControls();

  two.update();

  animator.start();
}


function addFirstLine(lines_: Line[], i: number, totalLineCount: number) {
  if (lines_.length == 0) return;
  const [ line, ...linesRest ] = lines_;
  const color = colorHelper.lerp(COLORS.FONT_DOWN, COLORS.FONT_UP, i / totalLineCount);

  line.letters.forEach((letter) => {
    (<any>letter.view).fill = color;
    Matter.World.add(engine.world, letter.body);
  });

  lines.push(line);
  setTimeout(() => {
    addFirstLine(linesRest, i + 1, totalLineCount);
  }, DROP_INTERVAL);

  // Make them static after 5 drop_intervals
  // This prevents glitches
  setTimeout(() => {
    line.letters.forEach((letter) => {
      Matter.Body.setStatic(letter.body, true);
    });
  }, DROP_INTERVAL * 5);
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();

  Matter.Engine.update(engine, 1000 / 60);
  // Matter.Render.run(render);
  lines.forEach(line => line.update());
  two.update();

  if (ENABLE_STATS) stats.end();
}

function initWalls() {
  const [ w, h ] = [ resizer.width, resizer.height ];
  const groundLeft = Matter.Bodies.rectangle(-25, h / 2, 50, h, { isStatic: true });
  const groundRight = Matter.Bodies.rectangle(w + 25, h / 2, 50, h, { isStatic: true });
  const groundBottom = Matter.Bodies.rectangle(w / 2, h + 24, w, 50, { isStatic: true });
  Matter.World.add(engine.world, [groundLeft, groundBottom, groundRight]);
}


function initMouseControls() {
  const mouse = Matter.Mouse.create((two as any).renderer.domElement);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: { angularStiffness: 0 }
  });
  Matter.World.add(engine.world, mouseConstraint);
}


function loadFont(path): Promise<opentype.Font> {
  return new Promise((resolve, reject) => {
    opentype.load(path, (err, font) => {
      if (err) return reject(err);
      resolve(font);
    });
  });
}



/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  two.width = width;
  two.height = height;
}


/**
 * Clean your shit
 */
function dispose() {
  animator.dispose();
  resizer.destroy();

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
