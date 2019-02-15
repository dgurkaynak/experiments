import * as faceapi from 'face-api.js/dist/face-api.min';
import { sleep } from '../utils/promise-helper';
import { loadImage, readImageData } from '../utils/image-helper';
import FaceLandmarks68 from './face-landmarks68';
import FaceFitter from './face-fitter';
import FaceDeformer from './face-deformer';


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
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
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

  const face = await prepareFace(faceImagePath);
  const image = await loadImage(imagePath);
  elements.container.appendChild(image);

  const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  const targetFaceLandmarks = detections.map((d) => FaceLandmarks68.createFromObjectArray(d.landmarks.positions));
  console.log(detections);



  // #1
  const fitter = new FaceFitter(image.width, image.height);
  fitter.fit(face.image, face.landmarks, targetFaceLandmarks, 0.85, 10);

  fitter.canvas.style.position = 'absolute';
  fitter.canvas.style.top = '0';
  fitter.canvas.style.left = '0';
  fitter.canvas.style.opacity = '0';
  elements.container.appendChild(fitter.canvas);



  // #2
  const deformer = new FaceDeformer(readImageData(face.image), face.landmarks.points, image.width, image.height);
  targetFaceLandmarks.forEach(({ points }) => deformer.deform(points));

  deformer.canvas.style.position = 'absolute';
  deformer.canvas.style.top = '0';
  deformer.canvas.style.left = '0';
  deformer.canvas.style.opacity = '0';
  elements.container.appendChild(deformer.canvas);


  // #3
  const deformerFeatherCanvas = fitter.createMask(targetFaceLandmarks, 0.85, 10);
  const deformerFeatherContext = deformerFeatherCanvas.getContext('2d');

  deformerFeatherContext.save();
  deformerFeatherContext.globalCompositeOperation = 'source-atop';
  deformerFeatherContext.drawImage(deformer.canvas, 0, 0);
  deformerFeatherContext.restore();

  deformerFeatherCanvas.style.position = 'absolute';
  deformerFeatherCanvas.style.top = '0';
  deformerFeatherCanvas.style.left = '0';
  deformerFeatherCanvas.style.opacity = '1';
  elements.container.appendChild(deformerFeatherCanvas);
}


async function prepareFace(faceImagePath) {
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
 * Clean your shit
 */
function dispose() {
  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
