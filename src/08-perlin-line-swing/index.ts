import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import times from 'lodash/times';
import Clock from '../utils/clock';
import CanvasResizer from '../utils/canvas-resizer';


const PADDING_RATIO = { TOP: 0.15, RIGHT: 0.15, BOTTOM: 0.15, LEFT: 0.15 };
const LINE_COUNT = 50;
const HORIZONTAL_SAMPLE_COUNT = 30;
const LINE_WIDTH = 3;
const NOISE_X_STEP = 0.20;
const NOISE_X_CLOCK_FACTOR = 0.4;
const NOISE_Y_STEP = 0.125;
const NOISE_Y_INFLUENCE = 17;
const LEFT_RIGHT_DAMPING_FACTOR = 3;


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

    const padding = {
      top: this.canvasResizer.canvasHeight * PADDING_RATIO.TOP,
      right: this.canvasResizer.canvasWidth * PADDING_RATIO.RIGHT,
      bottom: this.canvasResizer.canvasHeight * PADDING_RATIO.BOTTOM,
      left: this.canvasResizer.canvasWidth * PADDING_RATIO.LEFT
    };
    const baseX = this.clock.getElapsedTime() * NOISE_X_CLOCK_FACTOR;
    const lineVerticalMargin = (this.canvasResizer.canvasHeight - padding.top - padding.bottom) / (LINE_COUNT - 1);
    const horizontalSampleWidth = (this.canvasResizer.canvasWidth - padding.left - padding.right) / (HORIZONTAL_SAMPLE_COUNT - 1);

    times(LINE_COUNT, (i) => {
      this.p.beginShape();

      const baseY = padding.top + (lineVerticalMargin * i);
      times(HORIZONTAL_SAMPLE_COUNT, (j) => {
        const x = padding.left + (horizontalSampleWidth * j);

        const noise = this.p.noise(
          baseX + NOISE_X_STEP * j,
          NOISE_Y_STEP * i
        );
        const offsetY = (noise - 0.5) * lineVerticalMargin * NOISE_Y_INFLUENCE;

        const dampingFactorLeft = 1 - (1 / Math.pow(Math.E, j / HORIZONTAL_SAMPLE_COUNT * LEFT_RIGHT_DAMPING_FACTOR));
        const dampingFactorRight = 1 - (1 / Math.pow(Math.E, (1 - (j / HORIZONTAL_SAMPLE_COUNT)) * LEFT_RIGHT_DAMPING_FACTOR));

        const y = baseY + offsetY * dampingFactorLeft * dampingFactorRight;
        this.p.curveVertex(x, y);
      });

      this.p.endShape();
    });

    // this.p.noLoop();
    this.p.frameRate(30);
  }
}
