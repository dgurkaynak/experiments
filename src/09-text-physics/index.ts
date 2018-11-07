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
    const font = await loadFont(fontPath);

    const texts = [
      'YOU MAKE ME',
      'LOUGH, BUT IT\'S',
      'NOT FUNNY.'
    ];
    const lineHeight = 150;
    const offsetY = (this.canvasResizer.canvasHeight - texts.length * 150) / 2;

    this.lines = texts.map((text, i) => {
      const line = new Line(font, text);
      line.init(this.two, { x: 0, y: offsetY + lineHeight * i, width: this.canvasResizer.canvasWidth, height: lineHeight });
      line.letters.forEach(letter => Matter.World.add(this.engine.world, letter.body));
      return line;
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
