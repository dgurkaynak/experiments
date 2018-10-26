import Experiment from './experiment';
import routes from './routes';


const containerEl = document.getElementById('container');
const statsEl = document.getElementById('stats');
let currentExperiment: Experiment = (window as any).experiment;
let currentAnimationFrame: number = (window as any).currentAnimationFrame;


async function load(exp: Experiment) {
  if (currentExperiment) await unload();
  setCurrentExperiment(exp);

  await exp.init();
  animate();
}


async function animate() {
  if (!currentExperiment) return;
  if (!currentExperiment.requestAnimationFrame) return;

  const stats = (currentExperiment as any).stats;

  if (stats) {
    const frameNumber = requestAnimationFrame(() => {
      stats.begin();
      currentExperiment.requestAnimationFrame();
      stats.end();
      animate();
    });
    setCurrentAnimationFrame(frameNumber);
  } else {
    const frameNumber = requestAnimationFrame(() => {
      currentExperiment.requestAnimationFrame();
      animate();
    });
    setCurrentAnimationFrame(frameNumber);
  }
}


async function unload() {
  while (containerEl.firstChild) {
    containerEl.removeChild(containerEl.firstChild);
  }

  while (statsEl.firstChild) {
    statsEl.removeChild(statsEl.firstChild);
  }

  cancelAnimationFrame(currentAnimationFrame);
  await currentExperiment.destroy();
  setCurrentExperiment(null);
  setCurrentAnimationFrame(null);
}


function setCurrentExperiment(experiment: Experiment) {
  currentExperiment = (window as any).experiment = experiment;
}


function setCurrentAnimationFrame(frameNumber: number) {
  currentAnimationFrame = (window as any).animationFrame = frameNumber;
}


const onHashChange = async function() {
  const hash = window.location.hash.substr(1).trim();

  if (!hash || !routes[hash]) {
    console.error(`Oops, experiment #${hash} does not exist`);
    return;
  }

  const Experiment = await routes[hash];
  load(new Experiment.default());
}
window.onhashchange = onHashChange;
onHashChange();
