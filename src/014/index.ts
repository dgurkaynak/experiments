import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import * as faceapi from 'face-api.js/dist/face-api.min';
import { wait } from '../utils/promise-helper';

import imagePath from './assets/friends.jpg';

import tinyFaceDetectorManifest from './faceapi_weights/tiny_face_detector_model-weights_manifest.json';
import tinyFaceDetectorModelPath from './faceapi_weights/tiny_face_detector_model-shard1.weights';
import faceLandmark68Manifest from './faceapi_weights/face_landmark_68_model-weights_manifest.json';
import faceLandmark68ModelPath from './faceapi_weights/face_landmark_68_model-shard1.weights';
// Hack for loading models with custom weights url path
tinyFaceDetectorManifest[0].paths = [tinyFaceDetectorModelPath.replace('/', '')];
faceLandmark68Manifest[0].paths = [faceLandmark68ModelPath.replace('/', '')];


/**
 * Constants
 */
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
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  await wait(500)

  const image = await loadImage(imagePath);
  resizer.canvas.getContext('2d').drawImage(image, 0, 0, resizer.width, resizer.height);

  const tinyFaceDetectorWeightMap = await faceapi.tf.io.loadWeights(tinyFaceDetectorManifest, './');
  await faceapi.nets.tinyFaceDetector.loadFromWeightMap(tinyFaceDetectorWeightMap)

  const faceLandmark68WeightMap = await faceapi.tf.io.loadWeights(faceLandmark68Manifest, './');
  await faceapi.nets.faceLandmark68Net.loadFromWeightMap(faceLandmark68WeightMap)

  const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
  console.log(detections);
  const detectionsForSize = faceapi.resizeResults(detections, { width: resizer.width, height: resizer.height })
  faceapi.drawLandmarks(resizer.canvas, detectionsForSize.map(x => x.landmarks), { drawLines: true })
  // faceapi.drawDetection(resizer.canvas, detectionsForSize.map(x => x.detection), { withScore: true })
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  // p.pixelDensity(1);


}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  // p.background('#ffffff');
  // p.ellipse(resizer.width / 2, resizer.height / 2, 100, 100);

  if (ENABLE_STATS) stats.end();
}






function readImage(src) {
  const image = new Image();
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, image.width, image.height));
    };

    image.onerror = reject;
    image.src = src;
  });
}

function loadImage(src) {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
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
