import * as faceapi from 'face-api.js/dist/face-api.min';
import { sleep } from '../utils/promise-helper';
import { loadImage, readImageData } from '../utils/image-helper';
import FaceLandmarks68 from './face-landmarks68';
import { resizePoints, getBoundingBox } from '../utils/geometry-helper';
import FaceDeformer from './face-deformer';
import PoissonBlender from './poisson-blender';


import imagePath from './assets/friends.jpg';
// import imagePath from './assets/himym.jpeg';
import faceImagePath from './assets/IMG_0637.JPG';

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
const poissonBlendMaskCanvas = document.createElement('canvas');
const finalAlphaMaskCanvas = document.createElement('canvas');
const poissonBlender = new PoissonBlender();

/** Helper time logger */
function timeLogger() {
  const startTime = Date.now();
  return {
    end(message: string, ...args) {
      console.log(`${message} - ${Date.now() - startTime} ms`, ...args);
    }
  };
}



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  // Load tensorflow weights
  let log = timeLogger();
  const [ssdMobileNetV1WeightMap, faceLandmark68WeightMap] = await Promise.all([
    faceapi.tf.io.loadWeights(ssdMobileNetV1Manifest, './'),
    faceapi.tf.io.loadWeights(faceLandmark68Manifest, './')
  ]);
  log.end('Weights loaded'); log = timeLogger();
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromWeightMap(ssdMobileNetV1WeightMap),
    faceapi.nets.faceLandmark68Net.loadFromWeightMap(faceLandmark68WeightMap)
  ]);
  log.end('Models ready');

  await sleep(500);

  // Source face
  const face = await getSourceFace(faceImagePath);
  const deformer = new FaceDeformer(
    readImageData(face.image),
    face.landmarks.points,
    3000, // Maximum input width
    3000 // Maximum input height
  );

  const imagePaths = [imagePath];
  for (const imagePath of imagePaths) {
    const { inputImage } = await swapFaces(imagePath, deformer);

    const imageContainer = document.createElement('div');
    imageContainer.style.width = `${inputImage.width}px`;
    imageContainer.style.height = `${inputImage.height}px`;
    imageContainer.style.position = 'relative';
    elements.container.appendChild(imageContainer);

    inputImage.style.position = 'absolute';
    imageContainer.appendChild(inputImage);

    const deformerImage = new Image();
    deformerImage.src = canvasToURL(deformer.imageDataCanvas);
    deformerImage.style.position = 'absolute';
    deformerImage.style.opacity = '0';
    imageContainer.appendChild(deformerImage);

    const poissonBlendedImage = new Image();
    poissonBlendedImage.src = canvasToURL(poissonBlender.canvas);
    poissonBlendedImage.style.position = 'absolute';
    poissonBlendedImage.style.opacity = '0';
    imageContainer.appendChild(poissonBlendedImage);

    const finalAlphaMaskImage = new Image();
    finalAlphaMaskImage.src = canvasToURL(finalAlphaMaskCanvas);
    finalAlphaMaskImage.style.position = 'absolute';
    imageContainer.appendChild(finalAlphaMaskImage);
  }
}


async function getSourceFace(imagePath) {
  let log = timeLogger();
  const image = await loadImage(imagePath);
  log.end('Source image loaded'); log = timeLogger();
  const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  log.end('Source face detected', detections);
  if (detections.length == 0) {
    throw new Error('No face detected in Deniz photo');
  }
  const landmarks = FaceLandmarks68.createFromObjectArray(detections[0].landmarks.positions);
  // const boundingBox = getBoundingBox(faceLandmarks.points);
  // const landmarkPointsCropped = faceLandmarks.points.map(([x, y]) => [x - boundingBox.x, y - boundingBox.y]);
  // const croppedImageData = readImageData(faceImage, boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
  return { image, landmarks };
}


async function swapFaces(imagePath: string, deformer: FaceDeformer) {
  let log = timeLogger();
  const image = await loadImage(imagePath);
  log.end(`Image["${imagePath}"] loaded`); log = timeLogger();
  const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  log.end(`Image["${imagePath}"] detected faces`, detections); log = timeLogger();
  const faces: FaceLandmarks68[] = detections.map((d) => FaceLandmarks68.createFromObjectArray(d.landmarks.positions));

  // Deform source face to all target faces
  faces.forEach(({ points }) => deformer.deform(points));
  log.end(`Image["${imagePath}"] deformed`); log = timeLogger();

  // Poisson blend
  preparePoissonBlendMask(faces, image.width, image.height);
  log.end(`Image["${imagePath}"] poisson blend mask ready`); log = timeLogger();
  const boundingBoxes = faces.map(({ points }) => {
    const { x, y, width, height } = getBoundingBox(points);
    return [Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height)];
  });
  poissonBlender.blend(
    deformer.getImageData(image.width, image.height),
    readImageData(image),
    poissonBlendMaskCanvas.getContext('2d').getImageData(0, 0, image.width, image.height),
    boundingBoxes,
    // [[0, 0, image.width, image.height]], // old style
    30
  );
  log.end(`Image["${imagePath}"] poisson blending completed`); log = timeLogger();

  // Finally crop blended result with feather selection
  prepareFinalAlphaMask(faces, image.width, image.height);
  log.end(`Image["${imagePath}"] final alpha mask ready`); log = timeLogger();
  const finalAlphaMaskContext = finalAlphaMaskCanvas.getContext('2d');
  finalAlphaMaskContext.save();
  finalAlphaMaskContext.globalCompositeOperation = 'source-atop';
  // finalAlphaMaskContext.drawImage(deformer.canvas, 0, 0);
  finalAlphaMaskContext.drawImage(poissonBlender.canvas, 0, 0);
  finalAlphaMaskContext.restore();
  log.end(`Image["${imagePath}"] final alpha masking completed`);

  return {
    inputImage: image,
    faces,
    detections
  };
}


function preparePoissonBlendMask(faces: FaceLandmarks68[], width: number, height: number) {
  poissonBlendMaskCanvas.width = width;
  poissonBlendMaskCanvas.height = height;
  const cc = poissonBlendMaskCanvas.getContext('2d');

  cc.fillStyle = '#000000';
  cc.fillRect(0, 0, width, height);

  faces.forEach((face) => {
    const path = face.getBoundaryPath();
    cc.beginPath();
    path.forEach(([x, y], i) => {
      if (i == 0) {
        cc.moveTo(x, y);
      } else {
        cc.lineTo(x, y);
      }
    });
    cc.closePath();
    cc.fillStyle = '#ffffff';
    cc.fill();
  });
}


function prepareFinalAlphaMask(faces: FaceLandmarks68[], width: number, height: number, faceResizeFactor = 0.85, featherBlur = 10) {
  finalAlphaMaskCanvas.width = width;
  finalAlphaMaskCanvas.height = height;
  const cc = finalAlphaMaskCanvas.getContext('2d');

  cc.clearRect(0, 0, width, height);

  faces.forEach((face) => {
    const boundaryPath = face.getBoundaryPath();
    const resizedPath = resizePoints(boundaryPath, faceResizeFactor);
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
    cc.shadowBlur = featherBlur;
    cc.shadowOffsetX = offsetX;
    cc.fillStyle = '#fff';
    cc.fill();
  });
}


function canvasToURL(canvas: HTMLCanvasElement) {
  const dataString = canvas.toDataURL('image/png');
  const blob = dataURIToBlob(dataString);
  return URL.createObjectURL(blob);
}


function dataURIToBlob(dataURI: string) {
  const binStr = atob(dataURI.split(',')[1]);
  const arr = new Uint8Array(binStr.length);

  for (let i = 0; i < binStr.length; i++) {
    arr[i] = binStr.charCodeAt(i);
  }

  return new Blob([arr]);
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
