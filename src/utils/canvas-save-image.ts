// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
function dataURIToBlob(dataURI: string) {
  const binStr = atob(dataURI.split(',')[1]);
  const arr = new Uint8Array(binStr.length);

  for (let i = 0; i < binStr.length; i++) {
    arr[i] = binStr.charCodeAt(i);
  }

  return new Blob([arr]);
}

export default function saveImage(canvas: HTMLCanvasElement) {
  const dataString = canvas.toDataURL('image/png');
  const blob = dataURIToBlob(dataString);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `image-${Date.now()}.png`;
  link.click();
}
