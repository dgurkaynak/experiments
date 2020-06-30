import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Animator } from '../lib/animator.js';

/**
 * Constants
 */
const ENABLE_STATS = true;

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
  ratio: window.devicePixelRatio,
});
const stats = new Stats();
const animator = new Animator(animate);

/**
 * Experiment variables
 */
let circle;
let rect;
let group;

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

  // Start experiment
  circle = two.makeCircle(-70, 0, 50);
  rect = two.makeRectangle(70, 0, 100, 100);
  circle.fill = '#FF8000';
  rect.fill = 'rgba(0, 200, 255, 0.75)';

  group = two.makeGroup([circle, rect]);
  group.translation.set(resizer.width / 2, resizer.height / 2);
  group.scale = 0;
  group.noStroke();

  animator.start();
}

/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();

  if (group.scale > 0.9999) {
    group.scale = group.rotation = 0;
  }
  const t = (1 - group.scale) * 0.125;
  group.scale += t;
  group.rotation += t * 4 * Math.PI;
  two.update();

  if (ENABLE_STATS) stats.end();
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
