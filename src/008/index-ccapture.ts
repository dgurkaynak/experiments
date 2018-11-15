import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import times from 'lodash/times';
import CCapture from 'ccapture.js';


const WIDTH = 1080;
const HEIGHT = 1080;
const PADDING = { TOP: 100, RIGHT: 100, BOTTOM: 100, LEFT: 100 };
const LINE_COUNT = 50;
const HORIZONTAL_SAMPLE_COUNT = 30;
const LINE_WIDTH = 1;
const NOISE_X_STEP = 0.20;
const NOISE_X_FRAME_STEP = 0.015;
const NOISE_Y_STEP = 0.125;
const NOISE_Y_INFLUENCE = 17;
const LEFT_RIGHT_DAMPING_FACTOR = 3;


export default class Test extends ExperimentP5 {
  noiseX = 0;
  canvas: HTMLCanvasElement;
  captureOptions = {
    capturer: new CCapture({ format: 'png', framerate: 30 }),
    duration: 15000,
    startDate: 0
  };


  setup() {
    const renderer: any = this.p.createCanvas(WIDTH, HEIGHT); // Returning is renderer, not canvas
    this.canvas = renderer.canvas;
    this.p.frameRate(30);
    this.p.pixelDensity(1);
    this.captureOptions.capturer.start();
  }


  draw() {
    if (!this.captureOptions.startDate) this.captureOptions.startDate = Date.now();
    if (Date.now() - this.captureOptions.startDate >= this.captureOptions.duration) {
      this.captureOptions.capturer.stop();
      this.captureOptions.capturer.save();
      this.p.noLoop();
      return;
    }

    this.p.background(0);
    this.p.noFill();
    this.p.strokeWeight(LINE_WIDTH);
    this.p.stroke(255, 255, 255);

    // const lineVerticalMargin = (window.innerHeight - PADDING.TOP - PADDING.BOTTOM) / (LINE_COUNT - 1);
    const lineVerticalMargin = (HEIGHT - PADDING.TOP - PADDING.BOTTOM) / (LINE_COUNT - 1);
    // const horizontalSampleWidth = (window.innerWidth - PADDING.LEFT - PADDING.RIGHT) / (HORIZONTAL_SAMPLE_COUNT - 1);
    const horizontalSampleWidth = (WIDTH - PADDING.LEFT - PADDING.RIGHT) / (HORIZONTAL_SAMPLE_COUNT - 1);

    times(LINE_COUNT, (i) => {
      this.p.beginShape();

      const baseY = PADDING.TOP + (lineVerticalMargin * i);
      times(HORIZONTAL_SAMPLE_COUNT, (j) => {
        const x = PADDING.LEFT + (horizontalSampleWidth * j);

        const noise = this.p.noise(
          this.noiseX + NOISE_X_STEP * j,
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

    this.captureOptions.capturer.capture(this.canvas);

    this.noiseX += NOISE_X_FRAME_STEP;
  }
}
