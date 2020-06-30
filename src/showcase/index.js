import { loadImage } from '../lib/image-helper.js';

const experiments = [
  {
    title: '1 / Waves',
    description: '',
    link: './1-waves',
    imagePath: './exports/1/1-1024h.png',
    videoPath: './exports/1/1-768h-10s.mp4',
  },
  {
    title: '3A / Kubes',
    description: '',
    link: './3a-kubes',
    imagePath: './exports/3a/3a-1024h.png',
    videoPath: './exports/3a/3a-768h-5s.mp4',
  },
  {
    title: '3B / Kubes in Perspective',
    description: '',
    link: './3b-kubes-perspective',
    imagePath: './exports/3b/3b-1024h.png',
    videoPath: './exports/3b/3b-768h-5s.mp4',
  },
  {
    title: '4 / Kem',
    description: '',
    link: './4-kem',
    imagePath: './exports/4/4-1024h.jpg',
    videoPath: './exports/4/4-768h-8s.mp4',
  },
  {
    title: '5B / Migraine v2',
    description: '',
    link: './5b-migraine-v2',
    imagePath: './exports/5b/5b-921h.jpg',
    videoPath: './exports/5b/5b-768h-14s.mp4',
  },
  {
    title: '6 / Wiggly Text',
    description: '',
    link: './6-wiggly-text',
    imagePath: './exports/6/6-1024h.png',
    videoPath: './exports/6/6-1024h-5s.mp4',
  },
  {
    title: '7 / Blah Blah',
    description: '',
    link: './7-blah-blah',
    imagePath: './exports/7/7-1024h.png',
    videoPath: './exports/7/7-1024h-15s.mp4',
  },
  {
    title: '8A / Perlin Swing',
    description: '',
    link: './8a-perlin-swing',
    imagePath: './exports/8a/8a-1024h.png',
    videoPath: './exports/8a/8a-768h-5s.mp4',
  },
  {
    title: '8B / Perlin Swing Radial',
    description: '',
    link: './8b-perlin-swing-radial',
    imagePath: './exports/8b/8b-1024h.png',
    videoPath: './exports/8b/8b-768h-5s.mp4',
  },
  {
    title: '8C / Perlin Trail',
    description: '',
    link: './8c-perlin-trail',
    imagePath: './exports/8c/01.jpg',
    videoPath: null,
    extraImages: [
      './exports/8c/02.jpg',
      './exports/8c/03.jpg',
      './exports/8c/04.jpg',
    ],
  },
  {
    title: '9A / Matter: Gravity',
    description: '',
    link: './9a-matter-gravity',
    imagePath: './exports/9a/9a-1080h.png',
    videoPath: './exports/9a/9a-1080h-16s.mp4',
  },
  {
    title: '9B / Matter: Spring',
    description: '',
    link: './9b-matter-spring',
    imagePath: './exports/9b/9b-1080h.png',
    videoPath: './exports/9b/9b-1080h-5s.mp4',
  },
  {
    title: '9C / Matter: YO',
    description: '',
    link: './9c-matter-yo',
    imagePath: './exports/9c/9c-1080h.png',
    videoPath: './exports/9c/9c-1080h-15s.mp4',
  },
  {
    title: '10A / Guess',
    description: '',
    link: './10a-guess',
    imagePath: './exports/10a/01.png',
    videoPath: null,
    extraImages: [
      './exports/10a/02.png',
      './exports/10a/03.png',
      './exports/10a/04.png',
    ],
  },
  {
    title: '10C / Scribble',
    description: '',
    link: './10c-scribble',
    imagePath: './exports/10c/03.png',
    videoPath: null,
    extraImages: [
      './exports/10c/01.png',
      './exports/10c/02.png',
      './exports/10c/04.png',
    ],
  },
  {
    title: '11B / Glitch: Difference',
    description: '',
    link: './11b-glitch-difference',
    imagePath: './exports/11b/11b-720h.jpg',
    videoPath: './exports/11b/11b-15fps-5s.mp4',
  },
  {
    title: '11E / Glitch: FM',
    description: '',
    link: './11e-glitch-fm',
    imagePath: './exports/11e/11e-1080w.jpg',
    videoPath: '',
  },
  {
    title: '12 / k5c',
    description: '',
    link: './12-k5c',
    imagePath: './exports/12/12-1080h.png',
    videoPath: './exports/12/12-1080h-5s.mp4',
  },
  {
    title: '13A / Illumination',
    description: '',
    link: './13a-illumination',
    imagePath: './exports/13a/13a-1080h.jpg',
    videoPath: './exports/13a/13a-768h-13s.mp4',
  },
  {
    title: '13B / Illumination v2',
    description: '',
    link: './13b-illumination-v2',
    imagePath: './exports/13b/01.jpg',
    videoPath: null,
    extraImages: [
      './exports/13b/02.jpg',
      './exports/13b/03.jpg',
      './exports/13b/04.jpg',
      './exports/13b/05.jpg',
    ],
  },
];

class ExperimentView {
  element = document.createElement('a');
  mediaContainerElement = document.createElement('div');
  spinnerElement = null;
  videoWrapperElement = null;
  videoElement = null;
  imageElement = null;
  width = null;
  areExtraImagesLoaded = false;
  onMouseMoveThrottled = _.throttle(this.onMouseMove.bind(this), 250);

  constructor(data) {
    this.data = data;
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
      this.element.addEventListener(
        'mouseenter',
        this.onMouseEnter.bind(this),
        false
      );
      this.element.addEventListener(
        'mouseleave',
        this.onMouseLeave.bind(this),
        false
      );
    }

    if (this.data.extraImages && this.data.extraImages.length > 0) {
      this.element.addEventListener(
        'mousemove',
        this.onMouseMoveThrottled,
        false
      );
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

    this.videoElement.addEventListener(
      'canplaythrough',
      () => {
        this.videoWrapperElement.appendChild(this.videoElement);

        this.mediaContainerElement.removeChild(this.spinnerElement);
        this.spinnerElement = null;
      },
      { once: true }
    );

    this.videoElement.src = this.data.videoPath;
  }

  onMouseLeave() {
    // If loading, noop
    if (this.spinnerElement) return;

    this.videoElement.pause();
    this.videoElement.currentTime = 0;
  }

  onMouseMove(e) {
    if (this.spinnerElement) return;
    if (!this.width) return;

    if (!this.areExtraImagesLoaded) {
      this.createSpinner();
      const tasks = this.data.extraImages.map(loadImage);
      Promise.all(tasks)
        .then(() => {
          // Images are (hopefully) cached now
          this.areExtraImagesLoaded = true;
          this.mediaContainerElement.removeChild(this.spinnerElement);
          this.spinnerElement = null;
        })
        .catch((err) => console.error('Could not load extra images', err));
      return;
    }

    const x = e.offsetX;
    const imagePaths = [this.data.imagePath].concat(this.data.extraImages);
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

async function main() {
  const containerEl = document.getElementById('container');
  const experimentViews = experiments.map((data) => {
    const experiment = new ExperimentView(data);
    // Append before init call, `element.offsetWidth` is needed to init
    containerEl.appendChild(experiment.element);
    experiment.init();
    return experiment;
  });

  const onWindowResize = _.throttle(() => {
    experimentViews.forEach((view) => view.updateWidth());
  }, 100);
  window.addEventListener('resize', onWindowResize, false);
}

main().catch((err) => console.error(err));
