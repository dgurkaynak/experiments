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
    
    // l (kucuk le) de sikinti var
    let left = 0;
    ('ABTCH').split('').forEach((char) => {
      const letter = new Letter(font, this.two, char, 144, 200 + left, 200);;
      Matter.World.add(this.engine.world, letter.body);
      letter.view.fill = 'black';
      letter.view.noStroke();
      this.letters.push(letter);

      left += letter.pathWidth * 1.5;
    });

    const ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    Matter.World.add(this.engine.world, ground);

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

