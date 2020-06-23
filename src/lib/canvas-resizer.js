// Dependencies:
// - lodash (isNumber, throttle)

// Assuming: html, body { width: 100%; height: 100%; }

export class CanvasResizer {
  dimension = 'fullscreen';
  dimensionScaleFactor = 1;
  throttle = 500;
  padding = 50;
  resize = (width, height) => {};

  constructor(canvas, options = {}) {
    this.canvas = canvas;

    if (options) {
      if (options.dimension) this.dimension = options.dimension;
      if (options.dimensionScaleFactor)
        this.dimensionScaleFactor = options.dimensionScaleFactor;
      if (_.isNumber(options.throttle)) this.throttle = options.throttle;
      if (_.isNumber(options.padding)) this.padding = options.padding;
      if (options.resize) this.resize = options.resize;
    }

    this._onWindowResizeHandler =
      this.throttle > 0
        ? _.throttle(this.onWindowResize.bind(this), this.throttle)
        : this.onWindowResize.bind(this);

    this.calculateDimensions();
  }

  calculateDimensions() {
    if (this.dimension == 'fullscreen') {
      this.width = window.innerWidth * this.dimensionScaleFactor;
      this.height = window.innerHeight * this.dimensionScaleFactor;
      this.styleWidth = window.innerWidth;
      this.styleHeight = window.innerHeight;
      this.aspectRatio = this.width / this.height;
      return;
    }

    if (Array.isArray(this.dimension)) {
      this.width = this.dimension[0] * this.dimensionScaleFactor;
      this.height = this.dimension[1] * this.dimensionScaleFactor;
      this.aspectRatio = this.width / this.height;

      const containerWidth = window.innerWidth - 2 * this.padding;
      const containerHeight = window.innerHeight - 2 * this.padding;
      const containerAspectRatio = containerWidth / containerHeight;
      const canvasAspectRatio = this.width / this.height;

      if (canvasAspectRatio > containerAspectRatio) {
        this.styleWidth = containerWidth;
        this.styleHeight = this.styleWidth / canvasAspectRatio;
      } else {
        this.styleHeight = containerHeight;
        this.styleWidth = this.styleHeight * canvasAspectRatio;
      }

      return;
    }

    throw new Error(`Unsupported dimension setting: ${this.dimension}`);
  }

  init() {
    this.addStyles();

    this.canvas.style.width = `${this.styleWidth}px`;
    this.canvas.style.height = `${this.styleHeight}px`;

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
        console.warn(
          'Canvas container not found, residual styles are not removed'
        );
      }

      this.canvas.style.boxShadow = '';
    }
  }

  onWindowResize() {
    const previous = {
      canvasWidth: this.width,
      canvasHeight: this.height,
      canvasStyleWidth: this.styleWidth,
      canvasStyleHeight: this.styleHeight,
    };

    this.calculateDimensions();

    if (
      this.width != previous.canvasWidth ||
      this.height != previous.canvasHeight
    ) {
      this.resize(this.width, this.height);
    }

    if (
      this.styleWidth != previous.canvasStyleWidth ||
      this.styleHeight != previous.canvasStyleHeight
    ) {
      this.canvas.style.width = `${this.styleWidth}px`;
      this.canvas.style.height = `${this.styleHeight}px`;
    }
  }

  destroy() {
    this.removeStyles();
    window.removeEventListener('resize', this._onWindowResizeHandler, false);
    this.canvas = null;
  }
}
