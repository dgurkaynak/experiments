import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import GeometrySpringModifier from './spring-modifier';

require('../utils/three/ctm/ctm-loader');
import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import specularMapTexturePath from './assets/Map-SPEC.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';


/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = true;
const SPRING_DISPLACE_MAGNITUDE = 0.00005;
const SPRING_STRENGTH = 0.0005;
const DAMPEN = 0.9999;


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

  const geometry = new THREE.Geometry().fromBufferGeometry(geometry_);
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
  springModifier.SPRING_STRENGTH = SPRING_STRENGTH;
  springModifier.DAMPEN = DAMPEN;

  renderer.domElement.addEventListener('mousemove', onMouseMove, false);

  animator.start();
}


function onMouseMove(e: MouseEvent) {
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
    springModifier.displaceFace(intersects[0].face, SPRING_DISPLACE_MAGNITUDE);
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
