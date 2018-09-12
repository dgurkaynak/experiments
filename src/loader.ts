import * as THREE from 'three';


const EXPERIMENTS = {
  1: import('./01-waves'),
  3: import('./03-rotating-cubes'),
  4: import('./04-eyes'),
};


interface Experiment {
  renderer: THREE.WebGLRenderer;
  init(): Promise<void>;
  destroy(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  animate();
}


const canvasContainerEl = document.getElementById('canvas-container');
window.addEventListener('hashchange', onHashChange, false);


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


async function onHashChange() {
  const hash = window.location.hash.substr(1).trim();
  const hashInt = parseInt(hash, 10);

  if (isNaN(hashInt) || !EXPERIMENTS[hashInt]) {
    console.error(`Oops, experiment #${hash} does not exist`);
    return;
  }

  const exp = await EXPERIMENTS[hashInt];
  load(exp);
}
onHashChange();
