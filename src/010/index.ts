import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import find from 'lodash/find';
import sampleSize from 'lodash/sampleSize';
import randomColor from 'randomcolor';
import ml5 from 'ml5';
import Entity from './entity/line-curve';


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


export default class Test extends ExperimentP5 {
  canvasResizer = new CanvasResizer({
    dimension: [1024, 1024],
    // dimensionScaleFactor: window.devicePixelRatio
  });

  canvas: HTMLCanvasElement;
  classifier;
  population: {entity: Entity, score: number}[];

  validXCoords: number[];
  validYCoords: number[];
  validLineWidths: number[];
  validColors: string[];


  async setup() {
    const [ w, h ] = [ this.canvasResizer.canvasWidth, this.canvasResizer.canvasHeight];
    this.p.pixelDensity(1);
    const renderer: any = this.p.createCanvas(w, h);
    this.canvas = renderer.canvas;
    this.canvasResizer.init(this.canvas);
    this.p.noLoop();

    this.classifier = ml5.imageClassifier('MobileNet', this.onModelLoaded.bind(this));

    this.validXCoords = times(SAMPLE_COUNT, i => this.p.lerp(MARGIN, w - MARGIN, i / SAMPLE_COUNT));
    this.validYCoords = times(SAMPLE_COUNT, i => this.p.lerp(MARGIN, h - MARGIN, i / SAMPLE_COUNT));
    this.validLineWidths = times(10, i => Math.round(STROKE_WIDTH_RANGE.MIN + Math.random() * (STROKE_WIDTH_RANGE.MAX - STROKE_WIDTH_RANGE.MIN)));
    const mainColors = await this.searchColorPalette();
    this.validColors = randomColor({
      count: 10,
      hue: 'monochrome',
      format: 'rgba',
      alpha: LINE_ALPHA
    }).concat(mainColors);

    this.population = times(POPULATION_COUNT, () => {
      const entity = Entity.create(
        LINE_COUNT,
        LINE_POINT_CURVE_COUNT,
        this.validXCoords,
        this.validYCoords,
        this.validLineWidths,
        this.validColors
      );

      return { entity, score: null };
    });

    // Start
    this.generationStep();

    // TODO: Delete
    (window as any).randomSketch = this.randomSketch.bind(this);
    (window as any).generationStep = this.generationStep.bind(this);
    (window as any).predict = this.predict.bind(this);
    (window as any).p = this.p;
    (window as any).searchColorPalette = this.searchColorPalette.bind(this);
  }


  onModelLoaded() {
    console.log('model loaded')
  }


  async searchColorPalette(topCount = 10, randomCount = 100) {
    const colors = randomColor({
      count: randomCount,
      format: 'rgba',
      alpha: LINE_ALPHA
    });
    const results = [];

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      this.p.background(color);
      const score = await this.predict(CLASS_NAME);
      results.push({ color, score });
    }

    const resultsSorted = results.sort((a, b) => b.score - a.score);

    return resultsSorted.slice(0, topCount).map(i => i.color);
  }


  async predict(className?: string) {
    const results = await this.classifier.predict(this.canvas, 1000);
    if (!className) return results;
    const result = find(results, r => r.className == className);
    return result ? result.probability : null;
  }


  randomSketch() {
    this.p.background('#ffffff');

    const entity = Entity.create(
      LINE_COUNT,
      5,
      this.validXCoords,
      this.validYCoords,
      this.validLineWidths,
      this.validColors
    );
    entity.draw(this.p);
  }



  /// Genetic alg stuff
  async generationStep(n = 1) {
    // Calculate fitness
    for (let i = 0; i < this.population.length; i++) {
      const item = this.population[i];
      this.p.background('#ffffff');
      item.entity.draw(this.p);
      item.score = await this.predict(CLASS_NAME);
    }

    // Sort by fitness scores
    const populationSorted = this.population.sort((a, b) => {
      return b.score - a.score;
    });

    const bestScore = populationSorted[0].score;
    console.log(`Generation ${n} - Best score: ${bestScore}`);

    // End
    if (n >= GENERATION_LIMIT || bestScore >= SCORE_LIMIT) {
      const bestEntity = populationSorted[0].entity;
      bestEntity.draw(this.p);
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

    this.population = newPopulation;
    this.generationStep(n+1);
  }
}
