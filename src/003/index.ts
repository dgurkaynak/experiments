// http://bigblueboo.tumblr.com/post/145035932469/from-all-angles#notes

import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';


/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = true;

const DISTANCE = 50;
const NUMBER_OF_BOXES_X = 10;
const NUMBER_OF_BOXES_Y = 10;
const COLORS = {
  BG: 0xffffff,
  FACE: 0xffffff,
  LINE: 0x000000,
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
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const animator = new Animator(animate);
const stats = new Stats();
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  resizer.width / resizer.dimensionScaleFactor / -2,
  resizer.width / resizer.dimensionScaleFactor / 2,
  resizer.height / resizer.dimensionScaleFactor / 2,
  resizer.height / resizer.dimensionScaleFactor / -2,
  0.1,
  1000
);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const geometry = new THREE.BoxBufferGeometry(25, 25, 25);
const material = new THREE.MeshBasicMaterial({ color: COLORS.FACE, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const boxes: THREE.Mesh[][] = [];



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  renderer.setSize(resizer.width, resizer.height);
  elements.container.appendChild(renderer.domElement);
  resizer.resize = onWindowResize;
  resizer.init();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  camera.position.set(0, 0, 100);
  renderer.setClearColor(COLORS.BG);

  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    const line: THREE.Mesh[] = [];

    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const mesh = new THREE.Mesh(geometry, material);
      const geo = new THREE.EdgesGeometry(geometry);
      const mat = new THREE.LineBasicMaterial({ color: COLORS.LINE, linewidth: 1 });
      const wireframe = new THREE.LineSegments(geo, mat);
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
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const box = boxes[i][j];
      box.rotateY(0.01 * (i / 9 + 1));
    }
  }
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  camera.left = width / resizer.dimensionScaleFactor / -2;
  camera.right = width / resizer.dimensionScaleFactor / 2;
  camera.top = height / resizer.dimensionScaleFactor / 2;
  camera.bottom = height / resizer.dimensionScaleFactor / -2;
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
