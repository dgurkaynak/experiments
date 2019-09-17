import * as THREE from 'three';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import GeometrySpringModifier from './spring-modifier';
import { disableBodyScroll } from 'body-scroll-lock';
import detectIt from 'detect-it';

require('../utils/three/ctm/ctm-loader');
import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import specularMapTexturePath from './assets/Map-SPEC.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';


/**
 * Constants
 */
const ENABLE_STATS = false;
const ENABLE_ORBIT_CONTROLS = false;

const GUISettings = class {
  springDisplaceMagnitude = 0.00010;
  springStrength = 0.0010;
  dampen = 0.9999;
};


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
  message: document.getElementById('message'),
};
const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
const resizer = new CanvasResizer(renderer.domElement, {
  dimension: 'fullscreen',
  dimensionScaleFactor: 1
});
const animator = new Animator(animate);
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const rayCaster = new THREE.Raycaster();
const mousePosition = new THREE.Vector2();
let mesh: THREE.Mesh;
let springModifier: GeometrySpringModifier;
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

  // Disable body scroll
  disableBodyScroll(document.body);

  // Settings
  gui.add(settings, 'springDisplaceMagnitude', 0.00001, 0.00025).step(0.00001).listen();
  gui.add(settings, 'springStrength', 0.0001, 0.0050).step(0.0001).listen().onChange((val) => {
    springModifier.SPRING_STRENGTH = val;
  });
  gui.add(settings, 'dampen', 0.9990, 0.999999).step(0.00001).onChange((val) => {
    springModifier.DAMPEN = val;
  });
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  if (detectIt.primaryInput == 'touch') {
    settings.springDisplaceMagnitude = 0.00020;
    elements.message.textContent = 'Swipe on me';
    elements.message.style.left = 'calc(50% - 4.5em)';
    // elements.message.style.fontSize = '24px';
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      onMouseMove({
        offsetX: e.changedTouches[0].clientX,
        offsetY: e.changedTouches[0].clientY
      } as any);
    };
    elements.message.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
  } else {
    elements.message.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
  }

  // Start experiment
  camera.position.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
  pointLight.position.set(0, 1, 2);
  scene.add(pointLight);

  const [
    geometry_,
    map,
    normalMap,
    specularMap
  ] = await Promise.all([
    loadCTM(headCtmPath),
    loadTexture(colorMapTexturePath),
    loadTexture(normalMapTexturePath),
    loadTexture(specularMapTexturePath),
  ]);

  const geometry = new THREE.Geometry().fromBufferGeometry(geometry_ as any);
  const material = new THREE.MeshPhongMaterial({
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    specularMap,
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = 0.1;
  mesh.scale.setScalar(2.25);

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  springModifier = new GeometrySpringModifier(geometry);
  springModifier.SPRING_STRENGTH = settings.springStrength;
  springModifier.DAMPEN = settings.dampen;

  animator.start();
}


function onMouseMove(e: MouseEvent) {
  if (!mesh) return;

  const mouseX = e.offsetX || e.clientX;
  const mouseY = e.offsetY || e.clientY;

  const vector = new THREE.Vector3(
    (mouseX / window.innerWidth) * 2 - 1,
    -(mouseY / window.innerHeight) * 2 + 1,
    0.5
  );

  vector.unproject(camera);
  rayCaster.set(camera.position, vector.sub(camera.position).normalize());
  const intersects = rayCaster.intersectObject(mesh);

  if(intersects.length) {
    springModifier.displaceFace(intersects[0].face, settings.springDisplaceMagnitude);
    elements.message.style.display = 'none';
  }
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  if (mesh) {
    springModifier.updateVertexSprings();
    (<any>mesh.geometry).verticesNeedUpdate = true;
    (<any>mesh.geometry).normalsNeedUpdate = true;
    (<any>mesh.geometry).computeFaceNormals();
    mesh.geometry.computeVertexNormals();
  }
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
  renderer.domElement.removeEventListener('mousemove', onMouseMove, false);
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
