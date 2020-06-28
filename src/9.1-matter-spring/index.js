// Global deps
// - two.js
// - stats.js
// - dat.gui
// - matter.js
// - opentype.js
// - lodash (sample, times, sampleSize)
// - nice-color-palettes

// Needed for Matter.Bodies.fromVertices() function
// - poly-decomp
// - path-seg

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Animator } from '../lib/animator.js';
import { saveImage } from '../lib/canvas-helper.js';
import { Line } from '../9.0-matter-gravity/line.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const LINE_HEIGHT = 150;

const GUISettings = class {
  text = `YOU MAKE_ME LAUGH,_BUT IT'S_NOT FUNNY.`;
  newLineSeperator = '_';

  springCount = 3;
  springLength = 3;
  springStiffness = 0.001;

  // Other favs:
  // #c6d6b8 #987f69
  // #f03c02 #a30006
  bgColor = '#83af9b';
  textColor = '#f9cdad';

  randomizeColors = () => {
    const randomTwoColors = _.sampleSize(
      _.sampleSize(niceColorPalettes100, 1)[0],
      2
    );
    settings.bgColor = randomTwoColors[0];
    settings.textColor = randomTwoColors[1];
    redraw();
  };

  redraw = () => redraw();
  saveImage = () => saveImage(resizer.canvas);
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const resizer = new CanvasResizer(null, { dimension: [1080, 1080] });
const two = new Two({
  type: Two.Types.canvas,
  width: resizer.width,
  height: resizer.height,
  ratio: window.devicePixelRatio,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const animator = new Animator(animate);

/**
 * Experiment variables
 */
let font;
let lines = [];
const engine = Matter.Engine.create();
// const render = Matter.Render.create({ engine, element: elements.container });

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  two.appendTo(elements.container);
  resizer.canvas = two.renderer.domElement;
  resizer.resize = onWindowResize;
  resizer.init();

  // Settings
  gui.add(settings, 'text').onFinishChange(redraw);
  gui.add(settings, 'newLineSeperator').onFinishChange(redraw);
  gui.close();

  const springSettings = gui.addFolder('Spring');
  springSettings
    .add(settings, 'springCount', 1, 10)
    .step(1)
    .onFinishChange(redraw);
  springSettings
    .add(settings, 'springLength', 0.1, 100)
    .step(0.1)
    .onFinishChange(redraw);
  springSettings
    .add(settings, 'springStiffness', 0.0001, 0.01)
    .step(0.0001)
    .onFinishChange(redraw);

  const viewSettings = gui.addFolder('View');
  viewSettings.addColor(settings, 'bgColor').listen().onFinishChange(redraw);
  viewSettings.addColor(settings, 'textColor').listen().onFinishChange(redraw);
  viewSettings.add(settings, 'randomizeColors');

  gui.add(settings, 'redraw');
  gui.add(settings, 'saveImage');

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  font = await loadFont('../9.0-matter-gravity/ModernSans-Light.otf');

  redraw();
  initWalls();
  initMouseControls();

  two.update();

  animator.start();
}

function redraw() {
  lines.forEach((line) => {
    line.letters.forEach((letter) => {
      const constraints = letter.constraints;
      Matter.World.remove(engine.world, constraints);
      Matter.World.remove(engine.world, letter.body);
    });
  });
  lines = [];

  const [w, h] = [resizer.width, resizer.height];

  // Background
  const bgRect = two.makeRectangle(w / 2, h / 2, w, h);
  bgRect.fill = settings.bgColor;
  bgRect.noStroke();

  // Texts
  const TEXT = settings.text.split(settings.newLineSeperator);
  const offsetY = (h - TEXT.length * LINE_HEIGHT) / 2;

  TEXT.forEach((text, i) => {
    const line = new Line(font, text);
    line.init(two, {
      x: 0,
      y: offsetY + LINE_HEIGHT * i,
      width: w,
      height: LINE_HEIGHT,
    });

    line.letters.forEach((letter) => {
      // Set view
      letter.view.fill = settings.textColor;

      // Add constraints
      const newThings = [letter.body];
      const constraints = (letter.constraints = []);
      const vertex = _.sample(letter.body.vertices);
      _.times(settings.springCount, () => {
        const vertex = _.sample(letter.body.vertices);
        const constraint = Matter.Constraint.create({
          pointA: { x: vertex.x, y: vertex.y },
          bodyB: letter.body,
          pointB: {
            x: vertex.x - letter.body.position.x,
            y: vertex.y - letter.body.position.y,
          },
          length: settings.springLength,
          stiffness: settings.springStiffness,
        });
        newThings.push(constraint);
        constraints.push(constraint);
      });

      Matter.World.add(engine.world, newThings);
    });

    lines.push(line);
  });
}

/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();

  Matter.Engine.update(engine, 1000 / 60);
  // Matter.Render.run(render);
  lines.forEach((line) => line.update());
  two.update();

  if (ENABLE_STATS) stats.end();
}

function initWalls() {
  const [w, h] = [resizer.width, resizer.height];
  const groundLeft = Matter.Bodies.rectangle(-25, h / 2, 50, h, {
    isStatic: true,
  });
  const groundRight = Matter.Bodies.rectangle(w + 25, h / 2, 50, h, {
    isStatic: true,
  });
  const groundBottom = Matter.Bodies.rectangle(w / 2, h + 24, w, 50, {
    isStatic: true,
  });
  Matter.World.add(engine.world, [groundLeft, groundBottom, groundRight]);
}

function initMouseControls() {
  const mouse = Matter.Mouse.create(two.renderer.domElement);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: { angularStiffness: 0 },
  });
  Matter.World.add(engine.world, mouseConstraint);
}

function loadFont(path) {
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
function onWindowResize(width, height) {
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
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

main().catch((err) => console.error(err));
