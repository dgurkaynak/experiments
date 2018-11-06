// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Matter from 'matter-js';
import Experiment from '../experiment';
import CanvasResizer from '../utils/canvas-resizer';
import * as opentype from 'opentype.js';
import Letter from './letter';

import fontPath from './ModernSans-Light.otf';


export default class TextPhysics extends Experiment {
  // canvasResizer = new CanvasResizer({
  //   dimension: 'fullscreen',
  //   dimensionScaleFactor: 1
  // });
  two: Two;
  letters: Letter[] = [];

  engine = Matter.Engine.create();
  render = Matter.Render.create({
    element: this.containerEl,
    engine: this.engine
  });


  constructor() {
    super();


    this.two = new Two({
      type: Two.Types.canvas,
      width: 800,
      height: 600,
      ratio: window.devicePixelRatio
    });
    this.two.appendTo(this.containerEl);
  }


  async init() {
    const font = await loadFont(fontPath);

    const refRect = this.two.makeRectangle(450, 400, 700, 400);
    refRect.noFill();
    refRect.stroke = 'rgba(0, 0, 255, 0.5)';
    refRect.linewidth = 1;

    // l (kucuk le) de sikinti var
    let left = 0;
    ('VWXYZ').split('').forEach((char) => {
      const letter = new Letter(font, this.two, char, 144, 100 + left, 200);;
      Matter.World.add(this.engine.world, letter.body);

      letter.view.fill = 'black';
      // letter.view.noStroke();

      const rect = this.two.makeRectangle(0, 0, letter.pathWidth, letter.pathHeight);
      rect.fill = 'rgba(0, 0, 0, 0)';
      rect.stroke = 'rgba(0, 255, 0, 0.5)';
      rect.linewidth = 1;
      letter.view.add(rect);

      this.letters.push(letter);

      left += letter.pathWidth;
    });

    const ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    Matter.World.add(this.engine.world, ground);

    const groundView = this.two.makeRectangle(400, 610, 810, 60);
    groundView.fill = 'rgba(255, 0, 0, 0.25)';
    groundView.noStroke();

    this.two.update();

    return super.init();
  }


  requestAnimationFrame() {
    Matter.Engine.update(this.engine, 1000 / 60);
    Matter.Render.run(this.render);

    this.letters.forEach(x => x.update());
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

