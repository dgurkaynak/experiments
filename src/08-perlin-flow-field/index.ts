import p5 from 'p5';
import ExperimentP5 from '../experiment-p5';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;


export default class Test extends ExperimentP5 {
  setup() {
    this.p.createCanvas(WIDTH, HEIGHT);
  }


  draw() {
    this.p.background(0);
    this.p.fill(255, 0, 255);
    this.p.rect(100, 100, 50, 50);
    this.p.noLoop();
  }
}
