import Experiment from './experiment';
import routes from './routes';


const containerEl = document.getElementById('container');
const statsEl = document.getElementById('stats');


async function load(exp: Experiment) {
  if (window.currentExperiment) await unload();
  window.currentExperiment = exp;

  await exp.init();
  animate();
}


async function animate() {
  if (!window.currentExperiment) return;
  if (!window.currentExperiment.requestAnimationFrame) return;

  if (window.currentExperiment.stats) {
    const stats = window.currentExperiment.stats;

    window.currentAnimationFrame = requestAnimationFrame(() => {
      stats.begin();
      window.currentExperiment.requestAnimationFrame();
      stats.end();
      animate();
    });
  } else {
    window.currentAnimationFrame = requestAnimationFrame(() => {
      window.currentExperiment.requestAnimationFrame();
      animate();
    });
  }
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

  if (!hash || !routes[hash]) {
    console.error(`Oops, experiment #${hash} does not exist`);
    return;
  }

  const Experiment = await routes[hash];
  load(new Experiment.default());
}
onHashChange();
