import Experiment from './experiment';
import p5 from 'p5';


export default class ExperimentP5 extends Experiment {
  p: p5;


  async init() {
    document.body.style.overflow = 'hidden';
    new p5((p) => {
      this.p = p;
      this.p.setup = this.setup.bind(this);
      this.p.draw = this.draw.bind(this);
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


  draw() {
    // To be implemented by child class
  }
}
