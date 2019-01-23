import times from 'lodash/times';
import anime from 'animejs';
import fontPath from './talldark.ttf';



/**
 * Constants
 */
const TEXTS = ['AYNEN', 'AYNEN'];
const BG_COLORS = ['#000', '#0B24FB'];
const TEXT_SIZE = window.innerHeight * 0.95;
const TEXT_SPLIT_COUNT = 10;
const TEXT_COLOR = '#fff';
const EASING = 'easeInOutQuart'; // https://easings.net/
const DURATION = 3000;
const DELAY = 50;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const font = new FontFace('TallDark', `url(${fontPath})`);
const itemHeight = TEXT_SIZE / TEXT_SPLIT_COUNT;
const iterator = (arr) => {
  let i = 0;
  const next = () => {
    const rv = arr[i];
    i = (i + 1) % arr.length;
    return rv;
  };
  return { next };
};
const textsIterator = iterator(TEXTS);
const bgColorsIterator = iterator(BG_COLORS);

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  document.body.style.backgroundColor = BG_COLORS[0];

  const fontFace = await font.load();
  document.fonts.add(fontFace);

  go();
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
  const texts = times(TEXT_SPLIT_COUNT, (i) => {
    const element = createText();
    element.style.width = `100%`;
    element.style.height = `${itemHeight}px`;
    element.style.transform = `translateX(100%)`;
    element.firstChild.textContent = text;
    element.firstChild.style.top = `${-i * itemHeight}px`;
    textContainer.appendChild(element);
    return element;
  });

  elements.container.appendChild(textContainer);


  // Entry text animation
  const entryTextAnimation = anime({
    targets: texts,
    easing: EASING,
    translateX: '0',
    duration: DURATION,
    delay: (el, i) => i * DELAY
  });

  // Background animation
  anime({
    targets: document.body,
    easing: EASING,
    backgroundColor: bgColorsIterator.next(),
    duration: DURATION
  });

  // Wait for the text animation
  await entryTextAnimation.finished;

  // Start next one
  go();

  // Outro text animation
  const outroTextAnimation = anime({
    targets: texts,
    easing: EASING,
    translateX: '-100%',
    duration: DURATION,
    delay: (el, i) => i * DELAY
  });
  await outroTextAnimation.finished;

  // Clean up
  if (elements.container.firstChild == textContainer) {
    elements.container.removeChild(textContainer);
  }

}


function createText() {
  const innerElement = document.createElement('div');
  // innerElement.textContent = TEXT;
  innerElement.style.fontFamily = 'TallDark';
  innerElement.style.fontSize = `${TEXT_SIZE}px`;
  innerElement.style.textAlign = 'center';
  innerElement.style.position = 'relative';
  innerElement.style.color = TEXT_COLOR;
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