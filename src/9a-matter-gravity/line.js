import { Letter } from './letter.js';

export class Line {
  options = {
    fontSize: 144,
    letterSpacing: 10,
    whitespaceSpacing: 50,
  };
  letters = [];
  estimation = { width: 0, height: 0 };

  constructor(font, text, options) {
    this.font = font;
    this.text = text;
    this.options = _.defaults(options, this.options);

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

  init(two, boundingBox) {
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
    this.letters.forEach((letter) => letter.update());
  }
}
