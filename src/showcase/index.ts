import IExperiment from './iexperiment';
import ExperimentView from './experiment-view';
import throttle from 'lodash/throttle';


const experiments: IExperiment[] = [
  {
    title: '001 / Waves',
    description: '',
    link: './001',
    imagePath: './exports/001/001-1024h.png',
    videoPath: './exports/001/001-768h-10s.mp4'
  },
  {
    title: '003 / Kubes',
    description: '',
    link: './003',
    imagePath: './exports/003/003-1024h.png',
    videoPath: './exports/003/003-768h-5s.mp4'
  },
  {
    title: '003.1 / Kubes in Perspective',
    description: '',
    link: './003.1',
    imagePath: './exports/003.1/003.1-1024h.png',
    videoPath: './exports/003.1/003.1-768h-5s.mp4'
  },
  {
    title: '004 / Kem',
    description: '',
    link: './004',
    imagePath: './exports/004/004-1024h.jpg',
    videoPath: './exports/004/004-768h-8s.mp4'
  },
  {
    title: '005.1 / Migraine v2',
    description: '',
    link: './005.1',
    imagePath: './exports/005.1/005.1-921h.jpg',
    videoPath: './exports/005.1/005.1-768h-14s.mp4'
  },
  {
    title: '006 / Wiggly Text',
    description: '',
    link: './006',
    imagePath: './exports/006/006-1024h.png',
    videoPath: './exports/006/006-1024h-5s.mp4'
  },
  {
    title: '007 / Blah Blah',
    description: '',
    link: './007',
    imagePath: './exports/007/007-1024h.png',
    videoPath: './exports/007/007-1024h-15s.mp4'
  },
  {
    title: '008 / Perlin Swing',
    description: '',
    link: './008',
    imagePath: './exports/008/008-1024h.png',
    videoPath: './exports/008/008-768h-5s.mp4'
  },
  {
    title: '008.1 / Perlin Swing Radial',
    description: '',
    link: './008.1',
    imagePath: './exports/008.1/008.1-1024h.png',
    videoPath: './exports/008.1/008.1-768h-5s.mp4'
  },
  {
    title: '008.2 / Perlin Trail',
    description: '',
    link: './008.2',
    imagePath: './exports/008.2/01.jpg',
    videoPath: null,
    extraImages: [
      './exports/008.2/02.jpg',
      './exports/008.2/03.jpg',
      './exports/008.2/04.jpg'
    ]
  },
  {
    title: '009 / Matter: Gravity',
    description: '',
    link: './009',
    imagePath: './exports/009/009-1080h.png',
    videoPath: './exports/009/009-1080h-16s.mp4'
  },
  {
    title: '009.1 / Matter: Spring',
    description: '',
    link: './009.1',
    imagePath: './exports/009.1/009.1-1080h.png',
    videoPath: './exports/009.1/009.1-1080h-5s.mp4'
  },
  {
    title: '010 / Guess',
    description: '',
    link: './010',
    imagePath: './exports/010/01.png',
    videoPath: null,
    extraImages: [
      './exports/010/02.png',
      './exports/010/03.png',
      './exports/010/04.png'
    ]
  },
  {
    title: '010.2 / Scribble',
    description: '',
    link: './010.2',
    imagePath: './exports/010.2/03.png',
    videoPath: null,
    extraImages: [
      './exports/010.2/01.png',
      './exports/010.2/02.png',
      './exports/010.2/04.png'
    ]
  },
  {
    title: '011.1 / Glitch: Difference',
    description: '',
    link: './011.1',
    imagePath: './exports/011.1/011.1-720h.jpg',
    videoPath: './exports/011.1/011.1-15fps-5s.mp4'
  },
  {
    title: '011.5 / Glitch: FM',
    description: '',
    link: './011.5',
    imagePath: './exports/011.5/011.5-1080w.jpg',
    videoPath: ''
  },
  {
    title: '012 / k5c',
    description: '',
    link: './012',
    imagePath: './exports/012/012-1080h.png',
    videoPath: './exports/012/012-1080h-5s.mp4'
  },
  {
    title: '013 / Illumination',
    description: '',
    link: './013',
    imagePath: './exports/013/013-1080h.jpg',
    videoPath: './exports/013/013-768h-13s.mp4'
  },
  {
    title: '013.2 / Illumination v2',
    description: '',
    link: './013.2',
    imagePath: './exports/013.2/01.jpg',
    videoPath: null,
    extraImages: [
      './exports/013.2/02.jpg',
      './exports/013.2/03.jpg',
      './exports/013.2/04.jpg',
      './exports/013.2/05.jpg'
    ]
  }
];

const containerEl = document.getElementById('container');
const experimentViews = experiments.map((data) => {
  const experiment = new ExperimentView(data);
  // Append before init call, `element.offsetWidth` is needed to init
  containerEl.appendChild(experiment.element);
  experiment.init();
  return experiment;
});


const onWindowResize = throttle(() => {
  experimentViews.forEach(view => view.updateWidth());
}, 100);
window.addEventListener('resize', onWindowResize, false);
