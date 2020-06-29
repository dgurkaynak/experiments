// Global deps
// - p5
// - stats.js
// - dat.gui
// - lodash (throttle)

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { saveImage } from '../lib/canvas-helper.js';
import { loadImage, readImageData } from '../lib/image-helper.js';

/**
 * Constants
 */
let IMAGE_SIZE = [1080, 1065];
const ENABLE_STATS = false;

const GUISettings = class {
  omega = 0.5;
  phase = 0.5;
  quantVal = 15;

  saveImage = async () => {
    saveImage(resizer.canvas);
  };
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p;
const resizer = new CanvasResizer(null, {
  dimension: IMAGE_SIZE,
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
let image;
let imageData;
const drawThrottled = _.throttle(draw, 500);

// start
class LowpassFilter {
  alpha = null;
  prev = null;

  constructor(rate, hz) {
    this.alpha = 0.0;
    this.prev = 0.0;
    this.setFilter(rate, hz);
  }

  setFilter(rate, hz) {
    const timeInterval = 1.0 / rate;
    const tau = 1.0 / (hz * Math.PI * 2);
    this.alpha = timeInterval / (tau + timeInterval);
  }

  resetFilter(val) {
    this.prev = val;
  }

  lowpass(sample) {
    const stage1 = sample * this.alpha;
    const stage2 = this.prev - this.prev * this.alpha;
    this.prev = stage1 + stage2;
    return this.prev;
  }

  highpass(sample) {
    return sample - this.lowpass(sample);
  }
}

const lowpass1_cutoff = 0.25; // percentage of rate
const lowpass2_cutoff = 0.1;
const lowpass3_cutoff = 0.05;
const rate = 100000.0;
let lpf1 = new LowpassFilter(rate, lowpass1_cutoff * rate);
let lpf2 = new LowpassFilter(rate, lowpass2_cutoff * rate);
let lpf3 = new LowpassFilter(rate, lowpass3_cutoff * rate);

const min_phase_mult = 0.05;
const max_phase_mult = 50.0;
let min_omega = (Math.PI * 2) / (0.05 * IMAGE_SIZE[0]);
let max_omega = (Math.PI * 2) / (300.0 * IMAGE_SIZE[0]);
let min_phase;
let max_phase;
let quantval = 30;
let omega = 0.5;
let phase = 0.5;

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  image = await loadImage('./Apollo11HP-128539876.jpg');
  imageData = await readImageData(image);

  new p5((p_) => {
    p = p_;
    p.setup = setup;
  }, elements.container);

  // Settings
  gui.add(settings, 'omega', 0, 1).step(0.01).onFinishChange(drawThrottled);
  gui.add(settings, 'phase', 0, 1).step(0.01).onFinishChange(drawThrottled);
  gui.add(settings, 'quantVal', 1, 30).step(0.1).onFinishChange(drawThrottled);
  gui.add(settings, 'saveImage');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}

/**
 * p5's setup function
 */
function setup() {
  const renderer = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  const pContext = p.drawingContext;
  pContext.putImageData(imageData, 0, 0);

  draw();
}

function updateOmegaPhase(om, ph) {
  omega = p.map(Math.sqrt(om), 0, 1, min_omega, max_omega);
  phase = p.map(Math.pow(ph, 2), 0, 1, min_phase_mult, max_phase_mult);
  max_phase = phase * omega;
  min_phase = -max_phase;
}

async function draw() {
  if (ENABLE_STATS) stats.begin();

  updateOmegaPhase(settings.omega, settings.phase);
  quantval = settings.quantVal;

  p.loadPixels();
  const frame = imageData;

  for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
    for (let y = 0; y < frame.height; y++) {
      const offset = y * frame.width * 4;

      // reset filters
      lpf1.resetFilter(
        p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase)
      );
      lpf2.resetFilter(
        p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase)
      );
      lpf3.resetFilter(
        p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase)
      );

      let sig_int = 0; // integral of the signal
      let pre_m = 0; // previous value of modulated signal

      for (let x = 0; x < frame.width; x++) {
        let sig = p.map(
          frame.data[offset + (x * 4 + channelIndex)],
          0,
          255,
          min_phase,
          max_phase
        ); // current signal value
        sig_int += sig; // current value of signal integral

        let m = Math.cos(omega * x + sig_int); // modulate signal

        if (quantval > 0) {
          m = p.map(
            Math.round(p.map(m, -1, 1, 0, quantval)),
            0,
            quantval,
            -1,
            1
          );
        }

        let dem = Math.abs(m - pre_m); // demodulate signal, derivative
        pre_m = m; // remember current value

        // lowpass filter chain
        dem = lpf1.lowpass(dem);
        dem = lpf2.lowpass(dem);
        dem = lpf3.lowpass(dem);

        // remap signal back to channel value
        const v = p.constrain(
          Math.round(p.map(2 * (dem - omega), min_phase, max_phase, 0, 255)),
          0,
          255
        );

        p.pixels[offset + (x * 4 + channelIndex)] = v;
      }
    }
  }

  p.updatePixels();

  if (ENABLE_STATS) stats.end();
}

/**
 * On window resized
 */
function onWindowResize(width, height) {
  p.resizeCanvas(width, height);
}

/**
 * Listen dragover event for drag&drop
 */
function onDragOver(event) {
  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}
document.body.addEventListener('dragover', onDragOver);

/**
 * Listen drop event for drag&drop
 */
async function onDrop(event) {
  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();

  if (event.dataTransfer.files) {
    onFilesDroppedOrSelected(event.dataTransfer.files);
  } else {
    console.log(`Your browser does not support FileList`);
  }
}
document.body.addEventListener('drop', onDrop);

/**
 * Main method for drag & drop or file-input selection.
 */
async function onFilesDroppedOrSelected(fileList) {
  const images = [];
  // Use DataTransferItemList interface to access the file(s)
  for (let i = 0; i < fileList.length; i++) {
    // If dropped items aren't files, reject them
    const file = fileList[i];
    if (file.type.split('/')[0] == 'image') {
      images.push({
        name: file.name,
        file,
      });
    }
  }

  if (images.length == 0) {
    console.log('No image found');
    return;
  }

  const url = URL.createObjectURL(images[0].file);
  image = await loadImage(url);
  imageData = await readImageData(image);

  p.remove();

  IMAGE_SIZE = [imageData.width, imageData.height];
  min_omega = (Math.PI * 2) / (0.05 * IMAGE_SIZE[0]);
  max_omega = (Math.PI * 2) / (300.0 * IMAGE_SIZE[0]);
  lpf1 = new LowpassFilter(rate, lowpass1_cutoff * rate);
  lpf2 = new LowpassFilter(rate, lowpass2_cutoff * rate);
  lpf3 = new LowpassFilter(rate, lowpass3_cutoff * rate);

  new p5((p_) => {
    p = p_;
    p.setup = function () {
      const renderer = p.createCanvas(imageData.width, imageData.height);
      p.pixelDensity(1);

      resizer.canvas = renderer.canvas;
      resizer.dimension = [imageData.width, imageData.height];
      resizer.calculateDimensions();
      resizer.addStyles();
      resizer.canvas.style.width = `${resizer.styleWidth}px`;
      resizer.canvas.style.height = `${resizer.styleHeight}px`;

      const pContext = p.drawingContext;
      pContext.putImageData(imageData, 0, 0);

      draw();
    };
  }, elements.container);
}

/**
 * Clean your shit
 */
function dispose() {
  resizer.destroy();
  p.remove();
  p = null;

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

main().catch((err) => console.error(err));
