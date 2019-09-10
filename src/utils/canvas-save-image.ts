import { toBlobAsync } from './canvas-helper';


/**
 * Downloads canvas' current state as PNG image. Image dimensions will be canvas's `width` and `height` attr.
 * So if you want your image to be at specific dimensions, you better set `CanvasResizer`s `dimension` option.
 *
 * NOTE: This does not work with `THREE.WebGLRenderer`s default options. You need to set
 * `preserveDrawingBuffer: true` option. Otherwise, the image will be black.
 */
export default async function saveImage(canvas: HTMLCanvasElement) {
  const blob = await toBlobAsync(canvas);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `image-${Date.now()}.png`;
  link.click();
}
