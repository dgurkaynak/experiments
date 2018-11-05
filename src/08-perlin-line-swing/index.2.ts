import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import Clock from '../utils/clock';
import colors from 'nice-color-palettes';
import sample from 'lodash/sample';


// Random color selection
// const COLOR_PALETTE = sample(colors);
// const COLORS = {
//   BG: sample(COLOR_PALETTE),
//   UP: sample(COLOR_PALETTE),
//   DOWN: sample(COLOR_PALETTE)
// };
// console.log(COLORS);

const COLORS = [
  {BG: "#000000", UP: "#ffffff", DOWN: "#ffffff"},
  {BG: "#8b7a5e", UP: "#d0ecea", DOWN: "#fffee4"},
  {BG: "#f8fcc1", UP: "#e6781e", DOWN: "#1693a7"},
  {BG: "#363636", UP: "#474747", DOWN: "#e8175d"},
  {BG: "#f1efa5", UP: "#60b99a", DOWN: "#f77825"},
  {BG: "#fdf1cc", UP: "#987f69", DOWN: "#fcd036"},
  {BG: "#f8b195", UP: "#355c7d", DOWN: "#f67280"},
  {BG: "#031634", UP: "#036564", DOWN: "#cdb380"},
  {BG: "#f4ead5", UP: "#d68189", DOWN: "#c6e5d9"},
  {BG: "#e8d5b7", UP: "#0e2430", DOWN: "#fc3a51"},
  {BG: "#fdf1cc", UP: "#e3ad40", DOWN: "#c6d6b8"},
  {BG: "#615375", UP: "#f9bf76", DOWN: "#e5625c"},
  {BG: "#f03c02", UP: "#6b0103", DOWN: "#a30006"},
  {BG: "#f0f0d8", UP: "#604848", DOWN: "#c0d860"},
][12];

const RADIUS = 400;
const Y_FACTOR = 0.1;
const LINE_WIDTH = 3;
const CIRCLE_DRAW_SAMPLE_ANGLE = Math.PI / 10;
const NOISE_X_CLOCK_FACTOR = 0.4; // 0.2
const NOISE_X_STEP = 2.5;
const Y_STEP = 10; // 5
const Y_NEGATIVE_OFFSET = 50;


export default class Test extends ExperimentP5 {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen',
    dimensionScaleFactor: window.devicePixelRatio
  });
  clock = new Clock();
  i = 0;


  setup() {
    this.p.pixelDensity(1);
    const renderer: any = this.p.createCanvas(this.canvasResizer.canvasWidth, this.canvasResizer.canvasHeight);
    this.canvasResizer.init(renderer.canvas);
    // this.p.frameRate(30);
    // this.p.background(0);
    this.p.background(COLORS.BG);
  }


  draw() {
    // this.p.background(0);
    this.p.noFill();
    this.p.strokeWeight(LINE_WIDTH);

    const color = this.p.lerpColor(
      this.p.color(COLORS.UP),
      this.p.color(COLORS.DOWN),
      this.i / this.canvasResizer.canvasHeight
    );
    // this.p.stroke(255, 255, 255);
    this.p.stroke(color);

    if (this.i > this.canvasResizer.canvasHeight + (2 * Y_NEGATIVE_OFFSET)) {
      console.log('end');
      this.p.noLoop();
      return;
    }

    const baseX = this.clock.getElapsedTime() * NOISE_X_CLOCK_FACTOR;
    const center = {
      x: this.canvasResizer.canvasWidth / 2,
      y: this.canvasResizer.canvasHeight + Y_NEGATIVE_OFFSET - this.i
    };

    this.p.beginShape();

    const sampleCount = 2 * Math.PI / CIRCLE_DRAW_SAMPLE_ANGLE;
    times(sampleCount + 3, (j) => {
      const angle = j * CIRCLE_DRAW_SAMPLE_ANGLE;
      const noise = this.p.noise(baseX + NOISE_X_STEP * (j % sampleCount));
      const noiseMapped = this.p.map(noise, 0, 1, 0, 2);
      const x = center.x + RADIUS * Math.cos(angle) * noiseMapped;
      const y = center.y + RADIUS * Math.sin(angle) * noiseMapped * Y_FACTOR;

      this.p.curveVertex(x, y);
    });

    this.p.endShape();

    this.i += Y_STEP;
  }
}
