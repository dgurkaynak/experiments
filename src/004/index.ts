// http://bigblueboo.tumblr.com/post/171834504103/bigblueboo-eyes-see-you#notes
// http://bigblueboo.tumblr.com/post/174117883078/bigblueboo-eyeball#notes

import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import TWEEN from '@tweenjs/tween.js';
import EyeMeshFactory from './eye-factory';
import pointsOnSphere from '../utils/three/points-on-sphere';
import { tweenX, tweenY, tweenZ, tweenToCamera } from './tweens';



/**
 * Constants
 */
const ENABLE_STATS = true;
const ENABLE_ORBIT_CONTROLS = false;


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
const eyeFactory = new EyeMeshFactory();
const eyes: THREE.Group[] = [];



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
  renderer.setClearColor(0x000000);
  camera.position.set(0, 0, 50);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 0, 0);
  scene.add(pointLight);

  await eyeFactory.init();

  pointsOnSphere(150).forEach((pos) => {
    const eye = eyeFactory.create();

    const scale = 10.5;
    eye.position.set(pos.x * scale, pos.y * scale, pos.z * scale * 5);
    scene.add(eye);

    // Cache rotation to camera
    eye.lookAt(camera.position);
    (eye as any)._rotationToCamera = { x: eye.rotation.x, y: eye.rotation.y, z: eye.rotation.z };

    // Randomize rotation
    eye.rotation.set(
      (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.5) * 1.0,
      (Math.random() - 0.5) * 1.0
    );

    eyes.push(eye);
  });

  // Fine-tune positions
  eyes[10].position.x -= 1;
  eyes[22].position.x += 1;
  eyes[35].position.x += 0.5; eyes[35].position.y -= 0.5;
  eyes[37].position.x += 1; eyes[37].position.z -= 2;
  eyes[103].position.y -= 1; eyes[103].position.z -= 1; eyes[103].position.x -= 0.5;

  startAnimation();

  animator.start();
}


/**
 * Animate stuff...
 */
function animate(highResTimestamp: number) {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  /**
   * TWEEN.update() method requires high precision timestamp for smooth tweening.
   * If you calculate time by yourself, there can be some hiccups, glitches.
   * ALWAYS USE requestAnimationFrame's `highResTimestamp` parameter.
   *
   * https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
   */
  TWEEN.update(highResTimestamp);
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}


function startAnimation() {
  eyes.forEach((eye: any) => {
    tweenX(eye);
    tweenY(eye);
    tweenZ(eye);

    eye._tweenToCameraInterval = setInterval(() => {
      eye._tweenToCameraTimeout = setTimeout(() => tweenToCamera(eye), Math.random() * 150);
    }, 10000);
  });
}


function stopAnimation() {
  eyes.forEach((eye: any) => {
    if (eye._tweenX) eye._tweenX.stop();
    if (eye._tweenY) eye._tweenY.stop();
    if (eye._tweenZ) eye._tweenZ.stop();
    clearTimeout(eye._tweenToCameraTimeout);
    clearInterval(eye._tweenToCameraInterval);
  });
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

  stopAnimation();
  eyes.forEach((eye) => {
    eye.children[0].children.forEach((child: any) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  });

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
