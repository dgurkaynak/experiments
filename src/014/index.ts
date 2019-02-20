import * as faceapi from 'face-api.js/dist/face-api.min';
import { sleep } from '../utils/promise-helper';
import { loadImage, readImageData, resizeImage } from '../utils/image-helper';
import FaceLandmarks68 from './face-landmarks68';
import { resizePoints, getBoundingBox } from '../utils/geometry-helper';
import FaceDeformer from './face-deformer';
import PoissonBlender from './poisson-blender';
import WorkerReqResPool from './worker-req-res-pool';
import { canvasToURL } from '../utils/canvas-helper';


import sourceImagePath from './assets/IMG_0637.JPG';
import { imagePaths, selfFace, imageFaces } from './images';

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

const USE_WORKERS = true;
const MAX_IMAGE_SIZE = [1280, 1280];

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const poissonBlendMaskCanvas = document.createElement('canvas');
const finalAlphaMaskCanvas = document.createElement('canvas');
const finalImageCanvas = document.createElement('canvas');
const poissonBlender = new PoissonBlender();
const workerReqResPool: WorkerReqResPool = USE_WORKERS ?
  new WorkerReqResPool(() => new Worker('./poisson-blender-worker.ts'), 4) :
  null;

/** Helper time logger */
function timeLogger() {
  const startTime = Date.now();
  return {
    end(message: string, ...args) {
      console.log(`${message} - ${Date.now() - startTime} ms`, ...args);
    }
  };
}

let face: { image: HTMLImageElement, landmarks: FaceLandmarks68 };
let deformer: FaceDeformer;


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

  document.body.addEventListener('drop', onDrop, false);
  document.body.addEventListener('dragover', onDragOver, false);

  await sleep(500);

  // Source face
  face = await getSourceFace(sourceImagePath);
  deformer = new FaceDeformer(
    readImageData(face.image),
    face.landmarks.points,
    MAX_IMAGE_SIZE[0], // Maximum input width
    MAX_IMAGE_SIZE[1] // Maximum input height
  );

  log = timeLogger();
  // Swap faces and print results
  for (const imagePath of imagePaths) {
    const log2 = timeLogger();
    await processAndPrintImage(imagePath);
    log2.end(`Image ${imagePath} done`);
  }
  log.end(`=========== Done - ${imagePaths.length} image(s) =============`);
}


async function processAndPrintImage(imagePath: string) {
  const imageIndex = imagePaths.indexOf(imagePath);
  const precomputedFaces = imageIndex > -1 ? imageFaces[imageIndex].map(points => new FaceLandmarks68(points)) : null;
  const { inputImage } = await swapFaces(imagePath, deformer, precomputedFaces);
  const imageContainer = document.createElement('div');
  imageContainer.style.width = `${inputImage.width}px`;
  imageContainer.style.height = `${inputImage.height}px`;
  imageContainer.style.position = 'relative';
  elements.container.appendChild(imageContainer);

  inputImage.style.position = 'absolute';
  imageContainer.appendChild(inputImage);

  // const deformerImage = new Image();
  // deformerImage.src = await canvasToURL(deformer.imageDataCanvas);
  // deformerImage.style.position = 'absolute';
  // deformerImage.style.opacity = '0';
  // imageContainer.appendChild(deformerImage);

  // const poissonBlendedImage = new Image();
  // poissonBlendedImage.src = await canvasToURL(poissonBlender.canvas);
  // poissonBlendedImage.style.position = 'absolute';
  // poissonBlendedImage.style.opacity = '0';
  // imageContainer.appendChild(poissonBlendedImage);

  const finalAlphaMaskImage = new Image();
  finalAlphaMaskImage.src = await canvasToURL(finalAlphaMaskCanvas);
  finalAlphaMaskImage.style.position = 'absolute';
  imageContainer.appendChild(finalAlphaMaskImage);

  // Final image canvas
  // finalImageCanvas.width = inputImage.width;
  // finalImageCanvas.height = inputImage.height;
  // const finalCC = finalImageCanvas.getContext('2d');
  // finalCC.drawImage(inputImage, 0, 0);
  // finalCC.drawImage(finalAlphaMaskCanvas, 0, 0);
  // const finalImage = new Image();
  // finalImage.src = await canvasToURL(finalImageCanvas);
  // finalImage.style.position = 'absolute';
  // imageContainer.appendChild(finalImage);

  deformer.clear();
}


async function getSourceFace(imagePath) {
  let log = timeLogger();
  const image = await loadImage(imagePath);
  log.end('Source image loaded'); log = timeLogger();
  // const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
  // log.end('Source face detected', detections);
  // if (detections.length == 0) {
  //   throw new Error('No face detected in Deniz photo');
  // }
  // const landmarks = FaceLandmarks68.createFromObjectArray(detections[0].landmarks.positions);
  const landmarks = new FaceLandmarks68(selfFace);
  return { image, landmarks };
}


async function swapFaces(imagePath: string, deformer: FaceDeformer, faces?: FaceLandmarks68[]) {
  let image = await loadImage(imagePath);

  // Check max size, if exceeded resize the image
  if (image.width > MAX_IMAGE_SIZE[0] || image.height > MAX_IMAGE_SIZE[1]) {
    const scaleX = MAX_IMAGE_SIZE[0] / image.width;
    const scaleY = MAX_IMAGE_SIZE[1] / image.height;
    const scale = Math.min(scaleX, scaleY);
    image = await resizeImage(image, image.width * scale, image.height * scale);
  }

  // If faces are not provided, real face detection
  if (!faces) {
    const detections = await faceapi.detectAllFaces(image, new faceapi.SsdMobilenetv1Options()).withFaceLandmarks();
    faces = detections.map((d) => FaceLandmarks68.createFromObjectArray(d.landmarks.positions));
  }

  // Deform source face to all target faces
  faces.forEach(({ points }) => deformer.deform(points));

  // Poisson blend
  preparePoissonBlendMask(faces, image.width, image.height);
  const boundingBoxes = faces.map(({ points }) => {
    const { x, y, width, height } = getBoundingBox(points);
    return [Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height)]; // Crucial
  });
  if (USE_WORKERS) {
    poissonBlender.canvas.width = image.width;
    poissonBlender.canvas.height = image.height;
    const poissonBlenderContext = poissonBlender.canvas.getContext('2d');
    poissonBlenderContext.drawImage(image, 0, 0);
    // poissonBlenderContext.putImageData(readImageData(image), 0, 0);
    const poissonBlendMaskContext = poissonBlendMaskCanvas.getContext('2d');
    const parallelTasks = boundingBoxes.map(async ([x, y, width, height]) => {
      const sourceImageData = deformer.getPartialImageData(x, y, width, height);
      const destinationImageData = readImageData(image, x, y, width, height);
      const maskImageData = poissonBlendMaskContext.getImageData(x, y, width, height);

      const result = await workerReqResPool.addToMessageQueue({
        x,
        y,
        width,
        height,
        iteration: 30,
        sourceImageDataBuffer: sourceImageData.data.buffer,
        destinationImageDataBuffer: destinationImageData.data.buffer,
        maskImageDataBuffer: maskImageData.data.buffer,
      }, [
          sourceImageData.data.buffer,
          destinationImageData.data.buffer,
          maskImageData.data.buffer
        ]);

      const resultImageDataBuffer: ArrayBuffer = (result as any).resultImageDataBuffer;
      const resultImageDataArr = new Uint8ClampedArray(resultImageDataBuffer);
      poissonBlenderContext.putImageData(new ImageData(resultImageDataArr, width, height), x, y);
    });
    await Promise.all(parallelTasks);
  } else {
    poissonBlender.blend(
      deformer.getImageData(image.width, image.height),
      readImageData(image),
      poissonBlendMaskCanvas.getContext('2d').getImageData(0, 0, image.width, image.height),
      boundingBoxes,
      // [[0, 0, image.width, image.height]], // old style
      30
    );
  }

  // Finally crop blended result with feather selection
  prepareFinalAlphaMask(faces, image.width, image.height);
  const finalAlphaMaskContext = finalAlphaMaskCanvas.getContext('2d');
  finalAlphaMaskContext.save();
  finalAlphaMaskContext.globalCompositeOperation = 'source-atop';
  // finalAlphaMaskContext.drawImage(deformer.canvas, 0, 0);
  finalAlphaMaskContext.drawImage(poissonBlender.canvas, 0, 0);
  finalAlphaMaskContext.restore();

  return {
    inputImage: image,
    faces
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


const reader = new FileReader();
function readFileAsDataURL(file: File) {
  return new Promise((resolve, reject) => {
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.readAsDataURL(file);
  });
}


async function onDrop(e: DragEvent) {
  e.preventDefault();

  if (e.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      if (e.dataTransfer.items[i].kind === 'file') {
        const file = e.dataTransfer.items[i].getAsFile();
        if (!file.type.match(/image.*/)) break;
        const imagePath = (await readFileAsDataURL(file)) as string;
        while (elements.container.firstChild) { elements.container.removeChild(elements.container.firstChild); }
        const log = timeLogger();
        await processAndPrintImage(imagePath);
        log.end('Done');
      }
    }
  } else {
    // TODO:
    // Use DataTransfer interface to access the file(s)
    // for (var i = 0; i < e.dataTransfer.files.length; i++) {
    //   console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
    // }
  }
}


function onDragOver(e: DragEvent) {
  e.preventDefault();
}



/**
 * Clean your shit
 */
function dispose() {
  document.body.removeEventListener('drop', onDrop, false);
  document.body.removeEventListener('dragover', onDragOver, false);

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
