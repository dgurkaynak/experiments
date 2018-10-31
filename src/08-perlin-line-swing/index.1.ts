import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import Clock from '../utils/clock';


const PADDING = { TOP: 100, RIGHT: 100, BOTTOM: 100, LEFT: 100 };
const CIRCLE_COUNT = 25;
const LINE_WIDTH = 1;
const CIRCLE_MIN_RADIUS = 50;
const CIRCLE_DRAW_SAMPLE_ANGLE = Math.PI / 10;
const NOISE_X_CLOCK_FACTOR = 0.4;
const NOISE_X_STEP = 0.40;
const NOISE_Y_STEP = 0.125;


export default class Test extends ExperimentP5 {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen',
    dimensionScaleFactor: window.devicePixelRatio
  });
  clock = new Clock();


  setup() {
    // this.p.pixelDensity(window.devicePixelRatio);
    this.p.pixelDensity(1);
    const renderer: any = this.p.createCanvas(this.canvasResizer.canvasWidth, this.canvasResizer.canvasHeight);
    this.canvasResizer.init(renderer.canvas);
  }


  draw() {
    this.p.background(0);
    this.p.noFill();
    this.p.strokeWeight(LINE_WIDTH);
    this.p.stroke(255, 255, 255);

    const baseX = this.clock.getElapsedTime() * NOISE_X_CLOCK_FACTOR;
    const radiusMarginX = (((this.canvasResizer.canvasWidth - PADDING.LEFT - PADDING.RIGHT) / 2) - CIRCLE_MIN_RADIUS) / (CIRCLE_COUNT - 1);
    const radiusMarginY = (((this.canvasResizer.canvasHeight - PADDING.TOP - PADDING.BOTTOM) / 2) - CIRCLE_MIN_RADIUS) / (CIRCLE_COUNT - 1);
    const radiusMargin = Math.min(radiusMarginX, radiusMarginY);
    const center = {
      x: this.canvasResizer.canvasWidth / 2,
      y: this.canvasResizer.canvasHeight / 2
    };

    times(CIRCLE_COUNT, (i) => {
      this.p.beginShape();

      const radius = CIRCLE_MIN_RADIUS + radiusMargin * i;
      const sampleCount = 2 * Math.PI / CIRCLE_DRAW_SAMPLE_ANGLE;
      times(sampleCount + 3, (j) => {
        const angle = j * CIRCLE_DRAW_SAMPLE_ANGLE;
        const noise = this.p.noise(
          baseX + NOISE_X_STEP * (j % sampleCount), // Continunity
          NOISE_Y_STEP * i
        );
        const noiseMapped = this.p.map(noise, 0, 1, 0.75, 1.25);
        const x = center.x + radius * Math.cos(angle) * noiseMapped;
        const y = center.y + radius * Math.sin(angle) * noiseMapped;

        this.p.curveVertex(x, y);
      });

      this.p.endShape();
    });

    // this.p.noLoop();
    this.p.frameRate(30);
  }
}
