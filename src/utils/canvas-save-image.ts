import { dataURIToBlob } from './utils';
import { toBlobAsync } from './canvas-helper';


export default async function saveImage(canvas: HTMLCanvasElement) {
  const blob = await toBlobAsync(canvas);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `image-${Date.now()}.png`;
  link.click();
}
