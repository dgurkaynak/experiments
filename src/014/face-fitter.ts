import FaceLandmarks68 from './face-landmarks68';
import { resizePoints, getBoundingBox } from '../utils/geometry-helper';


export default class FaceFitter {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  tempCanvases: HTMLCanvasElement[] = [];


  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
  }


  fit(faceImage: HTMLImageElement, faceLandmarks: FaceLandmarks68, targetFaceLandmarks: FaceLandmarks68[], maskResizeFactor = 0.85, maskBlur = 10) {
    const cc = this.context;
    cc.clearRect(0, 0, this.canvas.width, this.canvas.height);

    targetFaceLandmarks.forEach((targetFaceLandmark, i) => {
      // prepare temporary canvas
      if (!this.tempCanvases[i]) {
        this.tempCanvases[i] = document.createElement('canvas');
        this.tempCanvases[i].width = this.canvas.width;
        this.tempCanvases[i].height = this.canvas.height;
      }
      const canvas = this.tempCanvases[i];
      const cc = canvas.getContext('2d');
      cc.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Calculate image affine transformation
      const pointsProcessor = (points) => [].concat(
        points.slice(0, 17),
        points.slice(17, 27)
      );
      const transformation = faceLandmarks.estimateTransformationTo(targetFaceLandmark, pointsProcessor);
      const { a, b, c, d, e, f } = transformation.getMatrix();

      // Create and draw mask
      cc.save();
      const outerPath = targetFaceLandmark.toPath().include;
      const resizedPath = resizePoints(outerPath, maskResizeFactor);
      const boundingBox = getBoundingBox(resizedPath);
      const offsetX = boundingBox.x + boundingBox.width;

      // draw outside of the canvas, we just want its shadow
      cc.beginPath();
      resizedPath.forEach(([x, y], i) => {
        if (i == 0) {
          cc.moveTo(x - offsetX, y);
        } else {
          cc.lineTo(x - offsetX, y);
        }
      });
      cc.closePath();
      cc.shadowColor = '#fff';
      cc.shadowBlur = maskBlur;
      cc.shadowOffsetX = offsetX;
      cc.fillStyle = '#fff';
      cc.fill();
      cc.restore();

      // Draw face into mask
      cc.save();
      cc.transform(a, b, c, d, e, f);
      cc.globalCompositeOperation = 'source-atop';
      cc.drawImage(faceImage, 0, 0);
      cc.restore();
    });

    // Merge temporary canvases into main canvas
    targetFaceLandmarks.forEach((_, i) => {
      cc.drawImage(this.tempCanvases[i], 0, 0);
    });
  }
}
