import Two from 'two.js';
import Matter from 'matter-js';


const LETTER_SAMPLE_LENGTHS = {
  'B': 3,
  'I': 20,
  'R': 20,
  'S': 20,
  'e': 20,
  '!': 20,
};
const LETTER_VIEW_CORRECTIONS = {
  'B': {
    y: (y, h) => y + h * 0.05
  },
  'F': {
    x: (x, w) => x - w * 0.05,
    y: (y, h) => y + h * 0.25
  },
  'H': {
    y: (y, h) => y + h * 0.05
  },
  'L': {
    x: (x, w) => x + w * 0.25,
    y: (y, h) => y - h * 0.15
  },
  'T': {
    y: (y, h) => y + h * 0.25
  },
  'm': {
    y: (y, h) => y + h * 0.2
  },
  'n': {
    y: (y, h) => y + h * 0.2
  },
  'p': {
    y: (y, h) => y + h * 0.2
  },
  'r': {
    y: (y, h) => y + h * 0.2
  },
  'q': {
    y: (y, h) => y + h * 0.2
  },
  'y': {
    y: (y, h) => y + h * 0.05
  },
};


export default class Letter {
  char: string;
  pathWidth: number;
  pathHeight: number;
  body: Matter.Body;
  view: Two.Group;


  constructor(font: opentype.Font, two: Two, char: string, size: number, x: number, y: number) {
    this.char = char;
    const path = font.getPath(char, 0, 0, size);
    const pathStr = path.toSVG(2);
    const pathBB = path.getBoundingBox();
    this.pathWidth = Math.abs(pathBB.x1 - pathBB.x2);
    this.pathHeight = Math.abs(pathBB.y1 - pathBB.y2);

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgEl.innerHTML = pathStr;

    const vertexSets = [];
    const sampleLength = LETTER_SAMPLE_LENGTHS[char] || 40;
    const points = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[0], sampleLength);
    vertexSets.push(points);
    this.body = Matter.Bodies.fromVertices(x, y, vertexSets);

    this.view = two.interpret(svgEl).center();
    this.update();
  }


  update() {
    const letterCorrection = LETTER_VIEW_CORRECTIONS[this.char] || {};
    const x = letterCorrection.x ? 
      letterCorrection.x(this.body.position.x, this.pathWidth) :
      this.body.position.x;
    const y = letterCorrection.y ? 
      letterCorrection.y(this.body.position.y, this.pathHeight) :
      this.body.position.y;

    this.view.translation.set(x, y);
    this.view.rotation = this.body.angle;
  }
}
