import Experiment from './experiment';
import Two from 'two.js';
import Stats from 'stats.js';
import CanvasResizer from './utils/canvas-resizer';


export default class ExperimentTwoJs extends Experiment {
  canvasResizer: CanvasResizer;
  two: Two;
  onWindowResizeBinded = this.onWindowResize.bind(this);

  enableStats = true;
  stats: Stats;

  async init() {
    this.two.appendTo(this.containerEl);
    this.canvasResizer.resize = this.onWindowResize.bind(this);
    this.canvasResizer.init((this.two as any).renderer.domElement);

    if (this.enableStats) {
      this.stats = new Stats();
      this.stats.showPanel(0);
      this.statsEl.appendChild(this.stats.dom);
    }
  }


  async destroy() {
    this.canvasResizer.destroy();
  }


  onWindowResize(width: number, height: number) {
    this.two.width = width;
    this.two.height = height;
  }


  requestAnimationFrame() {
    // To be implemented by child class
  }
}
