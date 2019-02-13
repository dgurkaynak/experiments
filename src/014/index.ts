import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import * as faceapi from 'face-api.js/dist/face-api.min';
import { sleep } from '../utils/promise-helper';
import { loadImage, readImageData } from '../utils/image-helper';
import { getBoundingBox } from '../utils/geometry-helper';
import FaceLandmarks68 from './face-landmarks68';
import FaceFitter from './face-fitter';


import imagePath from './assets/friends.jpg';
// import imagePath from './assets/himym.jpeg';
import faceImagePath from './assets/IMG_0637.JPG';
// import faceImagePath from './assets/barack-obama-smiling.jpg';
// import faceImagePath from './assets/portrait-photography.jpg';

import ssdMobileNetV1Manifest from './faceapi_weights/ssd_mobilenetv1_model-weights_manifest.json';
import ssdMobileNetV1ModelPath1 from './faceapi_weights/ssd_mobilenetv1_model-shard1.weights';
import ssdMobileNetV1ModelPath2 from './faceapi_weights/ssd_mobilenetv1_model-shard2.weights';
import faceLandmark68Manifest from './faceapi_weights/face_landmark_68_model-weights_manifest.json';
import faceLandmark68ModelPath from './faceapi_weights/face_landmark_68_model-shard1.weights';
// Hack for loading models with custom weights url path
ssdMobileNetV1Manifest[0].paths = [
  ssdMobileNetV1ModelPath1.replace('/', ''),
  ssdMobileNetV1ModelPath2.replace('/', ''),
];
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
  dimensionScaleFactor: 1
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

  // Load tensorflow weights
  const [ssdMobileNetV1WeightMap, faceLandmark68WeightMap] = await Promise.all([
    faceapi.tf.io.loadWeights(ssdMobileNetV1Manifest, './'),
    faceapi.tf.io.loadWeights(faceLandmark68Manifest, './')
  ]);
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromWeightMap(ssdMobileNetV1WeightMap),
    faceapi.nets.faceLandmark68Net.loadFromWeightMap(faceLandmark68WeightMap)
  ]);

  await sleep(500);

  const face = await prepareFace();

  const image = await loadImage(imagePath);
  // resizer.canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
  resizer.canvas.getContext('2d').drawImage(image, 0, 0, resizer.width, resizer.height);



  const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  console.log(detections);
  // faceapi.drawLandmarks(resizer.canvas, detections.map(x => x.landmarks), { drawLines: true })
  const detectionsForSize = faceapi.resizeResults(detections, { width: resizer.width, height: resizer.height })
  // faceapi.drawLandmarks(resizer.canvas, detectionsForSize.map(x => x.landmarks), { drawLines: true })
  // debugger;
  // faceapi.drawDetection(resizer.canvas, detectionsForSize.map(x => x.detection), { withScore: true })

  const targetFaceLandmarks = detectionsForSize.map((d) => FaceLandmarks68.createFromObjectArray(d.landmarks.positions));

  const fitter = new FaceFitter(resizer.width, resizer.height);
  fitter.fit(face.image, face.landmarks, targetFaceLandmarks, 0.85, 10);

  fitter.canvas.style.position = 'absolute';
  fitter.canvas.style.top = '0';
  fitter.canvas.style.left = '0';
  elements.container.appendChild(fitter.canvas);
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


async function prepareFace() {
  const image = await loadImage(faceImagePath);
  const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  if (detections.length == 0) {
    throw new Error('No face detected in Deniz photo');
  }
  const landmarks = FaceLandmarks68.createFromObjectArray(detections[0].landmarks.positions);
  // const boundingBox = getBoundingBox(faceLandmarks.points);
  // const landmarkPointsCropped = faceLandmarks.points.map(([x, y]) => [x - boundingBox.x, y - boundingBox.y]);
  // const croppedImageData = readImageData(faceImage, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
  return { image, detections, landmarks };
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
