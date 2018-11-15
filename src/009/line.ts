import * as opentype from 'opentype.js';
import defaults from 'lodash/defaults';
import Letter from './letter';


interface LineOptions {
  fontSize: number;
  letterSpacing: number;
  whitespaceSpacing: number;
}


interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}


export default class Line {
  options: LineOptions = {
    fontSize: 144,
    letterSpacing: 10,
    whitespaceSpacing: 50
  };
  letters: Letter[] = [];
  estimation = { width: 0, height: 0 };


  constructor(
    public font: opentype.Font,
    public text: string,
    options?: LineOptions
  ) {
    this.options = defaults(options, this.options);

    // Height estimation
    const letterA = new Letter(font, 'A', this.options.fontSize);
    this.estimation.height = letterA.pathHeight;

    // Width estimation
    this.text.split('').forEach((char) => {
      if (char == ' ') {
        this.estimation.width += this.options.whitespaceSpacing;
        return;
      }

      const letter = new Letter(font, char, this.options.fontSize);
      this.letters.push(letter);
      this.estimation.width += letter.pathWidth + this.options.letterSpacing;
    });
  }


  init(two: Two, boundingBox: BoundingBox) {
    let x = boundingBox.x + (boundingBox.width - this.estimation.width) / 2;
    const y = boundingBox.y + (boundingBox.height - this.estimation.height) / 2;
    let letterIndex = 0;

    this.text.split('').forEach((char) => {
      if (char == ' ') {
        x += this.options.whitespaceSpacing;
        return;
      }

      const letter = this.letters[letterIndex];
      letter.init(two, x, y);

      x += letter.pathWidth + this.options.letterSpacing;
      letterIndex++;
    });
  }


  update() {
    this.letters.forEach(letter => letter.update());
  }
}
