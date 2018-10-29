export default class Clock {
  /**
   * When the clock is running, It holds the starttime of the clock.
   * This counted from the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.
   */
  startTime = 0;

  /**
   * When the clock is running, It holds the previous time from a update.
   * This counted from the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC.
   */
  oldTime = 0;

  /**
   * When the clock is running, It holds the time elapsed between the start of the clock to the previous update.
   * This parameter is in seconds of three decimal places.
   */
  elapsedTime = 0;

  /**
   * This property keeps track whether the clock is running or not.
   */
  running = false;


  /**
   * Creates an instance of Clock.
   * @param {boolean} [autoStart=true] If set, starts the clock automatically when the first update is called.
   */
  constructor(public autoStart = true) {
    // Noop
  }


  /**
   * Starts clock.
   */
  start() {
    this.startTime = (typeof performance === 'undefined' ? Date : performance).now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }


  /**
   * Stops clock.
   */
  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }


  /**
   * Get the seconds passed since the clock started.
   */
  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }


  /**
   * Get the seconds passed since the last call to this method.
   */
  getDelta() {
    let diff = 0;

    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }

    if (this.running) {
      const newTime = (typeof performance === 'undefined' ? Date : performance).now();
      diff = (newTime - this.oldTime) / 1000;
      this.oldTime = newTime;
      this.elapsedTime += diff;
    }

    return diff;
  }
}
