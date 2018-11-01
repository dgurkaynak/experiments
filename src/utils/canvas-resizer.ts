import isNumber from 'lodash/isNumber';
import throttle from 'lodash/throttle';

// Assuming: html, body { width: 100%; height: 100%; }

type CanvasResizerDimension = 'fullscreen'|[number, number];
interface CanvasResizerOptions {
  dimension?: CanvasResizerDimension;
  dimensionScaleFactor?: number;
  throttle?: number;
  padding?: number;
  resize?: (width: number, height: number) => void
}


export default class CanvasResizer {
  canvas: HTMLCanvasElement;
  dimension: CanvasResizerDimension = 'fullscreen';
  dimensionScaleFactor = 1;
  throttle = 500;
  padding = 50;
  resize = (width: number, height: number) => {};

  canvasWidth: number;
  canvasHeight: number;
  canvasStyleWidth: number;
  canvasStyleHeight: number;

  private _onWindowResizeHandler: any;


  constructor(options?: CanvasResizerOptions) {
    if (options) {
      if (options.dimension) this.dimension = options.dimension;
      if (options.dimensionScaleFactor) this.dimensionScaleFactor = options.dimensionScaleFactor;
      if (isNumber(options.throttle)) this.throttle = options.throttle;
      if (isNumber(options.padding)) this.padding = options.padding;
      if (options.resize) this.resize = options.resize;
    }

    this._onWindowResizeHandler = this.throttle > 0 ?
      throttle(this.onWindowResize.bind(this), this.throttle) :
      this.onWindowResize.bind(this);

    this.calculateDimensions();
  }


  calculateDimensions() {
    if (this.dimension == 'fullscreen') {
      this.canvasWidth = window.innerWidth * this.dimensionScaleFactor;
      this.canvasHeight = window.innerHeight * this.dimensionScaleFactor;
      this.canvasStyleWidth = window.innerWidth;
      this.canvasStyleHeight = window.innerHeight;
      return;
    }

    if (Array.isArray(this.dimension)) {
      this.canvasWidth = this.dimension[0] * this.dimensionScaleFactor;
      this.canvasHeight = this.dimension[1] * this.dimensionScaleFactor;

      const containerWidth = window.innerWidth - (2 * this.padding);
      const containerHeight = window.innerHeight - (2 * this.padding);
      const containerAspectRatio = containerWidth / containerHeight;
      const canvasAspectRatio = this.canvasWidth / this.canvasHeight;

      if (canvasAspectRatio > containerAspectRatio) {
        this.canvasStyleWidth = containerWidth;
        this.canvasStyleHeight = this.canvasStyleWidth / canvasAspectRatio;
      } else {
        this.canvasStyleHeight = containerHeight;
        this.canvasStyleWidth = this.canvasStyleHeight * canvasAspectRatio;
      }

      return;
    }

    throw new Error(`Unsupported dimension setting: ${this.dimension}`);
  }


  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.addStyles();

    this.canvas.style.width = `${this.canvasStyleWidth}px`;
    this.canvas.style.height = `${this.canvasStyleHeight}px`;

    window.addEventListener('resize', this._onWindowResizeHandler, false);
  }


  addStyles() {
    if (this.dimension == 'fullscreen') {
      document.body.style.overflow = 'hidden';
    } else {
      const container = this.canvas.parentElement;
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      this.canvas.style.boxShadow = '5px 10px 20px -5px rgba(0, 0, 0, 0.5)';
    }
  }


  removeStyles() {
    if (this.dimension == 'fullscreen') {
      document.body.style.overflow = '';
    } else {
      const container = this.canvas.parentElement;

      if (container) {
        container.style.width = '';
        container.style.height = '';
        container.style.display = '';
        container.style.justifyContent = '';
        container.style.alignItems = '';
      } else {
        console.warn('Canvas container not found, residual styles are not removed');
      }

      this.canvas.style.boxShadow = '';
    }
  }


  onWindowResize() {
    const previous = {
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      canvasStyleWidth: this.canvasStyleWidth,
      canvasStyleHeight: this.canvasStyleHeight
    };

    this.calculateDimensions();

    if (this.canvasWidth != previous.canvasWidth || this.canvasHeight != previous.canvasHeight) {
      this.resize(this.canvasWidth, this.canvasHeight);
    }

    if (this.canvasStyleWidth != previous.canvasStyleWidth || this.canvasStyleHeight != previous.canvasStyleHeight) {
      this.canvas.style.width = `${this.canvasStyleWidth}px`;
      this.canvas.style.height = `${this.canvasStyleHeight}px`;
    }
  }


  destroy() {
    this.removeStyles();
    window.removeEventListener('resize', this._onWindowResizeHandler, false);
    this.canvas = null;
  }
}

