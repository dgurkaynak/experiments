import * as THREE from 'three';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import Clock from '../utils/clock';
import { noise } from '../utils/noise';
import colors from 'nice-color-palettes';
import sampleSize from 'lodash/sampleSize';


/**
 * Constants
 */
const ENABLE_STATS = false;
const ENABLE_ORBIT_CONTROLS = false;
const NUMBER_X = 75;
const NUMBER_Z = 50;
const SPHERE_DISTANCE = 1;

// Nice color combos
// #dce9be - #555152
// #2a2c31 - #fffedf

const GUISettings = class {
  waveType = 'perlin';

  bgColor = '#2a2c31';
  sphereColor = '#fffedf';
  sphereRadius = 0.075;

  xFactor = 0.1;
  zFactor = 0.16;
  timeFactor = 0.4;

  totalScale = 3;

  randomizeColors = () => {
    const randomTwoColors = sampleSize(sampleSize(colors, 1)[0], 2);
    settings.bgColor = randomTwoColors[0];
    setBackgroundAndFogColor(settings.bgColor);
    settings.sphereColor = randomTwoColors[1];
    setSphereColor(settings.sphereColor);
  }
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
const camera = new THREE.PerspectiveCamera(75, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const clock = new Clock();
const geometry = new THREE.SphereGeometry(1);
const material = new THREE.MeshBasicMaterial({ color: settings.sphereColor });
const meshes: THREE.Mesh[][] = [];



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  renderer.setSize(resizer.width, resizer.height);
  elements.container.appendChild(renderer.domElement);
  resizer.resize = onWindowResize;
  resizer.init();

  // Settings
  gui.add(settings, 'waveType', [ 'sinusoidal', 'perlin', 'simplex' ] );
  gui.close();

  const waveSettings = gui.addFolder('Wave');
  waveSettings.add(settings, 'totalScale', 0.5, 3.0).step(0.1);
  waveSettings.add(settings, 'timeFactor', 0.1, 1.5).step(0.05);
  waveSettings.add(settings, 'xFactor', 0.01, 0.5).step(0.01);
  waveSettings.add(settings, 'zFactor', 0.01, 0.5).step(0.01);

  const viewSettings = gui.addFolder('View');
  viewSettings.add(settings, 'sphereRadius', 0.01, 0.1).step(0.005).onChange((val) => {
    meshes.forEach(line => line.forEach(mesh => mesh.scale.set(val, val, val)));
  });
  viewSettings.addColor(settings, 'bgColor').listen().onChange(setBackgroundAndFogColor);
  viewSettings.addColor(settings, 'sphereColor').listen().onChange(setSphereColor);
  viewSettings.add(settings, 'randomizeColors');

  // Scene fog
  scene.fog = new THREE.Fog(settings.bgColor as any, SPHERE_DISTANCE, SPHERE_DISTANCE * NUMBER_Z);

  // Show FPS
  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  renderer.setClearColor(settings.bgColor);
  camera.position.set(0, 4, NUMBER_Z / 2 * SPHERE_DISTANCE);

  for (let i = 0; i < NUMBER_X; i++) {
    const line: THREE.Mesh[] = [];

    for (let j = 0; j < NUMBER_Z; j++) {
      const mesh = new THREE.Mesh(geometry, material);

      mesh.scale.set(settings.sphereRadius, settings.sphereRadius, settings.sphereRadius);
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
 * Sets background and fog color.
 */
function setBackgroundAndFogColor(color: string) {
  scene.fog.color.set(color as any);
  renderer.setClearColor(color);
}


/**
 * Sets sphere material color.
 */
function setSphereColor(color: string) {
  material.color = new THREE.Color(color);
}


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  const t = clock.getElapsedTime();

  switch (settings.waveType) {
    case 'sinusoidal': {
      for (let i = 0; i < NUMBER_X; i++) {
        for (let j = 0; j < NUMBER_Z; j++) {
          const mesh = meshes[i][j];
          mesh.position.y = settings.totalScale * (
            Math.sin(i * settings.xFactor + t * settings.timeFactor) +
            Math.cos(j * settings.zFactor + t * settings.timeFactor)
          );
        }
      }
      break;
    }

    case 'simplex': {
      for (let i = 0; i < NUMBER_X; i++) {
        for (let j = 0; j < NUMBER_Z; j++) {
          const mesh = meshes[i][j];
          mesh.position.y = settings.totalScale * noise.simplex3(
            i * settings.xFactor,
            j * settings.zFactor,
            t * settings.timeFactor
          );
        }
      }
      break;
    }

    case 'perlin': {
      for (let i = 0; i < NUMBER_X; i++) {
        for (let j = 0; j < NUMBER_Z; j++) {
          const mesh = meshes[i][j];
          mesh.position.y = settings.totalScale * noise.perlin3(
            i * settings.xFactor,
            j * settings.zFactor,
            t * settings.timeFactor
          );
        }
      }
      break;
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
