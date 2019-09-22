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
import sample from 'lodash/sample';
import times from 'lodash/times';

import fontPath from './ModernSans-Light.otf';


/**
 * Constants
 */
const ENABLE_STATS = true;
const TEXT = [
  'YOU MAKE',
  'ME LAUGH,',
  'BUT IT\'S',
  'NOT FUNNY.'
];
const LINE_HEIGHT = 150;
const COLORS = {
  BG: '#000000',
  FONT: '#ffffff'
};
const CONSTRAINT = {
  COUNT: 3,
  LENGTH: 0,
  STIFFNESS: 0.001
};


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
const engine = Matter.Engine.create();
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
  const offsetY = (h - TEXT.length * LINE_HEIGHT) / 2;

  TEXT.forEach((text, i) => {
    const line = new Line(font, text);
    line.init(two, { x: 0, y: offsetY + LINE_HEIGHT * i, width: w, height: LINE_HEIGHT });

    line.letters.forEach((letter) => {
      // Set view
      (<any>letter.view).fill = COLORS.FONT;

      // Add constraints
      const newThings: any[] = [ letter.body ];
      const vertex = sample(letter.body.vertices);
      times(CONSTRAINT.COUNT, () => {
        const vertex = sample(letter.body.vertices);
        const constraint = Matter.Constraint.create({
          pointA: { x: vertex.x, y: vertex.y },
          bodyB: letter.body,
          pointB: { x: vertex.x - letter.body.position.x, y: vertex.y - letter.body.position.y },
          length: CONSTRAINT.LENGTH,
          stiffness: CONSTRAINT.STIFFNESS,
        });
        newThings.push(constraint);
      });

      Matter.World.add(engine.world, newThings);
    });

    lines.push(line);
  });

  initWalls();
  initMouseControls();

  two.update();

  animator.start();
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
