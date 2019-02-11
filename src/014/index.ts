import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import * as faceapi from 'face-api.js/dist/face-api.min';
import { sleep } from '../utils/promise-helper';
import { loadImage, readImageData } from '../utils/image-helper';
import FaceDeformer from './face-deformer';
import MaskCreator from './mask-creator';
import PoissonBlender from './poisson-blender';

import imagePath from './assets/friends.jpg';
import faceImagePath from './assets/barack-obama-smiling.jpg';
// import faceImagePath from './assets/DSCF2449.JPG';

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

  await sleep(500);

  const image = await loadImage(imagePath);
  // resizer.canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
  resizer.canvas.getContext('2d').drawImage(image, 0, 0, resizer.width, resizer.height);

  const tinyFaceDetectorWeightMap = await faceapi.tf.io.loadWeights(tinyFaceDetectorManifest, './');
  await faceapi.nets.tinyFaceDetector.loadFromWeightMap(tinyFaceDetectorWeightMap)

  const faceLandmark68WeightMap = await faceapi.tf.io.loadWeights(faceLandmark68Manifest, './');
  await faceapi.nets.faceLandmark68Net.loadFromWeightMap(faceLandmark68WeightMap)

  const detections = await faceapi.detectAllFaces(image, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
  console.log(detections);
  // faceapi.drawLandmarks(resizer.canvas, detections.map(x => x.landmarks), { drawLines: true })
  const detectionsForSize = faceapi.resizeResults(detections, { width: resizer.width, height: resizer.height })
  // faceapi.drawLandmarks(resizer.canvas, detectionsForSize.map(x => x.landmarks), { drawLines: true })
  // debugger;
  // faceapi.drawDetection(resizer.canvas, detectionsForSize.map(x => x.detection), { withScore: true })


  const faceImage = await loadImage(faceImagePath);
  const faceDetections = await faceapi.detectAllFaces(faceImage, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
  console.log(faceDetections);
  const landmarkPoints = faceDetections[0].landmarks.positions.map(({ _x, _y }) => [_x, _y]);
  const landmarkBoundingBox = getBoundingBox(landmarkPoints);
  const landmarkPointsCropped = landmarkPoints.map(([x, y]) => [x - landmarkBoundingBox.x, y - landmarkBoundingBox.y]);
  const croppedImageData = readImageData(faceImage, landmarkBoundingBox.x, landmarkBoundingBox.y, landmarkBoundingBox.width, landmarkBoundingBox.height);

  const maskCreator = new MaskCreator(resizer.width, resizer.height);
  const maskIncludePaths = [];
  const maskExcludePaths = [];

  const faceDeformer = new FaceDeformer(croppedImageData, landmarkPointsCropped, resizer.width, resizer.height);
  detectionsForSize.forEach((d) => {
    const paths = faceLandmarks2path(d.landmarks.positions);
    maskIncludePaths.push(paths.include);
    maskExcludePaths.push(paths.exclude);
    faceDeformer.deform(d.landmarks.positions.map(({ _x, _y }) => [_x, _y]));
  });

  maskCreator.create(maskIncludePaths, maskExcludePaths);

  // faceDeformer.canvas.style.position = 'absolute';
  // faceDeformer.canvas.style.top = '0';
  // faceDeformer.canvas.style.left = '0';
  // elements.container.appendChild(faceDeformer.canvas);

  // maskCreator.canvas.style.position = 'absolute';
  // maskCreator.canvas.style.top = '0';
  // maskCreator.canvas.style.left = '0';
  // elements.container.appendChild(maskCreator.canvas);

  const poissonBlender = new PoissonBlender();
  poissonBlender.blend(
    faceDeformer.getImageData(),
    // readImageData(image),
    resizer.canvas.getContext('2d').getImageData(0, 0, resizer.width, resizer.height),
    maskCreator.context.getImageData(0, 0, maskCreator.canvas.width, maskCreator.canvas.height),
    30
  );

  poissonBlender.canvas.style.position = 'absolute';
  poissonBlender.canvas.style.top = '0';
  poissonBlender.canvas.style.left = '0';
  elements.container.appendChild(poissonBlender.canvas);
}



function faceLandmarks2path(points: { _x: number, _y: number }[]) {
  const includePath = [].concat(
    points.slice(0, 17).map(({ _x, _y }) => [_x, _y]),
    [
      points[26],
      points[25],
      points[24],
      points[23],
      points[20],
      points[19],
      points[18],
      points[17]
    ].map(({ _x, _y }) => [_x, _y])
  );
  const excludePath = points.slice(60, 68).map(({ _x, _y }) => [_x, _y]);
  return {
    include: includePath,
    exclude: excludePath
  }
}



function getBoundingBox(points: number[][]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;


  points.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
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
