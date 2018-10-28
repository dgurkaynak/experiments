import Experiment from './experiment';
import p5 from 'p5';
import Stats from 'stats.js';


export default class ExperimentP5 extends Experiment {
  p: p5;

  enableStats = true;
  stats: Stats;

  async init() {
    document.body.style.overflow = 'hidden';

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
      this.p.windowResized = this.windowResized.bind(this);
    }, this.containerEl);
  }


  async destroy() {
    document.body.style.overflow = '';
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


  windowResized() {
    this.p.resizeCanvas(window.innerWidth, window.innerHeight);
  }
}
