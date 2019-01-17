import p5, { FFT } from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import { waitEvent } from '../utils/promise-helper';
import audioPath from './portishead_we_carry_on.mp3';
import flatten from 'lodash/flatten';


/**
 * Constants
 */
const ENABLE_STATS = true;
const FFT_SIZE = 128;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();
const audio = new Audio();
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.connect(audioCtx.destination);
analyser.fftSize = FFT_SIZE;
analyser.smoothingTimeConstant = 0.8;
const source = audioCtx.createMediaElementSource(audio);
let isStarted = false;
const beatTimes = (window as any).beatTimes = [5.95993, 6.315828, 6.732639, 7.196971, 7.662585, 8.14182, 8.608798, 9.100969, 9.589226, 10.06585, 10.533535, 11.005704, 11.469253, 11.940862, 12.428481, 12.909205, 13.380499, 13.850703, 14.315102, 14.789372, 15.26712, 15.760544, 16.2228, 16.683537, 17.141214, 17.594921, 18.06922, 18.541134, 19.026117, 19.485351, 19.973766, 20.449133, 20.915374, 21.385233, 21.853334, 22.308571, 22.772971, 23.23737, 23.695964, 24.195193, 24.677007, 25.181621, 25.645531, 26.110839, 26.573555, 27.051247, 27.52572, 27.965673, 28.464765, 28.926259, 29.408073, 29.893958, 30.348481, 30.816589, 31.293679, 31.782313, 32.269808, 32.726241, 33.198111, 33.678006, 34.143979, 34.609342, 35.079546, 35.555556, 36.03737, 36.512762, 36.982098, 37.464503, 37.934201, 38.36517, 38.835374, 39.340408, 39.833024, 40.286505, 40.75102, 41.238095, 41.703039, 42.190658, 42.643447, 43.107846];
// const beatTimes2 = (window as any).beatTimes2 = [[17.136327, 17.432381], [17.606531, 18.062978], [18.02449, 18.062997], [18.278768, 18.550682], [18.721088, 19.022893], [19.456591, 19.957551], [19.87421, 19.957551], [19.909206, 19.957551], [19.944262, 19.957551], [20.183342, 20.45678], [20.65769, 20.932789], [21.385555, 21.815147], [21.801646, 21.815147], [22.062921, 22.271051], [22.511746, 22.743946], [23.22324, 23.69504], [23.641316, 23.695054], [23.676483, 23.695062], [23.968267, 24.206803], [24.421587, 24.653787], [25.135601, 25.559079], [25.55356, 25.559107], [25.878639, 26.103667], [26.322854, 26.567302], [26.991383, 27.492426], [27.411156, 27.492426], [27.444804, 27.492426], [27.480816, 27.492426], [27.736236, 27.97424], [28.20644, 28.444444], [28.926259, 29.400692], [29.344218, 29.400708], [29.383756, 29.400715], [29.633728, 29.878277], [30.087256, 30.359251], [30.807075, 31.303635], [31.225034, 31.303657], [31.259864, 31.303665], [31.294694, 31.303671], [31.532698, 31.828384], [32.043537, 32.246712], [32.711111, 33.144472], [33.128476, 33.144488], [33.400023, 33.655212], [33.871739, 34.119575], [34.568707, 35.019408], [34.986634, 35.019424], [35.320515, 35.519951], [35.803803, 36.023504], [36.461134, 36.942948], [36.884229, 36.942948], [36.919728, 36.942948], [37.184525, 37.389932], [37.690122, 37.877551], [38.386291, 38.840491], [38.806349, 38.840503], [38.84034, 38.840509], [39.107507, 39.303623], [39.575964, 39.839637], [40.243578, 40.679503], [40.658141, 40.679518], [40.951819, 41.185588], [41.424399, 41.662404], [42.161633, 42.584286], [42.579592, 42.584331], [42.896134, 43.135969], [43.362205, 43.58966]];
const beatTimes2 = (window as any).beatTimes2 = [[17.136327, 17.432381], [17.606531, 18.062978], [18.278768, 18.550682], [18.721088, 19.022893], [19.456591, 19.957551], [20.183342, 20.45678], [20.65769, 20.932789], [21.385555, 21.815147], [22.062921, 22.271051], [22.511746, 22.743946], [23.22324, 23.69504], [23.968267, 24.206803], [24.421587, 24.653787], [25.135601, 25.559079], [25.878639, 26.103667], [26.322854, 26.567302], [26.991383, 27.492426], [27.736236, 27.97424], [28.20644, 28.444444], [28.926259, 29.400692], [29.633728, 29.878277], [30.087256, 30.359251], [30.807075, 31.303635], [31.532698, 31.828384], [32.043537, 32.246712], [32.711111, 33.144472], [33.400023, 33.655212], [33.871739, 34.119575], [34.568707, 35.019408], [35.320515, 35.519951], [35.803803, 36.023504], [36.461134, 36.942948], [37.184525, 37.389932], [37.690122, 37.877551], [38.386291, 38.840491], [39.107507, 39.303623], [39.575964, 39.839637], [40.243578, 40.679503], [40.951819, 41.185588], [41.424399, 41.662404], [42.161633, 42.584286], [42.896134, 43.135969], [43.362205, 43.58966]];
const beatTimes2F = flatten(beatTimes2);

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  audio.src = audioPath;
  audio.load();
  await waitEvent(audio, 'canplaythrough');
  source.connect(analyser);

  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  p.canvas.addEventListener('click', async () => {
    await audioCtx.resume();
    isStarted = true;
    console.log('context resumed');

    audio.play();
  }, { once: true });
}
(window as any).audio = audio;


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  p.pixelDensity(1);
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  if (isStarted) {
    p.background('#ffffff');

    draw2();

    // const data = getDataFromAudio();
    // const lineWidth = resizer.width / (FFT_SIZE / 2);
    // data.f.forEach((val, i) => {
    //   const x = i * lineWidth;
    //   const y = resizer.height - p.map(val, 0, 255, 0, resizer.height);
    //   p.stroke(0, 0, 0, 128);
    //   p.strokeWeight(lineWidth);
    //   p.line(x, resizer.height, x, y + 50);
    // });

  } else {
    p.background('#ffffff');
    p.text('Click to start!', resizer.width / 2, resizer.height / 2);
  }




  if (ENABLE_STATS) stats.end();
}


let beatSwitch1 = false;
let beatSwitch2 = false;
function draw2() {
  if (beatTimes[0] <= audio.currentTime) {
    beatSwitch1 = !beatSwitch1;
    beatTimes.shift();
  }

  p.noStroke();
  p.fill(beatSwitch1 ? 'red' : 'yellow');
  p.rect(0, 0, resizer.width / 2, resizer.height);

  if (beatTimes2F[0] <= audio.currentTime) {
    beatSwitch2 = !beatSwitch2;
    beatTimes2F.shift();
  }

  p.noStroke();
  p.fill(beatSwitch2 ? 'pink' : 'white');
  p.rect(resizer.width / 2, 0, resizer.width, resizer.height);
}


function getDataFromAudio() {
  //analyser.fftSize = 2048;
  var freqByteData = new Uint8Array(analyser.fftSize / 2);
  var timeByteData = new Uint8Array(analyser.fftSize / 2);
  analyser.getByteFrequencyData(freqByteData);
  analyser.getByteTimeDomainData(timeByteData);
  return { f: freqByteData, t: timeByteData }; // array of all 1024 levels
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  p.resizeCanvas(width, height);
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
