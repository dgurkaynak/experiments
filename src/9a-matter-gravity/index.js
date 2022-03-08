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

const sleep = (duration) => new Promise(resolve => setTimeout(resolve, duration));

/**
 * Constants
 */
const ENABLE_STATS = false;
const LINE_HEIGHT = 150;

const LYRICS = [
  {wait: 2000, text: `illycious`},
  {wait: 1000, text: `online`},
  {wait: 1000, text: `bitches...`},
  {wait: 6000, text: `You're the one`},
  // {wait: 10000, text: `You're the one`},
  {wait: 900, text: `who's always`},
  {wait: 1150, text: `choking Trojan`},
  {wait: 2000, text: `You're the one`},
  {wait: 900, text: `who's always`},
  {wait: 1250, text: `bruised and broken`},
  {wait: 1500, text: `Sleep may be`},
  {wait: 750, text: `the enemy`},
  {wait: 1500, text: `But so's`},
  {wait: 750, text: `another line`},
  {wait: 2000, text: `It's a remedy`},
  {wait: 2000, text: `You should take`},
  {wait: 750, text: `more time`},
  {wait: 1500, text: `You're the one`},
  {wait: 900, text: `who's always`},
  {wait: 1150, text: `choking Trojan`},
  {wait: 2000, text: `You're the one`},
  {wait: 900, text: `who's showers`},
  {wait: 1500, text: `always golden`},
  {wait: 1750, text: `Spunk & bestiality`},
  {wait: 2000, text: `well it's an`},
  {wait: 1100, text: `Assisi lie`},
  {wait: 2000, text: `It's ahead of me`},
  {wait: 2000, text: `You should`},
  {wait: 1000, text: `close your fly`},
  {wait: 2500, text: `I understand`},
  {wait: 1000, text: `the fascination`},
  {wait: 3500, text: `The dream that`},
  {wait: 750, text: `comes alive`},
  {wait: 750, text: `at night`},
  {wait: 2250, text: `But if you don't`},
  {wait: 1000, text: `change your situation`},
  {wait: 1750, text: `Then you'll die,`},
  {wait: 1000, text: `you'll die,`},
  {wait: 1000, text: `don't die,`},
  {wait: 1000, text: `don't die`},
  {wait: 4250, text: `Please don't die`},
  {wait: 6500, text: `You're the one`},
  {wait: 900, text: `who's always`},
  {wait: 1150, text: `choking Trojan`},
  {wait: 2000, text: `You're the one`},
  {wait: 900, text: `who's always`},
  {wait: 1250, text: `bruised and broken`},
  {wait: 1500, text: `Drunk on immorality`},
  {wait: 2000, text: `Valium and`},
  {wait: 1000, text: `cherry wine`},
  {wait: 1500, text: `Coke and ecstasy`},
  {wait: 2000, text: `You're gonna`},
  {wait: 1000, text: `blow your mind`},
  {wait: 3000, text: `I understand`},
  {wait: 1000, text: `the fascination`},
  {wait: 3000, text: `I've even been`},
  {wait: 750, text: `there once`},
  {wait: 1000, text: `or twice`},
  {wait: 1250, text: `or more`},
  {wait: 1000, text: `But if you don't`},
  {wait: 1000, text: `change your situation`},
  {wait: 1750, text: `Then you'll die,`},
  {wait: 1000, text: `you'll die,`},
  {wait: 1000, text: `don't die,`},
  {wait: 1000, text: `don't die`},
  {wait: 4250, text: `Please don't die`},
  {wait: 4250, text: `Please don't die`},
  {wait: 4250, text: `Please don't die`},
  {wait: 4250, text: `Please don't die`},
];

const GUISettings = class {
  constructor() {
    this.text =
      `I CAN ONLY_NOTE THAT_THE PAST IS_BEAUTIFUL_BECAUSE_ONE NEVER_REALIZES_AN EMOTION_` +
      `AT THE TIME_IT EXPANDS_LATER,_AND THUS_WE DON'T_HAVE COMPLETE_EMOTIONS_ABOUT_THE PRESENT,_` +
      `ONLY ABOUT_THE PAST.`;
    this.newLineSeperator = '_';
    this.dropTimeout = 750;

    this.bgColor = '#000000';
    this.fontColorLatest = '#ffffff';
    this.fontColorFirst = '#ffffff';
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
  audio: document.getElementById('audio'),
};
const resizer = new CanvasResizer(null, { dimension: [1080, 2700] });
const two = new Two({
  type: Two.Types.canvas,
  width: resizer.width,
  height: resizer.height,
  ratio: window.devicePixelRatio,
});
const stats = new Stats();
const settings = new GUISettings();
const animator = new Animator(animate);

/**
 * Experiment variables
 */
let font;
let lines = [];
const engine = Matter.Engine.create({ enableSleeping: false });
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

  elements.audio.play();

  animator.start();
}

/**
 * Redraw the whole scene
 */
async function redraw() {
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
  // const lines_ = settings.text
  //   .split(settings.newLineSeperator)
  //   .map((text, i) => {
  //     const line = new Line(font, text);
  //     line.init(two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });
  //     return line;
  //   });

  // addLine(lines_, 0, lines_.length);

  for (const { text, wait } of LYRICS) {
    await sleep(wait);
    addLineSIKERLER(font, text);
  }
}

function addLineSIKERLER(font, text) {
  const [w, h] = [resizer.width, resizer.height];
  let options = {};

  const redTexts = [
    `Then you'll die,`,
    `you'll die,`,
    `don't die,`,
    `don't die`,
    `Please don't die`
  ];

  if (text == 'blow your mind') {
    options.fontSize = 200;
  } else if (text == 'change your situation') {
    options.fontSize = 100;
  }

  const line = new Line(font, text, options);

  line.init(two, { x: 0, y: -LINE_HEIGHT, width: w, height: LINE_HEIGHT });

  line.letters.forEach((letter) => {
    let color = '#ffffff';

    if (line.text == 'always golden') {
      color = '#F2B108';
    } else if (redTexts.indexOf(line.text) > -1) {
      color = '#E32133';
    }

    letter.view.fill = color;
    Matter.World.add(engine.world, letter.body);
  });

  lines.push(line);

  // Make them static after 5 drop_intervals
  // This prevents glitches
  setTimeout(() => {
    line.letters.forEach((letter) => {
      Matter.Body.setStatic(letter.body, true);
    });
  }, settings.dropTimeout * 10);
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
    // line.letters.forEach((letter) => {
    //   Matter.Body.setStatic(letter.body, true);
    // });
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

document.body.addEventListener('click', () => {
  main().catch((err) => console.error(err));
}, {once: true});
