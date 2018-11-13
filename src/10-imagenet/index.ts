import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import sampleSize from 'lodash/sampleSize';
import randomColor from 'randomcolor';


const MARGIN = 150;
const SAMPLE_COUNT = 50;
const STROKE_WIDTH_RANGE = { MIN: 5, MAX: 250 };
const LINE_COUNT = 15;


export default class Test extends ExperimentP5 {
  canvasResizer = new CanvasResizer({
    dimension: [1024, 1024],
    // dimensionScaleFactor: window.devicePixelRatio
  });
  validXCoords: number[];
  validYCoords: number[];


  setup() {
    const [ w, h ] = [ this.canvasResizer.canvasWidth, this.canvasResizer.canvasHeight];
    this.p.pixelDensity(1);
    const renderer: any = this.p.createCanvas(w, h);
    this.canvasResizer.init(renderer.canvas);
    this.p.frameRate(30);

    this.validXCoords = times(SAMPLE_COUNT, i => this.p.lerp(MARGIN, w - MARGIN, i / SAMPLE_COUNT));
    this.validYCoords = times(SAMPLE_COUNT, i => this.p.lerp(MARGIN, h - MARGIN, i / SAMPLE_COUNT));
  }


  draw() {
    this.p.background('#ffffff');

    times(LINE_COUNT, (i) => {
      const xCoords = sampleSize(this.validXCoords, 5);
      const yCoords = sampleSize(this.validYCoords, 5);

      const color = randomColor({
        // hue: 'monochrome',
        luminosity: 'light',
      });
      this.p.stroke(color);
      this.p.strokeWeight(this.p.lerp(STROKE_WIDTH_RANGE.MAX, STROKE_WIDTH_RANGE.MIN, Math.pow(i / LINE_COUNT, 1 / 3)));

      // this.p.line(xCoords[0], yCoords[0], xCoords[1], yCoords[1]);

      this.p.noFill();
      this.p.beginShape();
      this.p.curveVertex(xCoords[0], yCoords[0]);
      this.p.curveVertex(xCoords[1], yCoords[1]);
      this.p.curveVertex(xCoords[2], yCoords[2]);
      this.p.curveVertex(xCoords[3], yCoords[3]);
      this.p.curveVertex(xCoords[4], yCoords[4]);
      this.p.endShape();
    });

    this.p.noLoop();
  }
}
