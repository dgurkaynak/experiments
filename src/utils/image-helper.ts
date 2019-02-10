export function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}


export function readImageData(image: HTMLImageElement, offsetX = 0, offsetY = 0, width, height) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  width = width || image.width;
  height = height || image.height;
  context.drawImage(image, 0, 0);
  return context.getImageData(offsetX, offsetY, width, height);
}
