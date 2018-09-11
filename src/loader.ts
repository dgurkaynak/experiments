import * as THREE from 'three';
import * as eyes from './04-eyes';


interface Experiment {
  renderer: THREE.WebGLRenderer;
  init(): Promise<void>;
  destroy(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  animate();
}


const canvasContainerEl = document.getElementById('canvas-container');


async function load(exp: Experiment) {
  if (window.currentExperiment) await unload();
  window.currentExperiment = exp; 

  canvasContainerEl.appendChild(exp.renderer.domElement);
  await exp.init();
  await exp.start();
  animate(); 
}


async function animate() {
  if (!window.currentExperiment) return;
  window.currentAnimationFrame = requestAnimationFrame(() => {
    window.currentExperiment.animate();
    animate();
  });
}


async function unload() {
  while (canvasContainerEl.firstChild) {
    canvasContainerEl.removeChild(canvasContainerEl.firstChild);
  }

  cancelAnimationFrame(window.currentAnimationFrame);
  await window.currentExperiment.stop();
  await window.currentExperiment.destroy();
  window.currentExperiment = null;
  window.currentAnimationFrame = null;
}


load(eyes);
