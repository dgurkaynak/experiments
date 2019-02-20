import { canvasToURL } from './canvas-helper';


export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}


let readImageDataCanvas: HTMLCanvasElement;
export function readImageData(image: HTMLImageElement, offsetX = 0, offsetY = 0, width?, height?) {
  if (!readImageDataCanvas) readImageDataCanvas = document.createElement('canvas');
  const context = readImageDataCanvas.getContext('2d');
  readImageDataCanvas.width = image.width;
  readImageDataCanvas.height = image.height;
  context.clearRect(0, 0, image.width, image.height);
  width = width || image.width;
  height = height || image.height;
  context.drawImage(image, 0, 0);
  return context.getImageData(offsetX, offsetY, width, height);
}


let resizeImageDataCanvas: HTMLCanvasElement;
export async function resizeImage(image: HTMLImageElement, width?, height?): Promise<HTMLImageElement> {
  if (!resizeImageDataCanvas) resizeImageDataCanvas = document.createElement('canvas');
  const context = resizeImageDataCanvas.getContext('2d');
  width = width || image.width;
  height = height || image.height;
  resizeImageDataCanvas.width = width;
  resizeImageDataCanvas.height = height;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const newImage = new Image();
  const url = await canvasToURL(resizeImageDataCanvas);

  return new Promise((resolve, reject) => {
    newImage.onload = () => resolve(newImage);
    newImage.onerror = reject;
    newImage.src = url;
  });
}
