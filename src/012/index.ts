import times from 'lodash/times';
import throttle from 'lodash/throttle';
import anime from 'animejs';
import fontPath from './talldark.ttf';
import * as dat from 'dat.gui';



/**
 * Constants
 */
const EASING = 'easeInOutQuart'; // https://easings.net/

const GUISettings = class {
  screenCount = 2;
  textSize = 0.95;
  splitCount = 10;
  duration = 2000;
  delay = 33;
  wait = 250;
  textColor = '#ffffff';

  text0 = 'YEAH';
  bgColor0 = '#000000';
  text1 = 'BRO';
  bgColor1 = '#0B24FB';
  text2 = '';
  bgColor2 = '#000000';
  text3 = '';
  bgColor3 = '#000000';
  text4 = '';
  bgColor4 = '#000000';
  text5 = '';
  bgColor5 = '#000000';
  text6 = '';
  bgColor6 = '#000000';
  text7 = '';
  bgColor7 = '#000000';
  text8 = '';
  bgColor8 = '#000000';
  text9 = '';
  bgColor9 = '#000000';
};


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const settings = new GUISettings();
const gui = new dat.GUI();
const font = new (window as any).FontFace('TallDark', `url(${fontPath})`);
let itemHeight: number;
const iterator = (arr) => {
  let i = 0;
  const next = () => {
    const rv = arr[i];
    i = (i + 1) % arr.length;
    return rv;
  };
  return { next };
};
let textsIterator: Iterator<string>;
let bgColorsIterator: Iterator<string>;
let entryTextAnimation: anime.AnimeInstance;
let outroTextAnimation: anime.AnimeInstance;
let waitTimeout: any;
let screenSettings: dat.GUI[] = [];


/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  elements.container.style.position = 'relative';
  elements.container.style.overflow = 'none';
  elements.container.style.height = '100%';
  // elements.container.style.width = '1080px';
  // elements.container.style.height = '1080px';

  // Settings
  gui.add(settings, 'screenCount', 1, 10).step(1).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'textSize', 0.1, 1).step(0.01).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'splitCount', 2, 100).step(1).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'duration', 100, 10000).step(1).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'delay', 5, 500).step(1).onChange(stopConfigureGoThrottle);
  gui.add(settings, 'wait', 0, 5000).step(1).onChange(stopConfigureGoThrottle);
  gui.addColor(settings, 'textColor').onChange(stopConfigureGoThrottle);

  gui.close();

  const fontFace = await font.load();
  (document as any).fonts.add(fontFace);

  configure();
  go();
}


const stopConfigureGoThrottle = throttle(() => {
  stop();
  configure();
  go();
}, 500);


function configure() {
  elements.container.style.backgroundColor = settings.bgColor0;

  itemHeight = (window.innerHeight * settings.textSize) / settings.splitCount;

  const texts = times(settings.screenCount, i => settings[`text${i}`]);
  const bgColors = times(settings.screenCount, i => settings[`bgColor${i}`]);
  textsIterator = iterator(texts);
  bgColorsIterator = iterator(bgColors);

  // Settings
  screenSettings.forEach(subFolder => gui.removeFolder(subFolder));
  screenSettings = times(settings.screenCount, (i) => {
    const subFolder = gui.addFolder(`Screen ${i+1}`);
    subFolder.add(settings, `text${i}`).onFinishChange(stopConfigureGoThrottle);
    subFolder.addColor(settings, `bgColor${i}`).onFinishChange(stopConfigureGoThrottle);
    subFolder.open();
    return subFolder;
  });
}


async function go() {
  const textContainer = document.createElement('div');
  textContainer.style.position = 'absolute';
  textContainer.style.top = '0';
  textContainer.style.right = '0';
  textContainer.style.bottom = '0';
  textContainer.style.left = '0';
  textContainer.style.display = 'flex';
  textContainer.style.alignItems = 'center';
  textContainer.style.justifyContent = 'center';
  textContainer.style.flexDirection = 'column';

  const text = textsIterator.next();
  const texts = times(settings.splitCount, (i) => {
    const element = createText();
    element.style.width = `100%`;
    element.style.height = `${itemHeight}px`;
    element.style.transform = `translateX(100%)`;
    element.firstChild.textContent = text as any;
    (element.firstChild as any).style.color = settings.textColor;
    (element.firstChild as any).style.top = `${-i * itemHeight}px`;
    textContainer.appendChild(element);
    return element;
  });

  elements.container.appendChild(textContainer);

  // Entry text animation
  entryTextAnimation = anime({
    targets: texts,
    easing: EASING,
    translateX: '0',
    duration: settings.duration,
    delay: (el, i) => i * settings.delay
  });

  // Background animation
  anime({
    targets: elements.container,
    easing: EASING,
    backgroundColor: bgColorsIterator.next(),
    duration: settings.duration
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
    delay: (el, i) => i * settings.delay
  });
  await outroTextAnimation.finished;

  // Clean up
  if (elements.container.firstChild == textContainer) {
    elements.container.removeChild(textContainer);
  }
}
(window as any).go = go;


function stop() {
  clearTimeout(waitTimeout);
  entryTextAnimation && entryTextAnimation.pause();
  outroTextAnimation && outroTextAnimation.pause();
  while (elements.container.firstChild) { elements.container.removeChild(elements.container.firstChild); }
};
(window as any).stop = stop;


function createText() {
  const innerElement = document.createElement('div');
  // innerElement.textContent = TEXT;
  innerElement.style.fontFamily = 'TallDark';
  innerElement.style.fontSize = `${(window.innerHeight * settings.textSize)}px`;
  innerElement.style.textAlign = 'center';
  innerElement.style.position = 'relative';
  // innerElement.style.top = '-50px';

  const outerElement = document.createElement('div');
  outerElement.style.overflow = 'hidden';
  // outerElement.style.height = `${TEXT_SIZE / TEXT_SPLIT_COUNT}px`;
  outerElement.appendChild(innerElement);

  return outerElement;
}


/**
 * Clean your shit
 */
function dispose() {

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
