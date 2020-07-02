// Dependencies
// - noise.js

export class PerlinCanvas {
  constructor(size) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.height = 0;
    this.noiseDivider = 50;
    this.size = size;
    this.canvas.width = size;
    this.canvas.height = size;
    this.image = this.ctx.createImageData(size, size);
    this.data = this.image.data;
  }

  draw() {
    // Cache width and height values for the canvas.
    const cWidth = this.canvas.width;
    const cHeight = this.canvas.height;
    let max = -Infinity;
    let min = Infinity;
    const noiseFn = noise.perlin3; // noise.simplex3;

    for (let x = 0; x < cWidth; x++) {
      for (let y = 0; y < cHeight; y++) {
        let value = noiseFn(
          x / this.noiseDivider,
          y / this.noiseDivider,
          this.height
        );
        if (max < value) max = value;
        if (min > value) min = value;
        value = (1 + value) * 1.1 * 128;
        var cell = (x + y * cWidth) * 4;
        this.data[cell] = this.data[cell + 1] = this.data[cell + 2] = value;
        //data[cell] += Math.max(0, (25 - value) * 8);
        this.data[cell + 3] = 255; // alpha.
      }
    }

    this.ctx.fillColor = 'black';
    this.ctx.fillRect(0, 0, 100, 100);
    this.ctx.putImageData(this.image, 0, 0);
    this.height += 0.05;
  }
}
