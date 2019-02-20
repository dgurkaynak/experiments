import { dataURIToBlob } from './utils';


export async function toBlobAsync(canvas: HTMLCanvasElement, ...args): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Polyfill
    if (!canvas.toBlob) {
      const dataString = canvas.toDataURL('image/png');
      resolve(dataURIToBlob(dataString));
      return;
    }

    try {
      canvas.toBlob(resolve, ...args);
    } catch (err) {
      reject(err);
    }
  });
}


export async function canvasToURL(canvas: HTMLCanvasElement) {
  const blob = await toBlobAsync(canvas);
  return URL.createObjectURL(blob);
}
