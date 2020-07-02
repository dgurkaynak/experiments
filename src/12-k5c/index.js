// Global deps
// - animejs
// - dat.gui
// - lodash (times, throttle)

import { CanvasResizer } from '../lib/canvas-resizer.js';

/**
 * Constants
 */
const EASING = 'easeInOutQuart'; // https://easings.net/

const GUISettings = class {
  constructor() {
    this.screenCount = 2;
    this.textSize = 0.85;
    this.splitCount = 21;
    this.duration = 2000;
    this.delay = 33;
    this.wait = 250;
    this.textColor = '#ffffff';

    this.text0 = 'WHAT';
    this.bgColor0 = '#000000';
    this.text1 = 'EVER';
    this.bgColor1 = '#0B24FB';
    this.text2 = '';
    this.bgColor2 = '#000000';
    this.text3 = '';
    this.bgColor3 = '#000000';
    this.text4 = '';
    this.bgColor4 = '#000000';
    this.text5 = '';
    this.bgColor5 = '#000000';
    this.text6 = '';
    this.bgColor6 = '#000000';
    this.text7 = '';
    this.bgColor7 = '#000000';
    this.text8 = '';
    this.bgColor8 = '#000000';
    this.text9 = '';
    this.bgColor9 = '#000000';
  }
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  canvas: document.createElement('div'),
  stats: document.getElementById('stats'),
};
const resizer = (window.resizer = new CanvasResizer(elements.canvas, {
  dimension: [1080, 1080],
  dimensionScaleFactor: 1,
}));
const settings = new GUISettings();
const gui = new dat.GUI();
const font = new FontFace('TallDark', `url(./talldark.ttf)`);
let splitHeight;
const iterator = (arr) => {
  let i = 0;
  const next = () => {
    const rv = arr[i];
    i = (i + 1) % arr.length;
    return rv;
  };
  return { next };
};
let textsIterator;
let bgColorsIterator;
let entryTextAnimation;
let outroTextAnimation;
let waitTimeout;
let screenSettings = [];

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  elements.canvas.style.position = 'relative';
  elements.canvas.style.overflow = 'hidden';
  elements.container.appendChild(elements.canvas);
  resizer.init();

  // Settings
  gui
    .add(settings, 'screenCount', 1, 10)
    .step(1)
    .onChange(stopConfigureGoThrottle);
  gui
    .add(settings, 'textSize', 0.1, 1)
    .step(0.01)
    .onChange(stopConfigureGoThrottle);
  gui
    .add(settings, 'splitCount', 2, 100)
    .step(1)
    .onChange(stopConfigureGoThrottle);
  gui
    .add(settings, 'duration', 100, 10000)
    .step(1)
    .onChange(stopConfigureGoThrottle);
  gui.add(settings, 'delay', 5, 500).step(1).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'wait', 0, 5000).step(1).onChange(stopConfigureGoThrottle);
  gui.addColor(settings, 'textColor').onChange(stopConfigureGoThrottle);

  gui.close();

  const fontFace = await font.load();
  document.fonts.add(fontFace);

  configure();
  go();
}

const stopConfigureGoThrottle = _.throttle(() => {
  stop();
  configure();
  go();
}, 500);

function configure() {
  elements.canvas.style.backgroundColor = settings.bgColor0;

  splitHeight = resizer.styleHeight / settings.splitCount;

  const texts = _.times(settings.screenCount, (i) => settings[`text${i}`]);
  const bgColors = _.times(
    settings.screenCount,
    (i) => settings[`bgColor${i}`]
  );
  textsIterator = iterator(texts);
  bgColorsIterator = iterator(bgColors);

  // Settings
  screenSettings.forEach((subFolder) => gui.removeFolder(subFolder));
  screenSettings = _.times(settings.screenCount, (i) => {
    const subFolder = gui.addFolder(`Screen ${i + 1}`);
    subFolder.add(settings, `text${i}`).onFinishChange(stopConfigureGoThrottle);
    subFolder
      .addColor(settings, `bgColor${i}`)
      .onFinishChange(stopConfigureGoThrottle);
    subFolder.open();
    return subFolder;
  });
}

async function go() {
  const screenContainer = document.createElement('div');
  screenContainer.style.position = 'absolute';
  screenContainer.style.top = '0';
  screenContainer.style.left = '0';
  screenContainer.style.width = `${resizer.styleWidth}px`;
  screenContainer.style.bottom = `${resizer.styleHeight}px`;

  const text = textsIterator.next();
  const texts = _.times(settings.splitCount, (i) => {
    const element = createText();
    element.style.width = `100%`;
    element.style.height = `${splitHeight}px`;
    element.style.transform = `translateX(100%)`;
    element.firstChild.textContent = text;
    element.firstChild.style.color = settings.textColor;
    element.firstChild.style.top = `${-i * splitHeight}px`;
    screenContainer.appendChild(element);
    return element;
  });

  elements.canvas.appendChild(screenContainer);

  // Entry text animation
  entryTextAnimation = anime({
    targets: texts,
    easing: EASING,
    translateX: '0',
    duration: settings.duration,
    delay: (el, i) => i * settings.delay,
  });

  // Background animation
  anime({
    targets: elements.canvas,
    easing: EASING,
    backgroundColor: bgColorsIterator.next(),
    duration: settings.duration,
  });

  // Wait for the text animation
  await entryTextAnimation.finished;

  const waitPromise = new Promise((resolve) => {
    waitTimeout = setTimeout(resolve, settings.wait);
  });
  await waitPromise;

  // Start next one
  go();

  // Outro text animation
  outroTextAnimation = anime({
    targets: texts,
    easing: EASING,
    translateX: '-100%',
    duration: settings.duration,
    delay: (el, i) => i * settings.delay,
  });
  await outroTextAnimation.finished;

  // Clean up
  if (elements.canvas.firstChild == screenContainer) {
    elements.canvas.removeChild(screenContainer);
  }
}
window.go = go;

function stop() {
  clearTimeout(waitTimeout);
  entryTextAnimation && entryTextAnimation.pause();
  outroTextAnimation && outroTextAnimation.pause();
  while (elements.canvas.firstChild) {
    elements.canvas.removeChild(elements.canvas.firstChild);
  }
}
window.stop = stop;

function createText() {
  const innerElement = document.createElement('div');
  innerElement.style.width = `${resizer.styleWidth}px`;
  innerElement.style.height = `${resizer.styleHeight}px`;
  innerElement.style.display = 'flex';
  innerElement.style.justifyContent = 'center';
  innerElement.style.alignItems = 'center';
  innerElement.style.fontFamily = 'TallDark';
  innerElement.style.fontSize = `${resizer.styleHeight * settings.textSize}px`;
  innerElement.style.position = 'relative';

  const outerElement = document.createElement('div');
  outerElement.style.overflow = 'hidden';
  outerElement.appendChild(innerElement);

  return outerElement;
}

/**
 * Clean your shit
 */
function dispose() {
  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
  resizer.destroy();
}

main().catch((err) => console.error(err));
