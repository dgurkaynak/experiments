// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Matter from 'matter-js';
import ExperimentTwoJs from '../experiment-twojs';
import CanvasResizer from '../utils/canvas-resizer';
import * as opentype from 'opentype.js';
import Line from './line';
import sample from 'lodash/sample';
import sampleSize from 'lodash/sampleSize';
import colors from 'nice-color-palettes';

import fontPath from './ModernSans-Light.otf';


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
// const PALETTE = sampleSize(sample(colors), 3);
// const COLORS = {
//   BG: PALETTE[0],
//   FONT_UP: PALETTE[1],
//   FONT_DOWN: PALETTE[2]
// };
// console.log(COLORS);
const COLORS = [
  {BG: "#F9F6F1", FONT_UP: "#000000", FONT_DOWN: "#000000"},
  {BG: "#000000", FONT_UP: "#ffffff", FONT_DOWN: "#ffffff"},
  {BG: "#f03c02", FONT_UP: "#a30006", FONT_DOWN: "#6b0103"},
  {BG: "#1c0113", FONT_UP: "#c21a01", FONT_DOWN: "#a30006"},
  {BG: "#fff7bd", FONT_UP: "#f2f26f", FONT_DOWN: "#f04155"},
][0];
const DROP_INTERVAL = 750;


export default class TextPhysics extends ExperimentTwoJs {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen'
  });
  two: Two;
  lines: Line[] = [];

  engine = Matter.Engine.create({
    enableSleeping: true
  });
  // render = Matter.Render.create({
  //   element: this.containerEl,
  //   engine: this.engine
  // });


  constructor() {
    super();

    this.two = new Two({
      type: Two.Types.canvas,
      width: this.canvasResizer.canvasWidth,
      height: this.canvasResizer.canvasHeight,
      ratio: window.devicePixelRatio
    });
  }


  async init() {
    const [ w, h ] = [
      this.canvasResizer.canvasWidth,
      this.canvasResizer.canvasHeight
    ];
    const font = await loadFont(fontPath);

    // Background
    const bgRect = this.two.makeRectangle(w/2, h/2, w, h);
    bgRect.fill = COLORS.BG;
    bgRect.noStroke();

    // Texts
    const lines = TEXT.map((text, i) => {
      const line = new Line(font, text);
      line.init(this.two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });
      return line;
    });

    this.addFirstLine(lines, 0, lines.length);

    this.initWalls();
    this.initMouseControls();

    this.two.update();
    return super.init();
  }


  addFirstLine(lines: Line[], i: number, totalLineCount: number) {
    if (lines.length == 0) return;
    const [ line, ...linesRest ] = lines;
    const color = lerpColor(COLORS.FONT_DOWN, COLORS.FONT_UP, i / totalLineCount);

    line.letters.forEach((letter) => {
      letter.view.fill = color;
      Matter.World.add(this.engine.world, letter.body);
    });

    this.lines.push(line);
    setTimeout(() => {
      this.addFirstLine(linesRest, i + 1, totalLineCount);
    }, DROP_INTERVAL);

    // Make them static after 5 drop_intervals
    // This prevents glitches
    setTimeout(() => {
      line.letters.forEach((letter) => {
        Matter.Body.setStatic(letter.body, true);
      });
    }, DROP_INTERVAL * 5);
  }


  initWalls() {
    const [ w, h ] = [
      this.canvasResizer.canvasWidth,
      this.canvasResizer.canvasHeight
    ];
    const groundLeft = Matter.Bodies.rectangle(-25, h / 2, 50, h, { isStatic: true });
    const groundRight = Matter.Bodies.rectangle(w + 25, h / 2, 50, h, { isStatic: true });
    const groundBottom = Matter.Bodies.rectangle(w / 2, h + 24, w, 50, { isStatic: true });
    Matter.World.add(this.engine.world, [groundLeft, groundBottom, groundRight]);
  }


  initMouseControls() {
    const mouse = Matter.Mouse.create((this.two as any).renderer.domElement);
    const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        angularStiffness: 0
      }
    });
    Matter.World.add(this.engine.world, mouseConstraint);
  }


  requestAnimationFrame() {
    Matter.Engine.update(this.engine, 1000 / 60);
    // Matter.Render.run(this.render);
    this.lines.forEach(line => line.update());
    this.two.update();
  }
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
 * https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
 * A linear interpolator for hexadecimal colors
 * @param {String} a
 * @param {String} b
 * @param {Number} amount
 * @example
 * // returns #7F7F7F
 * lerpColor('#000000', '#ffffff', 0.5)
 * @returns {String}
 */
function lerpColor(a, b, amount) {

  // var ah = parseInt(a.replace(/#/g, ''), 16),
  var ah = +a.replace('#', '0x'),
      ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
      // bh = parseInt(b.replace(/#/g, ''), 16),
      bh = +b.replace('#', '0x'),
      br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
      rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab);

  return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
}
