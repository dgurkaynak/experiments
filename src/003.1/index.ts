import * as THREE from 'three';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Clock from '../utils/clock';
import colors from 'nice-color-palettes';
import sampleSize from 'lodash/sampleSize';


/**
 * Constants
 */
const ENABLE_STATS = false;
const ENABLE_ORBIT_CONTROLS = false;

const DISTANCE = 50;
const NUMBER_OF_BOXES_X = 10;
const NUMBER_OF_BOXES_Y = 10;

const GUISettings = class {
  rotatePeriod = 2;
  lineWidth = 2;
  lineColor = '#000';
  bgColor = '#FEF8EC';

  randomizeColors = () => {
    const randomTwoColors = sampleSize(sampleSize(colors, 1)[0], 2);
    settings.bgColor = randomTwoColors[0];
    setBackgroundAndFaceColor(settings.bgColor);
    settings.lineColor = randomTwoColors[1];
    setLineColor(settings.lineColor);
  };
};


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
const resizer = new CanvasResizer(renderer.domElement, {
  dimension: [1024, 1024],
  dimensionScaleFactor: window.devicePixelRatio
});
const animator = new Animator(animate);
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(150, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const clock = new Clock();
const geometry = new THREE.BoxBufferGeometry(25, 25, 25);
const material = new THREE.MeshBasicMaterial({ color: settings.bgColor, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const lineMaterial = new THREE.LineBasicMaterial({ color: settings.lineColor, linewidth: settings.lineWidth });
const boxes: THREE.Mesh[][] = [];



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  renderer.setSize(resizer.width, resizer.height);
  elements.container.appendChild(renderer.domElement);
  resizer.resize = onWindowResize;
  resizer.init();

  // Settings
  gui.add(settings, 'rotatePeriod', 0.1, 5).step(0.1);
  gui.add(settings, 'lineWidth', 1, 5).step(1).onChange(w => lineMaterial.linewidth = w);
  gui.addColor(settings, 'lineColor').listen().onChange(setLineColor);
  gui.addColor(settings, 'bgColor').listen().onChange(setBackgroundAndFaceColor);
  gui.add(settings, 'randomizeColors');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  camera.position.set(0, 0, 100);
  renderer.setClearColor(settings.bgColor);

  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    const line: THREE.Mesh[] = [];

    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const mesh = new THREE.Mesh(geometry, material);
      const geo = new THREE.EdgesGeometry(geometry);
      const wireframe = new THREE.LineSegments(geo, lineMaterial);
      mesh.add(wireframe);

      const offsetX = (NUMBER_OF_BOXES_X - 1) / 2;
      const offsetY = (NUMBER_OF_BOXES_Y - 1) / 2;
      mesh.position.x = DISTANCE * -offsetX + (DISTANCE * i);
      mesh.position.y = DISTANCE * -offsetY + (DISTANCE * j);

      mesh.rotateZ(Math.PI / 18 * j);
      mesh.rotateX(Math.PI / 18 * i);

      scene.add(mesh);
      line.push(mesh);
    }

    boxes.push(line);
  }

  animator.start();
}


/**
 * Sets background and cube's face color
 */
function setBackgroundAndFaceColor(color) {
  renderer.setClearColor(color);
  material.color.set(color);
}


/**
 * Sets cube's line color
 */
function setLineColor(color) {
  lineMaterial.color.set(color);
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  const tDelta = clock.getDelta();

  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const box = boxes[i][j];
      box.rotateY((tDelta / settings.rotatePeriod) * (i / 9 + 1));
    }
  }
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}


/**
 * Clean your shit
 */
function dispose() {
  animator.dispose();
  resizer.destroy();
  renderer.dispose();
  orbitControls && orbitControls.dispose();
  geometry.dispose();
  material.dispose();

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
