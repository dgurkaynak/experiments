export default class MaskCreator {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
  }

  create(includePaths: number[][][], excludePaths: number[][][] = []) {
    const cc = this.context;
    cc.fillStyle = '#000000';
    cc.fillRect(0, 0, this.canvas.width, this.canvas.height);

    includePaths.forEach((path) => {
      cc.beginPath();
      path.forEach(([x, y], i) => {
        if (i == 0) {
          cc.moveTo(x, y);
        } else {
          cc.lineTo(x, y);
        }
      });
      cc.closePath();
      cc.fillStyle = '#ffffff';
      cc.fill();
    });

    excludePaths.forEach((path) => {
      cc.beginPath();
      path.forEach(([x, y], i) => {
        if (i == 0) {
          cc.moveTo(x, y);
        } else {
          cc.lineTo(x, y);
        }
      });
      cc.closePath();
      cc.fillStyle = '#000000';
      cc.fill();
    });
  }
}
