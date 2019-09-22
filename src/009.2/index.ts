// Needed for Matter.Bodies.fromVertices() function
global.decomp = require('poly-decomp');
require('pathseg');

import Two from 'two.js';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Matter from './matter-js';
import noise from '../utils/noise';


/**
 * Constants
 */
const ENABLE_STATS = true;
const COLORS = {
  BG: '#ffffff',
  PARTICLE: '#000000'
};
const NOISE_FACTOR = 1.5;
const PARTICLE_RADIUS = 7;
const PARTICLE_COUNT = { Y: 200, O: 300 };


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
const particles: [Matter.Body, Two.Shape][] = [];
let frameCount = 0;
let gravityNoise = false;


/**
 * Experiment variables
 */
const engine = Matter.Engine.create();
// const render = Matter.Render.create({ engine, element: elements.container });
const wait = async (ms) => new Promise(resolve => setTimeout(resolve, ms));


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
  const terrain = { w: 857.143, h: 588.572 };
  const offset = {
    x: (w - terrain.w) / 2,
    y: (h - terrain.h) / 2
  };

  // Background
  const bgRect = two.makeRectangle(w/2, h/2, w, h);
  bgRect.fill = COLORS.BG;
  bgRect.noStroke();

  // Get outline of YO
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
  svgEl.innerHTML = (
    `<path d="m 125.71484,276 0,588.57227 225.77735,0 0,-36 -65.25977,0 0,-215.55274 L 160,319.68555 l 143.37109,0 24.71875,75.47461 c 4.83399,14.72168 9.12013,28.89453 12.85547,42.51757 3.95508,13.62305 7.4707,26.69629 10.54688,39.22071 l 0,-200.89844 -225.77735,0 z" />` +
    `<path d="M 0,-27.637839 0,173.2606 c 5.05371,-18.67676 9.44824,-34.71582 13.18359,-48.11914 3.73535,-13.62305 7.03027,-24.60938 9.88672,-32.958989 l 25.04883,-76.13476 142.38281,0 -118.32226,293.333979 0,215.55274 -72.17969,0 0,36 397.92773,0 0,-27.32618 c -2.97518,0.13981 -5.97489,0.22461 -9.01172,0.22461 -50.09765,0 -93.05371,-18.56738 -128.86914,-55.70117 -45.04394,-47.02149 -67.5664,-117.55274 -67.5664,-211.5957 0,-90.0879 23.50977,-158.97363 70.53125,-206.654299 34.93652,-35.37597 76.35546,-53.0625 124.25586,-53.0625 3.59898,0 7.1513,0.0932 10.66015,0.27344 l 0,-34.73047 z" />` +
    `<path d="m 397.92773,-27.637839 0,200.898439 c -5.05371,-18.67676 -9.44824,-34.71582 -13.18359,-48.11914 -3.73535,-13.62305 -7.03027,-24.60938 -9.88672,-32.958989 l -25.04883,-76.13476 -142.38281,0 118.32226,293.333979 0,215.55274 72.17969,0 0,36 -397.92773,0 0,-27.32618 c 2.97518,0.13981 5.97489,0.22461 9.01172,0.22461 50.09765,0 93.05371,-18.56738 128.86914,-55.70117 45.04394,-47.02149 67.5664,-117.55274 67.5664,-211.5957 0,-90.0879 -23.50977,-158.97363 -70.53125,-206.654299 C 99.97949,24.505721 58.56055,6.819191 10.66015,6.819191 7.06117,6.819191 3.50885,6.912391 0,7.092631 l 0,-34.73047 z" />` +
    `<path d="m 53.06445,-27.637839 c -16.25976,0 -29.2246,12.08594 -38.89258,36.25586 C 4.72363,31.030121 0,63.989111 0,107.49497 c 0,42.84668 4.39453,76.13476 13.18359,99.86523 9.0088,23.51074 21.42383,35.26563 37.24414,35.26563 16.25976,0 28.7832,-11.64454 37.57227,-34.93555 9.22851,-23.29102 13.8418,-55.7002 13.8418,-97.22852 0,-92.065419 -16.25782,-138.099599 -48.77735,-138.099599 z" />`
  );

  // Y-Left
  const vertexSets1 = [];
  const points1 = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[0], 50);
  vertexSets1.push(points1);
  const body1 = Matter.Bodies.fromVertices(offset.x + 174, offset.y + 180, vertexSets1, { isStatic: true });
  Matter.World.add(engine.world, body1);

  // YO-middle
  const vertexSets2 = [];
  const points2 = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[1], 50);
  vertexSets2.push(points2);
  const body2 = Matter.Bodies.fromVertices(offset.x + 419, offset.y + 273, vertexSets2, { isStatic: true });
  Matter.World.add(engine.world, body2);

  // YO-middle-inverse
  const vertexSets3 = [];
  const points3 = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[2], 50);
  vertexSets3.push(points3);
  const body3 = Matter.Bodies.fromVertices(offset.x + 822, offset.y + 261, vertexSets3, { isStatic: true });
  Matter.World.add(engine.world, body3);

  // O-inner
  const vertexSets4 = [];
  const points4 = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[3], 20);
  vertexSets4.push(points4);
  const body4 = Matter.Bodies.fromVertices(0, 0, vertexSets4, { isStatic: true });
  Matter.World.add(engine.world, body4);
  Matter.Body.setPosition(body4, Matter.Vector.create(offset.x + 620, offset.y + 300));

  const addParticleTasks = [
    addParticles(PARTICLE_COUNT.Y / 2, 50, offset.x + 100, offset.y + 150),
    addParticles(PARTICLE_COUNT.Y / 2, 50, offset.x + 350, offset.y + 150),
    addParticles(PARTICLE_COUNT.O / 2, 50, offset.x + 500, offset.y + 150),
    addParticles(PARTICLE_COUNT.O / 2, 50, offset.x + 750, offset.y + 150)
  ];
  Promise
    .all(addParticleTasks)
    .then(() =>{
      gravityNoise = true;
    });

  initMouseControls();

  two.update();

  animator.start();
}


async function addParticles(count: number, delay: number, x: number, y: number) {
  for (let i = 0; i < count; i++) {
    addParticle(x, y);
    await wait(delay);
  }
}


function addParticle(x: number, y: number) {
  const radius = PARTICLE_RADIUS;
  const body = Matter.Bodies.circle(x, y, radius, {
    friction: 0,
    frictionStatic: 0
  }, 5);
  Matter.World.add(engine.world, body);
  Matter.Body.setVelocity(body, { x: 0, y: 4 });

  const view = two.makeCircle(x, y, radius);
  view.noStroke();
  view.fill = COLORS.PARTICLE;

  particles.push([body, view]);
}


function updateParticles() {
  particles.forEach(([body, shape]) => {
    shape.translation.set(body.position.x, body.position.y);
    // shape.rotation = body.angle;
  });
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();

  if (gravityNoise) {
    const i = frameCount * 0.01;
    engine.world.gravity.x = noise.noise.perlin2(10, i) * NOISE_FACTOR;
    engine.world.gravity.y = noise.noise.perlin2(1, i) * NOISE_FACTOR;
    frameCount += 1;
  }

  Matter.Engine.update(engine, 1000 / 60);
  // Matter.Render.run(render);
  updateParticles();
  two.update();

  if (ENABLE_STATS) stats.end();
}


function initMouseControls() {
  const mouse = Matter.Mouse.create((two as any).renderer.domElement);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: { angularStiffness: 0 }
  });
  Matter.World.add(engine.world, mouseConstraint);
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
