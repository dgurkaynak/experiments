// http://bigblueboo.tumblr.com/post/171834504103/bigblueboo-eyes-see-you#notes
// http://bigblueboo.tumblr.com/post/174117883078/bigblueboo-eyeball#notes

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import EyeMeshFactory from './eye-factory';
import pointsOnSphere from './points-on-sphere';
// require('../utils/three/OrbitControls');


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);
camera.lookAt(new THREE.Vector3(0, 0, 0));
// const controls = new THREE.OrbitControls(camera);

export const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const eyeFactory = new EyeMeshFactory();
const eyes = [];


export async function init() {
  await eyeFactory.init();
  
  pointsOnSphere(150).forEach((pos) => {
    const eye = eyeFactory.create();

    const scale = 10.5;
    eye.position.set(pos.x * scale, pos.y * scale, pos.z * scale * 5);
    scene.add(eye);

    // Cache rotation to camera
    eye.lookAt(camera.position);
    eye._rotationToCamera = {
      x: eye.rotation.x,
      y: eye.rotation.y,
      z: eye.rotation.z
    };

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
}


export async function destroy() {
  renderer.dispose();
  eyes.forEach((eye) => {
    eye.children[0].children.forEach((child) => {
      child.geometry.dispose();
      child.material.dispose();
    });
  });
}


export async function start() {
  eyes.forEach((eye) => {
    tweenX(eye);
    tweenY(eye);
    tweenZ(eye);

    eye._tweenToCameraInterval = setInterval(() => {
      eye._tweenToCameraTimeout = setTimeout(() => tweenToCamera(eye), Math.random() * 150);
    }, 10000);
  });
}


export async function stop() {
  eyes.forEach((eye) => {
    if (eye._tweenX) eye._tweenX.stop();
    if (eye._tweenY) eye._tweenY.stop();
    if (eye._tweenZ) eye._tweenZ.stop();
    clearTimeout(eye._tweenToCameraTimeout);
    clearInterval(eye._tweenToCameraInterval);
  });
}


function tweenX(eye) {
  if (eye._tweenX) eye._tweenX.stop();
  eye._tweenX = new TWEEN.Tween({ x: eye.rotation.x }).to({ x: (Math.random() - 0.5) * 1.75 }, 3000 + (Math.random() - 0.5) * 2500);
  eye._tweenX.onUpdate((data) => {
    eye.rotation.x = data.x;
  });
  // eye._tweenX.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenX.onComplete(() => tweenX(eye));
  eye._tweenX.start();
}


function tweenY(eye) {
  if (eye._tweenY) eye._tweenY.stop();
  eye._tweenY = new TWEEN.Tween({ y: eye.rotation.y }).to({ y: (Math.random() - 0.5) * 1.75 }, 3000 + (Math.random() - 0.5) * 2500);
  eye._tweenY.onUpdate((data) => {
    eye.rotation.y = data.y;
  });
  // eye._tweenY.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenY.onComplete(() => tweenY(eye));
  eye._tweenY.start();
}


function tweenZ(eye) {
  if (eye._tweenZ) eye._tweenZ.stop();
  eye._tweenZ = new TWEEN.Tween({ z: eye.rotation.z }).to({ z: (Math.random() - 0.5) * 0.5 }, 1000 + (Math.random() - 0.5) * 500);
  eye._tweenZ.onUpdate((data) => {
    eye.rotation.z = data.z;
  });
  eye._tweenZ.easing(TWEEN.Easing.Elastic.InOut);
  eye._tweenZ.onComplete(() => tweenZ(eye));
  eye._tweenZ.start();
}


function tweenToCamera(eye) {
  if (eye._tweenX) eye._tweenX.stop();
  if (eye._tweenY) eye._tweenY.stop();
  if (eye._tweenZ) eye._tweenZ.stop();

  eye._tweenToCamera = new TWEEN.Tween({
    x: eye.rotation.x, 
    y: eye.rotation.y, 
    z: eye.rotation.z
  }).to(eye._rotationToCamera, 500);

  eye._tweenToCamera.easing(TWEEN.Easing.Elastic.Out);
  eye._tweenToCamera.onUpdate((data) => {
    eye.rotation.x = data.x;
    eye.rotation.y = data.y;
    eye.rotation.z = data.z;
  });
  eye._tweenToCamera.onComplete(() => {
    setTimeout(() => {
      tweenX(eye);
      tweenY(eye);
      tweenZ(eye);
    }, 1000);
  });
  eye._tweenToCamera.start();
}


export function animate(time) {
  TWEEN.default.update(time);
  // controls.update();
  renderer.render(scene, camera);
}
