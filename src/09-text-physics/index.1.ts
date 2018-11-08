// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Matter from 'matter-js';
import ExperimentTwoJs from '../experiment-twojs';
import CanvasResizer from '../utils/canvas-resizer';
import * as opentype from 'opentype.js';
import Letter from './letter';
import Line from './line';

import fontPath from './ModernSans-Light.otf';


const TEXT = [
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.',
  'YOU MAKE ME',
  'LAUGH, BUT IT\'S',
  'NOT FUNNY.'
];
const LINE_HEIGHT = 150;
const COLORS = {
  BG: '#000000',
  FONT: '#ffffff'
};
const DROP_INTERVAL = 750;


export default class TextPhysics extends ExperimentTwoJs {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen'
  });
  two: Two;
  lines: Line[] = [];

  engine = Matter.Engine.create();
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

    // Texts
    const lines = TEXT.map((text, i) => {
      const line = new Line(font, text);
      line.init(this.two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });
      return line;
    });

    lines.forEach((line, i) => {
      setTimeout(() => {
        line.letters.forEach((letter) => {
          // Set view
          letter.view.fill = COLORS.FONT;

          Matter.World.add(this.engine.world, letter.body);
        });

        this.lines.push(line);
      }, DROP_INTERVAL * i);
    });

    this.initWalls();
    this.initMouseControls();

    this.two.update();
    return super.init();
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
