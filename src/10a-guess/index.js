// Global deps:
// - p5
// - stats.js
// - dat.gui
// - lodash (times, find, sampleSize, throttle, values)
// - randomColor
// - ml5

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { saveImage } from '../lib/canvas-helper.js';
import { MultipleLineCurveEntity as Entity } from './line-curve.js';
import { IMAGENET_CLASSES } from './classes.js';

/**
 * Constants
 */
const ENABLE_STATS = false;
const MARGIN = 200;

const GUISettings = class {
  targetClass = 'all';

  gridSize = 50;
  minStrokeWidth = 5;
  maxStrokeWidth = 100;
  lineCount = 4;
  linePointCurvePoint = 5;
  lineAlpha = 0.5;
  randomColorCount = 25;

  populationCount = 500;
  mutationRate = 0.2;
  maxGeneration = 10;
  matchThreshold = 0.9;

  saveImage = () => {
    saveImage(resizer.canvas);
  };

  restart = () => {
    restart();
  };

  stop = () => {
    shouldStop = true;
  };
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p;
const resizer = new CanvasResizer(null, {
  dimension: [1080, 1080],
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();

/**
 * Experiment variables
 */
let classifier;
let canvas;
let population;
let validXCoords;
let validYCoords;
let validLineWidths;
let validColors;
let shouldStop = false;

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    // p.draw = draw;
  }, elements.container);

  gui
    .add(settings, 'targetClass', ['all'].concat(_.values(IMAGENET_CLASSES)))
    .onChange(restart);
  gui.add(settings, 'gridSize', 3, 100).step(1).onChange(restart);
  gui.add(settings, 'minStrokeWidth', 1, 10).step(1).onChange(restart);
  gui.add(settings, 'maxStrokeWidth', 10, 500).step(1).onChange(restart);
  gui.add(settings, 'lineCount', 1, 25).step(1).onChange(restart);
  gui.add(settings, 'lineAlpha', 0.1, 1).step(0.01).onChange(restart);
  gui.add(settings, 'linePointCurvePoint', 1, 50).step(1).onChange(restart);
  gui.add(settings, 'randomColorCount', 1, 50).step(1).onChange(restart);
  gui.add(settings, 'populationCount', 100, 1000).step(1);
  gui.add(settings, 'mutationRate', 0.1, 0.99).step(0.01);
  gui.add(settings, 'maxGeneration', 1, 100).step(1);
  gui.add(settings, 'matchThreshold', 0.1, 0.99).step(0.01);
  gui.add(settings, 'saveImage');
  gui.add(settings, 'restart');
  gui.add(settings, 'stop');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}

/**
 * p5's setup function
 */
async function setup() {
  const renderer = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  canvas = resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  // Start experimenting
  p.noStroke();
  p.strokeWeight(1);
  p.fill('#000');
  p.textFont('Courier');
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text('Model loading...', p.width / 2, p.height * 0.9);

  classifier = ml5.imageClassifier('MobileNet', onModelLoaded.bind(this));
  applyConfigrations();
}

const restart = _.throttle(() => {
  shouldStop = true;
  setTimeout(() => {
    shouldStop = false;
    applyConfigrations();
    generationStep();
  }, 300);
}, 350);

function applyConfigrations() {
  validXCoords = _.times(settings.gridSize, (i) =>
    p.lerp(MARGIN, resizer.width - MARGIN, i / settings.gridSize)
  );
  validYCoords = _.times(settings.gridSize, (i) =>
    p.lerp(MARGIN, resizer.height - MARGIN, i / settings.gridSize)
  );
  validLineWidths = _.times(10, (i) =>
    Math.round(
      settings.minStrokeWidth +
        Math.random() * (settings.maxStrokeWidth - settings.minStrokeWidth)
    )
  );

  validColors = randomColor({
    count: settings.randomColorCount,
    format: 'rgba',
    alpha: settings.lineAlpha,
  });

  population = _.times(settings.populationCount, () => {
    const entity = Entity.create(
      settings.lineCount,
      settings.linePointCurvePoint,
      validXCoords,
      validYCoords,
      validLineWidths,
      validColors
    );

    return { entity, bestPrediction: null };
  });
}

function onModelLoaded() {
  console.log('model loaded, starting');
  generationStep();
}

async function predict() {
  const results = await classifier.predict(canvas, 1000);
  return results;
}

async function generationStep(n = 1) {
  // Calculate fitness
  for (let i = 0; i < population.length; i++) {
    if (ENABLE_STATS) stats.begin();
    const item = population[i];
    p.background('#ffffff');
    item.entity.draw(p);
    const predictions = await predict();

    if (settings.targetClass == 'all') {
      item.bestPrediction = predictions[0];
    } else {
      item.bestPrediction = _.find(
        predictions,
        (r) => r.label == settings.targetClass
      );
    }

    const TEXT_SIZE = 24;
    p.noStroke();
    p.strokeWeight(1);
    p.fill('#000');
    p.textFont('Courier');
    p.textSize(TEXT_SIZE);
    p.textAlign(p.CENTER);
    const score = (item.bestPrediction.confidence * 100).toFixed(2);
    p.text(`${score}%`, p.width / 2, p.height * 0.9);
    p.text(
      item.bestPrediction.label,
      p.width / 2,
      p.height * 0.9 + TEXT_SIZE * 1.25
    );

    if (ENABLE_STATS) stats.end();

    if (item.bestPrediction.confidence >= settings.matchThreshold) {
      console.log('Matched', item.bestPrediction);
      return;
    }

    if (shouldStop) {
      shouldStop = false;
      return;
    }
  }

  // Sort by fitness scores
  const populationSorted = population.sort((a, b) => {
    return b.bestPrediction.confidence - a.bestPrediction.confidence;
  });

  console.log(
    `Generation ${n} - Best prediction:`,
    populationSorted[0].bestPrediction
  );

  // End
  if (n >= settings.maxGeneration) {
    const best = populationSorted[0].entity;
    best.draw(p);
    console.log('Ended, best entity', best);
    return;
  }

  // Built mating pool
  const matingPool = [];
  const totalFitnessScore = populationSorted.reduce(
    (acc, a) => acc + a.bestPrediction.confidence,
    0
  );
  for (let i = 0; i < settings.populationCount; i++) {
    const rand = Math.random() * totalFitnessScore;
    let acc = 0;

    for (let j = 0; j < populationSorted.length; j++) {
      const item = populationSorted[j];
      acc += item.bestPrediction.confidence;
      if (acc > rand) {
        matingPool.push(item.entity);
        break;
      }
    }
  }

  // Build new population
  const newPopulation = [];
  for (let i = 0; i < settings.populationCount / 2; i++) {
    const [mother, father] = _.sampleSize(matingPool, 2);
    const [child1, child2] = Entity.crossover(mother, father);

    _.times(settings.lineCount, () => {
      if (Math.random() < settings.mutationRate) child1.mutate();
      if (Math.random() < settings.mutationRate) child2.mutate();
    });

    newPopulation.push({ entity: child1 }, { entity: child2 });
  }

  population = newPopulation;
  generationStep(n + 1);
}

/**
 * On window resized
 */
function onWindowResize(width, height) {
  p.resizeCanvas(width, height);
}

/**
 * Clean your shit
 */
function dispose() {
  resizer.destroy();
  p.remove();
  p = null;

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

main().catch((err) => console.error(err));
