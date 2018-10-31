import Experiment from './experiment';
import p5 from 'p5';
import Stats from 'stats.js';
import CanvasResizer from './utils/canvas-resizer';


export default class ExperimentP5 extends Experiment {
  canvasResizer: CanvasResizer;
  p: p5;

  enableStats = true;
  stats: Stats;

  async init() {
    this.canvasResizer.resize = this.onWindowResize.bind(this);

    if (this.enableStats) {
      this.stats = new Stats();
      this.stats.showPanel(0);
      this.statsEl.appendChild(this.stats.dom);
    }

    new p5((p) => {
      this.p = p;
      this.p.setup = this.setup.bind(this);
      this.p.draw = () => {
        this.preDraw();
        this.draw();
        this.postDraw();
      };
    }, this.containerEl);
  }


  async destroy() {
    this.canvasResizer.destroy();
    this.p.remove();
    this.p = null;
  }


  setup() {
    // To be implemented by child class
  }


  preDraw() {
    if (this.enableStats) this.stats.begin();
  }


  draw() {
    // To be implemented by child class
  }


  postDraw() {
    if (this.enableStats) this.stats.end();
  }


  onWindowResize(width, height) {
    this.p.resizeCanvas(width, height);
  }
}
