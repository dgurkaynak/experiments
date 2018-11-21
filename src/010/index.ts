import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import find from 'lodash/find';
import sampleSize from 'lodash/sampleSize';
import randomColor from 'randomcolor';
import ml5 from 'ml5';
import Entity from './entity/line-curve';


/**
 * Constants
 */
const ENABLE_STATS = true;
const MARGIN = 200;
const SAMPLE_COUNT = 50;
const STROKE_WIDTH_RANGE = { MIN: 5, MAX: 100 };
const LINE_COUNT = 4;
const LINE_POINT_CURVE_COUNT = 5;
const CLASS_NAME = 'banana';
const LINE_ALPHA = 0.5;

const POPULATION_COUNT = 500;
const MUTATION_RATE = 0.20;
const GENERATION_LIMIT = 200;
const SCORE_LIMIT = 0.95;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();

/**
 * Experiment variables
 */
let classifier;
let canvas: HTMLCanvasElement;
let population: {entity: Entity, score: number}[];
let validXCoords: number[];
let validYCoords: number[];
let validLineWidths: number[];
let validColors: string[];


/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    // p.draw = draw;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}


/**
 * p5's setup function
 */
async function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  canvas = resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  p.pixelDensity(1);

  // Start experimenting
  classifier = ml5.imageClassifier('MobileNet', onModelLoaded.bind(this));

  validXCoords = times(SAMPLE_COUNT, i => p.lerp(MARGIN, resizer.width - MARGIN, i / SAMPLE_COUNT));
  validYCoords = times(SAMPLE_COUNT, i => p.lerp(MARGIN, resizer.height - MARGIN, i / SAMPLE_COUNT));
  validLineWidths = times(10, i => Math.round(STROKE_WIDTH_RANGE.MIN + Math.random() * (STROKE_WIDTH_RANGE.MAX - STROKE_WIDTH_RANGE.MIN)));
  const mainColors = await searchColorPalette();
  validColors = randomColor({
    count: 10,
    hue: 'monochrome',
    format: 'rgba',
    alpha: LINE_ALPHA
  }).concat(mainColors);

  population = times(POPULATION_COUNT, () => {
    const entity = Entity.create(
      LINE_COUNT,
      LINE_POINT_CURVE_COUNT,
      validXCoords,
      validYCoords,
      validLineWidths,
      validColors
    );

    return { entity, score: null };
  });

  generationStep();
}


function onModelLoaded() {
  console.log('model loaded')
}


async function searchColorPalette(topCount = 10, randomCount = 100) {
  const colors = randomColor({
    count: randomCount,
    format: 'rgba',
    alpha: LINE_ALPHA
  });
  const results = [];

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    p.background(color);
    const score = await predict(CLASS_NAME);
    results.push({ color, score });
  }

  const resultsSorted = results.sort((a, b) => b.score - a.score);

  return resultsSorted.slice(0, topCount).map(i => i.color);
}


async function predict(className?: string) {
  const results = await classifier.predict(canvas, 1000);
  if (!className) return results;
  const result = find(results, r => r.className == className);
  return result ? result.probability : null;
}


function randomSketch() {
  p.background('#ffffff');

  const entity = Entity.create(
    LINE_COUNT,
    5,
    validXCoords,
    validYCoords,
    validLineWidths,
    validColors
  );
  entity.draw(p);
}


async function generationStep(n = 1) {
  // Calculate fitness
  for (let i = 0; i < population.length; i++) {
    if (ENABLE_STATS) stats.begin();
    const item = population[i];
    p.background('#ffffff');
    item.entity.draw(p);
    item.score = await predict(CLASS_NAME);
    if (ENABLE_STATS) stats.end();
  }

  // Sort by fitness scores
  const populationSorted = population.sort((a, b) => {
    return b.score - a.score;
  });

  const bestScore = populationSorted[0].score;
  console.log(`Generation ${n} - Best score: ${bestScore}`);

  // End
  if (n >= GENERATION_LIMIT || bestScore >= SCORE_LIMIT) {
    const bestEntity = populationSorted[0].entity;
    bestEntity.draw(p);
    console.log('Ended, best entity', bestEntity);
    return;
  }

  // Built mating pool
  const matingPool: Entity[] = [];
  const totalFitnessScore = populationSorted.reduce((acc, a) => acc + a.score, 0);
  for (let i = 0; i < POPULATION_COUNT; i++) {
    const rand = Math.random() * totalFitnessScore;
    let acc = 0;

    for (let j = 0; j < populationSorted.length; j++) {
      const item = populationSorted[j];
      acc += item.score;
      if (acc > rand) {
        matingPool.push(item.entity);
        break;
      }
    }
  }

  // Build new population
  const newPopulation: {entity: Entity, score: number}[] = [];
  for (let i = 0; i < POPULATION_COUNT / 2; i++) {
    const [ mother, father ] = sampleSize(matingPool, 2);
    const [ child1, child2 ] = Entity.crossover(mother, father);

    times(LINE_COUNT, () => {
      if (Math.random() < MUTATION_RATE) child1.mutate();
      if (Math.random() < MUTATION_RATE) child2.mutate();
    });

    newPopulation.push(
      { entity: child1, score: null },
      { entity: child2, score: null }
    );
  }

  population = newPopulation;
  generationStep(n+1);
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
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
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
