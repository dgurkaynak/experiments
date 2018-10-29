declare module 'ccapture.js' {
  export default class CCapture {
    constructor(options: {
      format: 'webm'|'gif'|'png'|'jpg'|'ffmpegserver',
      /** target framerate for the capture */
      framerate?: number,
      /** supersampling of frames to create a motion-blurred frame (0 or 1 make no effect) */
      motionBlurFrames?: 0|1,
      /** quality for webm/jpg */
      quality?: number,
      /** name of the files to be exported. if no name is provided, a GUID will be generated */
      name?: string,
      /** dumps info on the console */
      verbose?: boolean,
      /** adds a widget with capturing info (WIP) */
      display?: boolean,
      /** automatically stops and downloads when reaching that time (seconds). Very convenient for long captures: set it and forget it (remember autoSaveTime!) */
      timeLimit?: number,
      /** it will automatically download the captured data every n seconds (only available for webm/png/jpg) */
      autoSaveTime?: number,
      /** skip to that mark (seconds) */
      startTime?: number,
      /** path to the gif worker script */
      workersPath?: string
    });


    start();
    stop();
    capture(canvas: HTMLCanvasElement);
    save(callback?: (blob: Blob) => void);
  }
}
