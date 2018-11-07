// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Matter from 'matter-js';
import ExperimentTwoJs from '../experiment-twojs';
import CanvasResizer from '../utils/canvas-resizer';
import * as opentype from 'opentype.js';
import Letter from './letter';

import fontPath from './ModernSans-Light.otf';


export default class TextPhysics extends ExperimentTwoJs {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen'
  });
  two: Two;
  letters: Letter[] = [];

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

    let left = 0;
    ('HAPPY?').split('').forEach((char) => {
      const letter = new Letter(font, this.two, char, 144, 100 + left, 200);;
      Matter.World.add(this.engine.world, letter.body);

      letter.view.fill = 'black';
      letter.view.noStroke();

      // Draw bounding box for debug purposes
      // const rect = this.two.makeRectangle(0, 0, letter.pathWidth, letter.pathHeight);
      // rect.fill = 'rgba(0, 0, 0, 0)';
      // rect.stroke = 'rgba(0, 255, 0, 0.5)';
      // rect.linewidth = 1;
      // letter.view.add(rect);

      this.letters.push(letter);

      left += letter.pathWidth + 10;
    });

    const ground = Matter.Bodies.rectangle(
      this.canvasResizer.canvasWidth / 2, 
      this.canvasResizer.canvasHeight + 24, 
      this.canvasResizer.canvasWidth, 
      50, 
      { isStatic: true }
    );
    Matter.World.add(this.engine.world, ground);

    this.two.update();

    return super.init();
  }


  requestAnimationFrame() {
    Matter.Engine.update(this.engine, 1000 / 60);
    // Matter.Render.run(this.render);

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

