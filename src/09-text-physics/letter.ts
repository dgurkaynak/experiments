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
const LETTER_BODY_CORRECTIONS = {
  'A': { x: 0, y: 6, w: 0},
  'B': { x: 0, y: 1, w: 0},
  'C': { x: 0, y: 5, w: 0},
  'D': { x: 0, y: -3, w: 0},
  'F': { x: 0, y: -15, w: 0},
  'J': { x: 0, y: 13, w: 0},
  'L': { x: 0, y: 15, w: 25},
  'M': { x: 0, y: 2, w: 0},
  'P': { x: 0, y: -10, w: 0},
  'Q': { x: 0, y: 2, w: 0},
  'R': { x: 0, y: -8, w: 0},
  'T': { x: 0, y: -20, w: 0},
  'Y': { x: 0, y: -10, w: 0},
  ',': { x: 0, y: 88, w: 20},
  '.': { x: 0, y: 92, w: 0},
  '\'': { x: 0, y: -10, w: 10},
  'a': { x: 0, y: 34, w: 0},
  'b': { x: 0, y: 10, w: 0},
  'c': { x: 0, y: 26, w: 0},
  'd': { x: 0, y: 6, w: 0},
  'e': { x: 0, y: 26, w: 0},
  'f': { x: 0, y: -1, w: 0},
  'g': { x: 0, y: 28, w: 0},
  'h': { x: 0, y: 6, w: 0},
  'i': { x: 0, y: 16, w: 0},
  'j': { x: 0, y: 16, w: 0},
  'k': { x: 0, y: 4, w: 0},
  'l': { x: 0, y: -4, w: 0},
  'm': { x: 0, y: 20, w: 0},
  'n': { x: 0, y: 22, w: 0},
  'o': { x: 0, y: 31, w: 0},
  'p': { x: 0, y: 23, w: 0},
  'q': { x: 0, y: 23, w: 0},
  'r': { x: 0, y: 21, w: 0},
  's': { x: 0, y: 27, w: 0},
  't': { x: 0, y: 8, w: 0},
  'u': { x: 0, y: 29, w: 0},
  'v': { x: 0, y: 27, w: 0},
  'w': { x: 0, y: 28, w: 0},
  'x': { x: 0, y: 29, w: 0},
  'y': { x: 0, y: 24, w: 0},
  'z': { x: 0, y: 29, w: 0},
};
const LETTER_VIEW_CORRECTIONS = {
  'A': { x: 0, y: -6 },
  'B': { x: 0, y: -1 },
  'C': { x: 0, y: -5 },
  'D': { x: 0, y: 3 },
  'F': { x: 0, y: 15 },
  'J': { x: 0, y: -13 },
  'L': { x: 10, y: -15 },
  'M': { x: 0, y: -2 },
  'P': { x: 0, y: 10 },
  'Q': { x: 0, y: -2 },
  'R': { x: 0, y: 8 },
  'T': { x: 0, y: 20 },
  'Y': { x: 0, y: 10 },
  '?': { x: 0, y: 8 },
  'a': { x: 0, y: -5 },
  'b': { x: 0, y: -13 },
  'c': { x: 0, y: 2 },
  'd': { x: 0, y: -10 },
  'e': { x: 0, y: 2 },
  'i': { x: 0, y: -5 },
  'j': { x: 0, y: -5 },
  'k': { x: 0, y: -8 },
  'm': { x: 0, y: 7 },
  'n': { x: 0, y: 6 },
  'o': { x: 0, y: -4 },
  'p': { x: 0, y: 7 },
  'q': { x: 0, y: 8 },
  'r': { x: 0, y: 9 },
  's': { x: 0, y: 2 },
  't': { x: 0, y: 3 },
  'v': { x: 0, y: 1 },
  'y': { x: 0, y: 5 },
};


export default class Letter {
  char: string;
  path: opentype.Path;
  pathWidth: number;
  pathHeight: number;
  body: Matter.Body;
  view: Two.Group;


  constructor(font: opentype.Font, char: string, size: number) {
    let viewChar = char;
    if (char == `'`) viewChar = ',';

    this.char = char;
    this.path = font.getPath(viewChar, 0, 0, size);
    const pathBB = this.path.getBoundingBox();
    const letterBodyCorrection = LETTER_BODY_CORRECTIONS[char] || {};

    this.pathWidth = Math.abs(pathBB.x1 - pathBB.x2) + (letterBodyCorrection.w || 0);
    this.pathHeight = Math.abs(pathBB.y1 - pathBB.y2);
  }


  init(two: Two, x: number, y: number) {
    const pathStr = this.path.toSVG(2);
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgEl.innerHTML = pathStr;

    const vertexSets = [];
    const sampleLength = LETTER_SAMPLE_LENGTHS[this.char] || 40;
    const points = Matter.Svg.pathToVertices(svgEl.getElementsByTagName('path')[0], sampleLength);
    vertexSets.push(points);

    const letterBodyCorrection = LETTER_BODY_CORRECTIONS[this.char] || {};
    const newX = x + (this.pathWidth / 2) + (letterBodyCorrection.x || 0);
    const newY = y + (this.pathHeight / 2) + (letterBodyCorrection.y || 0);
    this.body = Matter.Bodies.fromVertices(newX, newY, vertexSets);

    this.view = two.interpret(svgEl).center();
    this.update();
  }


  update() {
    const letterViewCorrection = LETTER_VIEW_CORRECTIONS[this.char] || {};
    const x = this.body.position.x + (letterViewCorrection.x || 0);
    const y = this.body.position.y + (letterViewCorrection.y || 0);

    this.view.translation.set(x, y);
    this.view.rotation = this.body.angle;
  }
}
