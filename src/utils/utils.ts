// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#Polyfill
export function dataURIToBlob(dataURI: string) {
  const binStr = atob(dataURI.split(',')[1]);
  const arr = new Uint8Array(binStr.length);

  for (let i = 0; i < binStr.length; i++) {
    arr[i] = binStr.charCodeAt(i);
  }

  return new Blob([arr]);
}
