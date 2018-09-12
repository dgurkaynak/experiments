import IExperiment from './iexperiment';


const EXPERIMENTS = {
  1: import('./01-waves'),
  3: import('./03-rotating-cubes'),
  4: import('./04-eyes'),
  5: import('./05-head'),
};

const canvasContainerEl = document.getElementById('canvas-container');


async function load(exp: IExperiment) {
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


const onHashChange = window.onhashchange = async function() {
  const hash = window.location.hash.substr(1).trim();
  const hashInt = parseInt(hash, 10);

  if (isNaN(hashInt) || !EXPERIMENTS[hashInt]) {
    console.error(`Oops, experiment #${hash} does not exist`);
    return;
  }

  const Experiment = await EXPERIMENTS[hashInt];
  load(new Experiment.default());
}
onHashChange();
