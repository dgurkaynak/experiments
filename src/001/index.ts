import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Clock from '../utils/clock';


/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = false;

const BG_COLOR = 0x000000;
const SPHERE_COLOR = 0xffffff;
const SPHERE_RADIUS = 0.025;
const NUMBER_X = 50;
const NUMBER_Z = 50;
const SPHERE_DISTANCE = 1;


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
const camera = new THREE.PerspectiveCamera(75, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const clock = new Clock();
const geometry = new THREE.SphereGeometry(SPHERE_RADIUS);
const material = new THREE.MeshBasicMaterial({ color: SPHERE_COLOR });
const meshes: THREE.Mesh[][] = [];



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
  renderer.setClearColor(BG_COLOR);
  camera.position.set(0, 4, NUMBER_Z / 2 * SPHERE_DISTANCE);

  for (let i = 0; i < NUMBER_X; i++) {
    const line: THREE.Mesh[] = [];

    for (let j = 0; j < NUMBER_Z; j++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = i * SPHERE_DISTANCE - (NUMBER_X / 2 * SPHERE_DISTANCE);
      mesh.position.z = j * SPHERE_DISTANCE - (NUMBER_Z / 2 * SPHERE_DISTANCE);
      line.push(mesh);
      scene.add(mesh);
    }

    meshes.push(line);
  }

  animator.start();
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  const t = clock.getElapsedTime();
  for (let i = 0; i < NUMBER_X; i++) {
    for (let j = 0; j < NUMBER_Z; j++) {
      const mesh = meshes[i][j];
      mesh.position.y = (Math.sin(i * 0.5 + t) + Math.cos(j * 0.5 + t)) * 0.5;
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
