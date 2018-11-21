import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import PerlinCanvas from '../utils/perlin-canvas';

import theBoldFontData from './the-bold-font.json';


/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = true;

const COLORS = {
  BG: 0x000000,
  FONT: 0xff0000,
};
const TEXT_LINES = [ 'HAYAT', 'HOYRAT' ];


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
const camera = new THREE.PerspectiveCamera(35, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const fontLoader = new THREE.FontLoader();
const perlinCanvas = new PerlinCanvas(128);
const meshes: THREE.Mesh[] = [];



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
  renderer.setClearColor(COLORS.BG);

  camera.position.set(2.5, 2.5, 10);
  // camera.position.multiplyScalar(1.75);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 10);
  pointLight.position.set(-1, 0, 3);
  scene.add(pointLight);

  perlinCanvas.noiseDivider = 10;
  perlinCanvas.draw();

  // perlinCanvas.canvas.id = 'perlinCanvas1';
  // perlinCanvas.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
  // document.body.appendChild(perlinCanvas.canvas);

  const font = fontLoader.parse(theBoldFontData);

  TEXT_LINES.forEach((text, i) => {
    const geometry = new THREE.TextGeometry(text, {
      font: font,
      size: 1,
      height: 0.75,
      curveSegments: 12
    });

    const texture = new THREE.CanvasTexture(perlinCanvas.canvas);
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.flipY = i % 2 == 0;

    const material = new THREE.MeshStandardMaterial({
      color: COLORS.FONT,
      displacementMap: texture,
      displacementScale: 0.1,
      displacementBias: -0.05,
      metalness: 0.1,
      roughness: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.x = -2.6;
    mesh.position.y = -1.1 * i;
    scene.add(mesh);

    meshes.push(mesh);
  });

  animator.start();
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  perlinCanvas.draw();
  meshes.forEach((mesh) => {
    (<THREE.MeshStandardMaterial>mesh.material).displacementMap.needsUpdate = true;
  });
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
  meshes.forEach((mesh) => {
    mesh.geometry.dispose();
    (<THREE.MeshStandardMaterial>mesh.material).dispose();
  });

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
