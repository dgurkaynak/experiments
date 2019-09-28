import IExperiment from './iexperiment';
import throttle from 'lodash/throttle';
import { loadImage } from '../utils/image-helper';


export default class ExperimentView {
  element = document.createElement('a');
  mediaContainerElement = document.createElement('div');
  spinnerElement: Element;
  videoWrapperElement: Element;
  videoElement: HTMLVideoElement;
  imageElement: HTMLImageElement;
  width: number;
  areExtraImagesLoaded = false;
  onMouseMoveThrottled = throttle(this.onMouseMove.bind(this), 250);


  constructor(public data: IExperiment) {
    // Noop
  }


  init() {
    // Pre-defined elements
    this.element.classList.add('experiment');
    this.element.href = this.data.link;
    // this.element.title = this.data.title;
    this.mediaContainerElement.classList.add('experiment-media-container');
    this.element.appendChild(this.mediaContainerElement);

    // Image
    this.imageElement = document.createElement('img');
    this.imageElement.classList.add('experiment-image');
    this.imageElement.src = this.data.imagePath;
    this.imageElement.alt = this.data.title;
    this.mediaContainerElement.appendChild(this.imageElement);

    // Text elements
    const titleElement = document.createElement('div');
    titleElement.classList.add('experiment-title');
    titleElement.textContent = this.data.title;
    this.element.appendChild(titleElement);

    if (this.data.description) {
      const descriptionElement = document.createElement('div');
      descriptionElement.classList.add('experiment-description');
      descriptionElement.textContent = this.data.description;
      this.element.appendChild(descriptionElement);
    }

    this.updateWidth();
    this.bindEvents();
  }


  bindEvents() {
    if (this.data.videoPath) {
      this.element.addEventListener('mouseenter', this.onMouseEnter.bind(this), false);
      this.element.addEventListener('mouseleave', this.onMouseLeave.bind(this), false);
    }

    if (this.data.extraImages && this.data.extraImages.length > 0) {
      this.element.addEventListener('mousemove', this.onMouseMoveThrottled, false);
    }
  }

  onMouseEnter() {
    if (this.spinnerElement) return;

    if (this.videoElement) {
      this.videoElement.play();
      return;
    }

    this.createSpinner();

    this.videoWrapperElement = document.createElement('div');
    this.videoWrapperElement.classList.add('experiment-video-wrapper');
    this.mediaContainerElement.appendChild(this.videoWrapperElement);
    this.videoElement = document.createElement('video');
    this.videoElement.classList.add('experiment-video');

    this.videoElement.muted = true;
    this.videoElement.autoplay = true;
    this.videoElement.loop = true;

    this.videoElement.addEventListener('canplaythrough', () => {
      this.videoWrapperElement.appendChild(this.videoElement);

      this.mediaContainerElement.removeChild(this.spinnerElement);
      this.spinnerElement = null;
    }, { once: true });

    this.videoElement.src = this.data.videoPath;
  }

  onMouseLeave() {
    // If loading, noop
    if (this.spinnerElement) return;

    this.videoElement.pause();
    this.videoElement.currentTime = 0;
  }

  onMouseMove(e: MouseEvent) {
    if (this.spinnerElement) return;
    if (!this.width) return;

    if (!this.areExtraImagesLoaded) {
      this.createSpinner();
      const tasks = this.data.extraImages.map(loadImage);
      Promise
        .all(tasks)
        .then(() => {
          // Images are (hopefully) cached now
          this.areExtraImagesLoaded = true;
          this.mediaContainerElement.removeChild(this.spinnerElement);
          this.spinnerElement = null;
        })
        .catch(err => console.error('Could not load extra images', err));
      return;
    }

    const x = e.offsetX;
    const imagePaths = [ this.data.imagePath ].concat(this.data.extraImages);
    let imageIndex = Math.floor((e.offsetX / this.width) * imagePaths.length);
    imageIndex = Math.min(Math.max(imageIndex, 0), imagePaths.length - 1);

    this.imageElement.src = imagePaths[imageIndex];
  }

  createSpinner() {
    if (this.spinnerElement) return;

    //<div class="lds-ring"><div></div><div></div><div></div><div></div></div>
    this.spinnerElement = document.createElement('div');
    this.spinnerElement.classList.add('lds-ring', 'experiment-spinner');
    this.spinnerElement.appendChild(document.createElement('div'));
    this.spinnerElement.appendChild(document.createElement('div'));
    this.spinnerElement.appendChild(document.createElement('div'));
    this.spinnerElement.appendChild(document.createElement('div'));

    this.mediaContainerElement.appendChild(this.spinnerElement);
  }

  updateWidth() {
    this.width = this.element.offsetWidth;
  }
}
