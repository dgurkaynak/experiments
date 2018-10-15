import Experiment from './experiment';
import routes from './routes';

const containerEl = document.getElementById('container');


async function load(exp: Experiment) {
  if (window.currentExperiment) await unload();
  window.currentExperiment = exp;

  await exp.init();
  animate();
}


async function animate() {
  if (!window.currentExperiment) return;
  if (!window.currentExperiment.requestAnimationFrame) return;

  window.currentAnimationFrame = requestAnimationFrame(() => {
    window.currentExperiment.requestAnimationFrame();
    animate();
  });
}


async function unload() {
  while (containerEl.firstChild) {
    containerEl.removeChild(containerEl.firstChild);
  }

  cancelAnimationFrame(window.currentAnimationFrame);
  await window.currentExperiment.destroy();
  window.currentExperiment = null;
  window.currentAnimationFrame = null;
}


const onHashChange = window.onhashchange = async function() {
  const hash = window.location.hash.substr(1).trim();
  const hashInt = parseInt(hash, 10);

  if (isNaN(hashInt) || !routes[hashInt]) {
    console.error(`Oops, experiment #${hash} does not exist`);
    return;
  }

  const Experiment = await routes[hashInt];
  load(new Experiment.default());
}
onHashChange();
