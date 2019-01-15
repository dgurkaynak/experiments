import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import VideoReader from '../utils/video-reader';
import videoPath from './clair_de_lune.mp4';
import CanvasRecorder from '../utils/canvas-recorder';



/**
 * Constants
 */
const VIDEO_SIZE = [1280, 720];
const FPS = 30;
const ENABLE_STATS = true;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: VIDEO_SIZE as [number, number],
  dimensionScaleFactor: 1
});
const stats = new Stats();
const videoReader = new VideoReader(videoPath, FPS);
let canvasRecorder: CanvasRecorder;
let frameCounter = 0;

// start
class LowpassFilter {
  private alpha: number;
  private prev: number;

  constructor(rate: number, hz: number) {
    this.alpha = 0.0;
    this.prev = 0.0;
    this.setFilter(rate, hz);
  }

  setFilter(rate: number, hz: number) {
    const timeInterval = 1.0 / rate;
    const tau = 1.0 / (hz * Math.PI * 2);
    this.alpha = timeInterval / (tau + timeInterval);
  }

  resetFilter(val: number) {
    this.prev = val;
  }

  lowpass(sample: number) {
    const stage1 = sample * this.alpha;
    const stage2 = this.prev - (this.prev * this.alpha);
    this.prev = stage1 + stage2;
    return this.prev;
  }

  highpass(sample: number) {
    return sample - this.lowpass(sample);
  }
}

const lowpass1_cutoff = 0.25; // percentage of rate
const lowpass2_cutoff = 0.1;
const lowpass3_cutoff = 0.05;
const rate = 100000.0;
const lpf1 = new LowpassFilter(rate, lowpass1_cutoff * rate);
const lpf2 = new LowpassFilter(rate, lowpass2_cutoff * rate);
const lpf3 = new LowpassFilter(rate, lowpass3_cutoff * rate);

const min_phase_mult = 0.05;
const max_phase_mult = 50.0;
let min_omega = Math.PI * 2 / (0.05 * VIDEO_SIZE[0]);
let max_omega = Math.PI * 2 / (300.0 * VIDEO_SIZE[0]);
let min_phase: number;
let max_phase: number;
let quantval = 30;
let omega = 0.5;
let phase = 0.5;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  await videoReader.init();

  new p5((p_) => {
    p = p_;
    p.setup = setup;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  p.pixelDensity(1);

  const frame = videoReader.read();
  const pContext: CanvasRenderingContext2D = p.drawingContext;
  pContext.putImageData(frame, 0, 0);

  // CCapture.js hooks video.currentTime, so this is a workaround for recording videos
  Object.freeze(HTMLVideoElement.prototype);
  // canvasRecorder = new CanvasRecorder(p.canvas, videoReader.video.duration * 1000, FPS);
  canvasRecorder = new CanvasRecorder(p.canvas, 60000, FPS);
  canvasRecorder.start();
  canvasRecorder.onEnded = () => {
    console.log('record ended');
  };
}


function updateOmegaPhase(om: number, ph: number) {
  omega = p.map(Math.sqrt(om), 0, 1, min_omega, max_omega);
  phase = p.map(Math.pow(ph, 2), 0, 1, min_phase_mult, max_phase_mult);
  max_phase = phase * omega;
  min_phase = -max_phase;
}



async function draw(loop = false) {
  if (videoReader.video.ended) {
    console.log('video ended');
    canvasRecorder.capture();
    return;
  }

  if (ENABLE_STATS) stats.begin();


  await videoReader.nextFrame();
  const frame = videoReader.read();
  console.log(videoReader.video.currentTime);

  // Mess with the params
  updateOmegaPhase(
    p.noise(0, frameCounter * 0.1),
    p.noise(10, frameCounter * 0.1)
  );
  quantval = Math.round(p.noise(20, frameCounter * 0.1) * 20);


  p.loadPixels();


  for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
    for (let y = 0; y < frame.height; y++) {
      const offset = y * frame.width * 4;

      // reset filters
      lpf1.resetFilter(p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase));
      lpf2.resetFilter(p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase));
      lpf3.resetFilter(p.map(frame.data[offset + channelIndex], 0, 255, min_phase, max_phase));

      let sig_int = 0; // integral of the signal
      let pre_m = 0; // previous value of modulated signal

      for (let x = 0; x < frame.width; x++) {

        let sig = p.map(frame.data[offset + (x * 4 + channelIndex)], 0, 255, min_phase, max_phase); // current signal value
        sig_int += sig; // current value of signal integral

        let m = Math.cos(omega * x + sig_int); // modulate signal

        if (quantval > 0) {
          m = p.map(Math.round(p.map(m, -1, 1, 0, quantval)), 0, quantval, -1, 1);
        }

        let dem = Math.abs(m - pre_m); // demodulate signal, derivative
        pre_m = m; // remember current value

        // lowpass filter chain
        dem = lpf1.lowpass(dem);
        dem = lpf2.lowpass(dem);
        dem = lpf3.lowpass(dem);

        // remap signal back to channel value
        const v = p.constrain(Math.round(p.map(2 * (dem - omega), min_phase, max_phase, 0, 255)), 0, 255);

        p.pixels[offset + (x * 4 + channelIndex)] = v;
      }

    }
  }

  p.updatePixels();



  frameCounter++;
  if (ENABLE_STATS) stats.end();
  canvasRecorder.capture();
  loop && requestAnimationFrame(draw);
}
(window as any).go = draw;


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  p.resizeCanvas(width, height);
}


function spatial2index(x: number, y: number, width: number, height: number) {
  return y * width + x;
}


function waitEvent(element: HTMLElement, eventName: string) {
  return new Promise((resolve) => {
    element.addEventListener(eventName, resolve, { once: true });
  });
}


function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function randomIntegerBetween(a: number, b: number) {
  return Math.round(a + Math.random() * (b - a));
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
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
