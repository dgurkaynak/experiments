import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import times from 'lodash/times';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const PADDING = { TOP: 100, RIGHT: 100, BOTTOM: 100, LEFT: 100 };
const LINE_COUNT = 50;
const HORIZONTAL_SAMPLE_COUNT = 20;
const LINE_WIDTH = 1;
const NOISE_X_STEP = 0.20;
const NOISE_X_FRAME_STEP = 0.015;
const NOISE_Y_STEP = 0.125;
const NOISE_Y_INFLUENCE = 30;
const LEFT_RIGHT_DAMPING_FACTOR = 2;


export default class Test extends ExperimentP5 {
  noiseX = 0;


  setup() {
    this.p.createCanvas(WIDTH, HEIGHT);
  }


  draw() {
    this.p.background(0);
    this.p.noFill();
    this.p.strokeWeight(LINE_WIDTH);
    this.p.stroke(255, 255, 255);

    const lineVerticalMargin = (window.innerHeight - PADDING.TOP - PADDING.BOTTOM) / (LINE_COUNT - 1);
    const horizontalSampleWidth = (window.innerWidth - PADDING.LEFT - PADDING.RIGHT) / (HORIZONTAL_SAMPLE_COUNT - 1);

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

    // this.p.noLoop();
    this.p.frameRate(30);

    this.noiseX += NOISE_X_FRAME_STEP;
  }
}
