// Global deps:
// - three
// - stats.js
// - dat.gui
// - three-orbit-controls
// - nice-color-palettes
// - lodash/sampleSize

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { Animator } from '../lib/animator.js';
import { PerlinCanvas } from '../lib/perlin-canvas.js';

import theBoldFontData from './the-bold-font.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const ENABLE_ORBIT_CONTROLS = false;

const GUISettings = class {
  constructor() {
    this.lineCount = 2;
    this.lineText1 = 'WHAT';
    this.lineText2 = 'EVER.';
    this.lineText3 = '';
    this.lineText4 = '';
    this.lineText5 = '';
    this.lineText6 = '';
    this.lineText7 = '';
    this.lineText8 = '';
    this.lineText9 = '';
    this.lineText10 = '';

    this.bgColor = '#000';
    this.fontColor = '#ff0000';

    this.fontSize = 1;
    this.xOffset = -1.65;
  }

  randomizeColors() {
    const randomTwoColors = _.sampleSize(_.sampleSize(niceColorPalettes100, 1)[0], 2);
    settings.bgColor = randomTwoColors[0];
    setBackgroundColor(settings.bgColor);
    settings.fontColor = randomTwoColors[1];
    setFontColor(settings.fontColor);
  };
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const renderer = new THREE.WebGLRenderer({
  antialias: window.devicePixelRatio == 1,
});
const resizer = new CanvasResizer(renderer.domElement, {
  dimension: [1024, 1024],
  dimensionScaleFactor: window.devicePixelRatio,
});
const animator = new Animator(animate);
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  resizer.width / resizer.height,
  0.1,
  1000
);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;

/**
 * Experiment variables
 */
const fontLoader = new THREE.FontLoader();
let font;
const perlinCanvas = new PerlinCanvas(128);
let meshes = [];
const texture = new THREE.CanvasTexture(perlinCanvas.canvas);
texture.wrapS = THREE.MirroredRepeatWrapping;
texture.wrapT = THREE.MirroredRepeatWrapping;
// texture.flipY = i % 2 == 0;

const material = new THREE.MeshStandardMaterial({
  color: settings.fontColor,
  displacementMap: texture,
  displacementScale: 0.1,
  displacementBias: -0.05,
  metalness: 0.1,
  roughness: 0.5,
});

/**
 * Settings
 */
gui.close();

const viewSettings = gui.addFolder('View');
viewSettings
  .addColor(settings, 'bgColor')
  .listen()
  .onChange(setBackgroundColor);
viewSettings.addColor(settings, 'fontColor').listen().onChange(setFontColor);
viewSettings.add(settings, 'randomizeColors');

const textSettings = gui.addFolder('Text');
let lineTextControllers = [];
textSettings
  .add(settings, 'lineCount', 1, 10)
  .step(1)
  .onFinishChange(setupScene);
textSettings.add(settings, 'fontSize', 0.5, 2).step(0.01).onChange(setupScene);
textSettings.add(settings, 'xOffset', -5, 5).step(0.01).onChange(setupScene);

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
  renderer.setClearColor(settings.bgColor);

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

  font = fontLoader.parse(theBoldFontData);
  setupScene();
  animator.start();
}

function setupScene() {
  // Remove the old ones
  meshes.forEach((mesh) => {
    mesh.geometry.dispose();
    scene.remove(mesh);
  });
  meshes = [];

  // Remove old dat.gui controllers
  lineTextControllers.forEach((controller) => {
    textSettings.remove(controller);
  });
  lineTextControllers = [];

  // Add new ones
  for (let i = 0; i < settings.lineCount; i++) {
    const text = settings['lineText' + (i + 1)];
    const geometry = new THREE.TextGeometry(text, {
      font: font,
      size: settings.fontSize,
      height: settings.fontSize * 0.75,
      curveSegments: 12,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.x = settings.xOffset;
    mesh.position.y =
      -(settings.fontSize * 1.1) * (i + 1 - settings.lineCount / 2);
    scene.add(mesh);
    meshes.push(mesh);

    // Add new dat.gui
    const controller = textSettings
      .add(settings, 'lineText' + (i + 1))
      .onFinishChange(setupScene);
    lineTextControllers.push(controller);
  }
}

/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  perlinCanvas.draw();
  meshes.forEach((mesh) => {
    mesh.material.displacementMap.needsUpdate = true;
  });
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}

function setBackgroundColor(color) {
  renderer.setClearColor(color);
}

function setFontColor(color) {
  material.color = new THREE.Color(color);
}

/**
 * On window resized
 */
function onWindowResize(width, height) {
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
    mesh.material.dispose();
  });

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

main().catch((err) => console.error(err));
