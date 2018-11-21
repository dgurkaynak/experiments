import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Wave2dCanvas from './wave2d-canvas';

require('../utils/three/ctm/ctm-loader');
import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';
import { major } from 'semver';


/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = true;


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
const camera = new THREE.PerspectiveCamera(50, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const rayCaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
let mesh: THREE.Mesh;
const wave2dCanvas = new Wave2dCanvas(64, 16);
const ctmLoader = new THREE.CTMLoader();
const textureLoader = new THREE.TextureLoader();



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  renderer.setClearColor(0x000000);
  renderer.setSize(resizer.width, resizer.height);
  elements.container.appendChild(renderer.domElement);
  resizer.resize = onWindowResize;
  resizer.init();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  camera.position.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
  pointLight.position.set(0, 1, 2);
  scene.add(pointLight);

  wave2dCanvas.dampeningFactor = 0.95;
  wave2dCanvas.pullStrength = 0.01;
  wave2dCanvas.draw();

  // wave2dCanvas.canvas.id = 'head-displacement-map';
  // wave2dCanvas.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
  // document.body.appendChild(wave2dCanvas.canvas);

  const [
    geometry,
    map,
    normalMap
  ] = await Promise.all([
    loadCTM(headCtmPath),
    loadTexture(colorMapTexturePath),
    loadTexture(normalMapTexturePath),
  ]);

  const material = new THREE.MeshStandardMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    metalness: 0.1,
    roughness: 0.5,
    displacementMap: new THREE.CanvasTexture(wave2dCanvas.canvas),
    displacementScale: 0.05,
    displacementBias: -0.025,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 0.1;
  mesh.scale.setScalar(2.25);

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  renderer.domElement.addEventListener('click', onClick, false);

  animator.start();
}


function onClick(e: MouseEvent) {
  mousePosition.x = (e.clientX / (resizer.width / resizer.dimensionScaleFactor)) * 2 - 1;
  mousePosition.y = - (e.clientY / (resizer.height / resizer.dimensionScaleFactor)) * 2 + 1;

  rayCaster.setFromCamera(mousePosition, camera);
  const intersects = rayCaster.intersectObject(mesh, true);

  if (intersects[0]) {
    const intersect: any = intersects[0];
    const x = Math.floor(intersect.uv.x * 1024);
    const y = Math.floor((1 - intersect.uv.y) * 1024);
    console.log('Applying force...', x, y);
    wave2dCanvas.applyForce(x, y, -2);
  }
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  wave2dCanvas.draw();
  wave2dCanvas.iterate();
  if (mesh) (<any>mesh.material).displacementMap.needsUpdate = true;
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}


function loadCTM(path): Promise<THREE.Geometry> {
  return new Promise((resolve, reject) => {
    ctmLoader.load(path, resolve);
  });
}


function loadTexture(path): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => textureLoader.load(path, resolve, null, reject));
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
  orbitControls && orbitControls.dispose();
  renderer.domElement.removeEventListener('click', onClick, false);
  renderer.dispose();
  mesh.geometry.dispose();
  (<any>mesh.material).dispose();

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
