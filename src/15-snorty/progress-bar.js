// Global deps
// - p5

export class ProgressBar {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.progress = 0;
    this.borderWidth = 1;
    this.borderColor = [255, 255, 255, 255];
    this.fillColor = [255, 255, 255, 255];
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
