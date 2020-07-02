// Global deps
// - two.js
// - stats.js
// - dat.gui
// - matter.js
// - opentype.js
// - nice-color-palettes
// - lodash (sampleSize)

// Needed for Matter.Bodies.fromVertices() function
// - poly-decomp
// - path-seg

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Animator } from '../lib/animator.js';
import { saveImage } from '../lib/canvas-helper.js';
import { Line } from './line.js';
import * as colorHelper from '../lib/color-helper.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const LINE_HEIGHT = 150;

const GUISettings = class {
  constructor() {
    this.text =
      `I CAN ONLY_NOTE THAT_THE PAST IS_BEAUTIFUL_BECAUSE_ONE NEVER_REALIZES_AN EMOTION_` +
      `AT THE TIME_IT EXPANDS_LATER,_AND THUS_WE DON'T_HAVE COMPLETE_EMOTIONS_ABOUT_THE PRESENT,_` +
      `ONLY ABOUT_THE PAST.`;
    this.newLineSeperator = '_';
    this.dropTimeout = 750;

    // Other favs:
    // #5c5863 #b4dec1 #ff1f4c
    // #f5f4d7 #e0dfb1 #951f2b
    // #fff7bd #f2f26f #f04155
    this.bgColor = '#542437';
    this.fontColorLatest = '#ecd078';
    this.fontColorFirst = '#c02942';
  }

  randomizeColors() {
    const randomTwoColors = _.sampleSize(_.sampleSize(niceColorPalettes100, 1)[0], 3);
    settings.bgColor = randomTwoColors[0];
    settings.fontColorLatest = randomTwoColors[1];
    settings.fontColorFirst = randomTwoColors[2];
    redraw();
  };

  redraw() {
    redraw();
  }

  saveImage() {
    saveImage(resizer.canvas);
  }
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
const engine = Matter.Engine.create({ enableSleeping: true });
// const render = Matter.Render.create({ engine, element: elements.container });
let timeouts = [];

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
  gui.add(settings, 'dropTimeout', 500, 2500).step(1).onFinishChange(redraw);
  gui.close();

  const viewSettings = gui.addFolder('View');
  viewSettings.addColor(settings, 'bgColor').listen().onFinishChange(redraw);
  viewSettings
    .addColor(settings, 'fontColorLatest')
    .listen()
    .onFinishChange(redraw);
  viewSettings
    .addColor(settings, 'fontColorFirst')
    .listen()
    .onFinishChange(redraw);
  viewSettings.add(settings, 'randomizeColors');

  gui.add(settings, 'redraw');
  gui.add(settings, 'saveImage');

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Load the font
  font = await loadFont('./ModernSans-Light.otf');

  redraw();
  initWalls();
  initMouseControls();

  two.update();

  animator.start();
}

/**
 * Redraw the whole scene
 */
function redraw() {
  // Clear timeouts
  timeouts.forEach(clearTimeout);
  timeouts = [];

  // Clear psyhics
  lines.forEach((line) => {
    line.letters.forEach((letter) => {
      Matter.World.remove(engine.world, letter.body);
    });
  });
  lines = [];

  // Background
  const [w, h] = [resizer.width, resizer.height];
  const bgRect = two.makeRectangle(w / 2, h / 2, w, h);
  bgRect.fill = settings.bgColor;
  bgRect.noStroke();

  // Texts
  const lines_ = settings.text
    .split(settings.newLineSeperator)
    .map((text, i) => {
      const line = new Line(font, text);
      line.init(two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });
      return line;
    });

  addLine(lines_, 0, lines_.length);
}

/**
 * Starts the falling animation, (recursive func)
 */
function addLine(lines_, i, totalLineCount) {
  if (lines_.length == 0) return;
  const [line, ...linesRest] = lines_;
  const color = colorHelper.lerp(
    settings.fontColorFirst,
    settings.fontColorLatest,
    i / totalLineCount
  );

  line.letters.forEach((letter) => {
    letter.view.fill = color;
    Matter.World.add(engine.world, letter.body);
  });

  lines.push(line);
  const timeout1 = setTimeout(() => {
    addLine(linesRest, i + 1, totalLineCount);
  }, settings.dropTimeout);

  // Make them static after 5 drop_intervals
  // This prevents glitches
  const timeout2 = setTimeout(() => {
    line.letters.forEach((letter) => {
      Matter.Body.setStatic(letter.body, true);
    });
  }, settings.dropTimeout * 5);

  timeouts.push(timeout1, timeout2);
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
