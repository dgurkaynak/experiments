/**
 * Set FRAME_COUNT_LIMIT
 * Do not forget the get chrome extension id, need to update in sketch script
 * If needed, turning png's into jpg -> `for i in *.png; do sips -s format jpeg -s formatOptions 80 "${i}" --out "${i%png}jpg"; done`
 */


const FRAME_COUNT_LIMIT = 414;
const ZIP_FILE_NAME = 'screenshots.zip';


let zip;
let isStarted = false;
let isEnded = false;
let isCapturing = false;
let shouldCapture = false;
let frameIndex;

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case 'shouldSkipFrame':
      sendResponse({
        status: 'ok',
        shouldSkipFrame: isStarted && !isCapturing && !isEnded
      });
      return;

    case 'frameSkipped':
      shouldCapture = true;
      sendResponse({ status: 'ok' });
      return;

    default:
      sendResponse({ status: 'error', message: `Unknown command "${request.command}"` });
      return;
  }
});


chrome.browserAction.onClicked.addListener(() => {
  console.log('capture started');

  zip = new JSZip();
  isStarted = true;
  isEnded = false;
  isCapturing = false;
  shouldCapture = true;
  frameIndex = 1;

  capture();
});


function capture() {
  if (!isStarted || isEnded) return;
  if (!shouldCapture) return setTimeout(capture, 100);
  if (frameIndex > FRAME_COUNT_LIMIT) {
    console.log('capture ended');
    isEnded = true;
    shouldCapture = false;

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, ZIP_FILE_NAME);
    });

    return;
  }

  isCapturing = true;
  shouldCapture = false;

  chrome.tabs.captureVisibleTab((screenshotUrl) => {
    if (!screenshotUrl) return console.log('screenshot empty');
    const data = screenshotUrl.replace('data:image/jpeg;base64,', '');
    const fileName = frameIndex.toString().padStart(7, '0');
    zip.file(`${fileName}.png`, data, { base64: true });
    frameIndex++;

    isCapturing = false;
    capture();
  });
}
