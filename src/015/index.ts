import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import times from 'lodash/times';
import forEachRight from 'lodash/forEachRight';
import CanvasResizer from '../utils/canvas-resizer';
import Particle from './particle';

import noseImagePath from './nose.png';


/**
 * Constants
 */
const ENABLE_STATS = true;
const TRACK_COUNT = 4;
const SNIFF_ZONE = [
  { x: 100, width: 20 },
  { x: 160, width: 20 }
];
const SNIFF_ZONE_HEIGHT = 50;
const TRACK_OFFSET = 75;
const LINE_HEIGHT = 5;
const SNIFF_FORCE = 75 / 60;
const SNIFF_FALL_FORCE = 30 / 60;




/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();

let noseImage: p5.Image;
const particleTracks: Particle[][] = [];
let isSnorting = false;
let roadEndDistance = 0;
let gameVelocity = 100 / 60;
let distance = 0;
let currentTrack = 0;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.preload = preload;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  document.body.addEventListener('keydown', onKeyDown, false);
  document.body.addEventListener('keyup', onKeyUp, false);
}


function preload() {
  noseImage = p.loadImage(noseImagePath);
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  // p.pixelDensity(1);
  p.background('#000000');

  // generateRoadIfNecessary(p.width / 2);
  generateRoadIfNecessary(0);
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background('#000000');

  // Update distance
  distance += gameVelocity;

  // Update tracks
  const PARTICLE_SIZE = 4;
  particleTracks.forEach((tracks, trackIndex) => {
    const y = getTrackY(trackIndex);
    const sniffSuccessY = y - (SNIFF_ZONE_HEIGHT / 2);
    const particleIndexesToBeDeleted: number[] = [];

    // draw nose and sniff zone
    if (currentTrack == trackIndex) {
      p.push();

      const imageX = SNIFF_ZONE[0].x - 15;
      let imageY = y - 195 + (isSnorting ? 20 : 0);
      const imageWidth = 110;
      const imageHeight = 164;

      p.image(noseImage, imageX, imageY, imageWidth, imageHeight);
      p.pop();

      // SNIFF_ZONE.forEach((zone) => {
      //   p.noStroke();
      //   p.fill(255, 0, 0, 50);
      //   p.rect(zone.x, y - (SNIFF_ZONE_HEIGHT / 2), zone.width, SNIFF_ZONE_HEIGHT);
      // });
    }

    // For each particle
    tracks.forEach((particle, i) => {
      particle.velocity.x = -gameVelocity;
      const force = { x: 0, y: 0 };

      // Update particle if in the sniff zone
      if (isSnorting && isParticleInSniffZone(particle, trackIndex, y)) {
        particle.dirty = true;
        force.y = -SNIFF_FORCE;
      }

      if (particle.dirty && force.y == 0) {
        force.y = SNIFF_FALL_FORCE;
      }

      particle.update(force);

      // snort success
      if (particle.position.y <= sniffSuccessY) {
        // console.log('Afiyets');
        particleIndexesToBeDeleted.push(i);
        return;
      } else if (particle.position.y >= p.height) {
        // console.log('Ziyans');
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // particle should be removed?
      if (particle.position.x < 0) {
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // draw particle
      p.noStroke();
      p.fill(255, 255, 255, 150);
      p.ellipse(particle.position.x, particle.position.y, PARTICLE_SIZE, PARTICLE_SIZE);
    });

    // delete particles from track
    forEachRight(particleIndexesToBeDeleted, i => tracks.splice(i, 1));
  });

  // generate road if necessary
  generateRoadIfNecessary();

  if (ENABLE_STATS) stats.end();
}


function isParticleInSniffZone(particle: Particle, particleTrackIndex: number, y: number) {
  if (currentTrack != particleTrackIndex) return;

  for (let i = 0; i < SNIFF_ZONE.length; i++) {
    const zone = SNIFF_ZONE[i];
    if (
      particle.position.x >= zone.x &&
      particle.position.x <= zone.x + zone.width &&
      particle.position.y >= y - SNIFF_ZONE_HEIGHT / 2 &&
      particle.position.y <= y + SNIFF_ZONE_HEIGHT / 2
    ) {
      return true;
    }
  }

  return false;
}


// setInterval(() => {
//   console.log(`distance: ${distance}, particleCounts: ${particleTracks.map(x => x.length)}`);
// }, 1000);


function onKeyDown(e: KeyboardEvent) {
  switch (e.keyCode) {
    case 38: // up
      currentTrack = Math.max(currentTrack - 1, 0);
      break;
    case 40: // down
      currentTrack = Math.min(currentTrack + 1, TRACK_COUNT - 1);
      break;
    case 32: // space
      if (e.repeat) return;
      isSnorting = true;
      break;
  }
}


function onKeyUp(e: KeyboardEvent) {
  switch (e.keyCode) {
    case 32: // space
      if (e.repeat) return;
      isSnorting = false;
      break;
  }
}


function getTrackY(trackIndex: number) {
  const totalHeight = TRACK_COUNT * LINE_HEIGHT + (TRACK_COUNT - 1) * TRACK_OFFSET;
  const startY = (p.height - totalHeight) / 2;
  const offsetY = (trackIndex * LINE_HEIGHT) + (trackIndex == 0 ? 0 : trackIndex * TRACK_OFFSET);
  return startY + offsetY;
}


function generateRoadIfNecessary(offset = 0) {
  if ((roadEndDistance - distance) > p.width) return;

  let maxStartX = 0;

  times(TRACK_COUNT, (trackIndex) => {
    if (!particleTracks[trackIndex]) particleTracks[trackIndex] = [];
    const startY = getTrackY(trackIndex);
    let startX = offset + roadEndDistance;

    while (startX <= (roadEndDistance + p.width)) {
      const blankLength = 50 + Math.random() * 650;
      const length = 50 + Math.random() * 250;

      const particles = generateLineParticles(length, (particle) => {
        particle.position.x += blankLength + startX - distance;
        particle.position.y += startY;
      });

      particleTracks[trackIndex].push(...particles);
      startX += blankLength + length;
      maxStartX = Math.max(maxStartX, startX);
    }
  });

  roadEndDistance = maxStartX;
  console.log('generating road', roadEndDistance);
}


function generateLineParticles(length: number, iterator = (particle: Particle) => { }) {
  const GENERATION_WINDOW_WIDTH = 20;
  const WINDOW_PARTICLE_COUNT = 20;

  const windowCount = Math.round(length / GENERATION_WINDOW_WIDTH);
  const particles: Particle[] = [];

  for (let i = 0; i <= windowCount; i++) {
    const startX = i * GENERATION_WINDOW_WIDTH;
    const startY = 0;

    for (let j = 0; j < WINDOW_PARTICLE_COUNT; j++) {
      let x = startX + Math.round(Math.random() * GENERATION_WINDOW_WIDTH);
      let y = startY + Math.round((Math.random() - 0.5) * LINE_HEIGHT);

      if (Math.random() <= 0.1) {
        const offset = (Math.random() < 0.5 ? 1 : -1) * (5 + (Math.random() * 5));
        x += offset;
        y += offset;
      }

      const particle = new Particle();
      particle.position = { x, y };
      iterator(particle);
      particles.push(particle);
    }
  }

  return particles;
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  p.resizeCanvas(width, height);
}


/**
 * Clean your shit
 */
function dispose() {
  resizer.destroy();
  p.remove();
  p = null;

  document.body.removeEventListener('keydown', onKeyDown, false);
  document.body.removeEventListener('keyup', onKeyUp, false);

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
