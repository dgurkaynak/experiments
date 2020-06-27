// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
export function dataURIToBlob(dataURI) {
  const binStr = atob(dataURI.split(',')[1]);
  const arr = new Uint8Array(binStr.length);

  for (let i = 0; i < binStr.length; i++) {
    arr[i] = binStr.charCodeAt(i);
  }

  return new Blob([arr]);
}

export async function toBlobAsync(canvas, ...args) {
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


export async function canvasToURL(canvas) {
  const blob = await toBlobAsync(canvas);
  return URL.createObjectURL(blob);
}


/**
 * Downloads canvas' current state as PNG image. Image dimensions will be canvas's `width` and `height` attr.
 * So if you want your image to be at specific dimensions, you better set `CanvasResizer`s `dimension` option.
 *
 * NOTE: This does not work with `THREE.WebGLRenderer`s default options. You need to set
 * `preserveDrawingBuffer: true` option. Otherwise, the image will be black.
 */
export async function saveImage(canvas) {
  const blob = await toBlobAsync(canvas);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `image-${Date.now()}.png`;
  link.click();
}
