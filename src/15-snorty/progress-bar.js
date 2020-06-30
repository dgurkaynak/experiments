// Global deps
// - p5

export class ProgressBar {
  x = null;
  y = null;
  width = null;
  height = null;
  progress = 0;
  borderWidth = 1;
  borderColor = [255, 255, 255, 255];
  fillColor = [255, 255, 255, 255];

  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(p) {
    p.strokeWeight(this.borderWidth);
    p.stroke(this.borderColor);
    p.noFill();
    p.rect(this.x, this.y, this.width, this.height);

    const fillWidth = Math.round(
      (this.width - (2 * this.borderWidth + 1)) * this.progress
    );
    p.noStroke();
    p.fill(this.fillColor);
    p.rect(
      this.x + this.borderWidth + 1,
      this.y + this.borderWidth + 1,
      fillWidth,
      this.height - (2 * this.borderWidth + 1)
    );
  }
}
