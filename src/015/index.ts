import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import times from 'lodash/times';
import forEachRight from 'lodash/forEachRight';
import CanvasResizer from '../utils/canvas-resizer';
import Particle from './particle';
import ProgressBar from './progress-bar';

import noseImagePath from './nose.png';
import sparkleImagePath from './sparkle.png';


/**
 * Constants
 */
const ENABLE_STATS = true;
const TRACK_COUNT = 2;
const SNIFF_ZONE = [
  { x: 100, width: 20 },
  { x: 160, width: 20 }
];
const SNIFF_ZONE_HEIGHT = 50;
const SNIFF_FORCE = 75 / 60;
const SNIFF_GRAVITY_FORCE = 30 / 60;
const MAX_LUNG_CAPACITY = 100;
const SNIFFING_LUNG_COST = 100 / 3 / 60;
const SNIFFING_LUNG_RECOVER = SNIFFING_LUNG_COST / 2;
const SNIFFING_LUNG_EXHAUST_TIME = 3000;

const MAX_GAME_VELOCITY = 400 / 60;
const MIN_GAME_VELOCITY = 100 / 60;

const MAX_WASTE_POINT = 10000;

const TRACK_MARGIN = 75;

const COCAINE_LINE_HEIGHT = 5;
const COCAINE_COLOR = [255, 255, 255, 150];
const COCAINE_PARTICLE_SIZE = 4;
const COCAINE_RANDOM_OFFSET_START = 5;
const COCAINE_RANDOM_OFFSET_RANDOMNESS = 5;
const COCAINE_PARTICLE_SNORTING_VELOCITY = 100 / 60 / 4000;
const COCAINE_PARTICLE_POINT = 1;

const KETAMINE_LINE_HEIGHT = 5;
const KETAMINE_COLOR = [209, 226, 255, 90];
const KETAMINE_PARTICLE_SIZE = 3;
const KETAMINE_RANDOM_OFFSET_START = 2;
const KETAMINE_RANDOM_OFFSET_RANDOMNESS = 2;
const KETAMINE_SPARKLE_RANDOMNESS = 0.0001;
const KETAMINE_SPARKLE_SIZE = 32;
const KETAMINE_PARTICLE_SNORTING_VELOCITY = 100 / 60 / 200;

const SNIFFING_NOSE_ANIMATION_OFFSET = 20;
const SNIFFING_NOSE_ANIMATION_VELOCITY = 5;
const SNIFFING_NOSE_ANIMATION_SHAKE = 5;




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
let sparkleImage: p5.Image;
const particleTracks: Particle[][] = [];
let isSnorting = false;
let noseOffset = 0;
let roadEndDistance = 0;
let gameVelocity = 100 / 60;
let distance = 0;
let currentTrack = 0;
let lungCapacity = MAX_LUNG_CAPACITY;
let lungExhaustedAt: number;
let lungCapacityProgressBar: ProgressBar;
let wastePoint = 0;
let wastePointProgressBar: ProgressBar;
let cocainPoint = 0;



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
  sparkleImage = p.loadImage(sparkleImagePath);
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

  generateRoadIfNecessary(p.width / 2);
  // generateRoadIfNecessary(0);

  lungCapacityProgressBar = new ProgressBar(60, p.height - 32, 190, 15);
  wastePointProgressBar = new ProgressBar(p.width - 200, p.height - 32, 190, 15);
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background('#000000');

  // Update distance
  distance += gameVelocity;
  p.noStroke();
  p.fill(255, 255, 255, 120);
  p.textAlign(p.RIGHT);
  p.text(`Skor: ${Math.round(cocainPoint)}`, p.width - 10, 20);

  // Lung stuff
  if (lungExhaustedAt && Date.now() - lungExhaustedAt <= SNIFFING_LUNG_EXHAUST_TIME) {
    lungCapacityProgressBar.fillColor = [255, 0, 0, 255];
    lungCapacityProgressBar.borderColor = [255, 0, 0, 255];
    isSnorting = false;
  }

  // TODO: Eyvahlar olsun
  if (isSnorting) {
    lungCapacity -= SNIFFING_LUNG_COST;
    lungCapacity = Math.max(lungCapacity, 0);

    if (lungCapacity == 0) {
      isSnorting = false;
      lungExhaustedAt = Date.now();
      lungCapacityProgressBar.fillColor = [255, 0, 0, 255];
      lungCapacityProgressBar.borderColor = [255, 0, 0, 255];
    }
  } else {
    lungCapacity += SNIFFING_LUNG_RECOVER;
    lungCapacity = Math.min(lungCapacity, MAX_LUNG_CAPACITY);

    if (lungExhaustedAt && Date.now() - lungExhaustedAt > SNIFFING_LUNG_EXHAUST_TIME) {
      lungExhaustedAt = null;
      lungCapacityProgressBar.fillColor = [255, 255, 255, 255];
      lungCapacityProgressBar.borderColor = [255, 255, 255, 255];
    }
  }
  p.textAlign(p.LEFT);
  p.noStroke();
  p.fill(255, 255, 255, 120);
  p.text(`Ciğer`, 20, p.height - 20);
  lungCapacityProgressBar.progress = lungCapacity / 100;
  lungCapacityProgressBar.draw(p);

  // draw waste point
  p.textAlign(p.LEFT);
  p.noStroke();
  p.fill(255, 255, 255, 120);
  p.text(`Ziyan`, p.width - 250, p.height - 20);
  wastePointProgressBar.progress = wastePoint / MAX_WASTE_POINT;
  if (wastePointProgressBar.progress > 0.75) wastePointProgressBar.fillColor = [255, 127, 52, 255];
  if (wastePoint >= MAX_WASTE_POINT) {
    console.log('======== GAME ENDED ===========');
    wastePointProgressBar.fillColor = [255, 0, 0, 255];
    wastePointProgressBar.borderColor = [255, 0, 0, 255];
    p.noLoop();
  }
  wastePointProgressBar.draw(p);

  // Update tracks
  particleTracks.forEach((tracks, trackIndex) => {
    const y = getTrackY(trackIndex);
    const sniffSuccessY = y - (SNIFF_ZONE_HEIGHT / 2);
    const particleIndexesToBeDeleted: number[] = [];

    // draw nose and sniff zone
    if (currentTrack == trackIndex) {
      // nose vertical animation
      noseOffset = isSnorting ?
        Math.min(noseOffset + SNIFFING_NOSE_ANIMATION_VELOCITY, SNIFFING_NOSE_ANIMATION_OFFSET) :
        Math.max(noseOffset - SNIFFING_NOSE_ANIMATION_VELOCITY, 0);

      let imageX = SNIFF_ZONE[0].x - 15;
      let imageY = y - 195 + noseOffset;

      // nose shake animation
      if (isSnorting) {
        imageX += (Math.random() - 0.5) * SNIFFING_NOSE_ANIMATION_SHAKE;
        imageY += (Math.random() - 0.5) * SNIFFING_NOSE_ANIMATION_SHAKE;
      }

      const imageWidth = 110;
      const imageHeight = 1775 / 1191 * imageWidth;
      p.image(noseImage, imageX, imageY, imageWidth, imageHeight);

      // draw sniff zone
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
        force.y = SNIFF_GRAVITY_FORCE;
      }

      particle.update(force);

      // snort success
      if (particle.position.y <= sniffSuccessY) {
        // console.log('Afiyets');
        particleIndexesToBeDeleted.push(i);

        if (particle.type == 'cocaine') {
          gameVelocity += COCAINE_PARTICLE_SNORTING_VELOCITY;
          gameVelocity = Math.min(gameVelocity, MAX_GAME_VELOCITY);
          cocainPoint += COCAINE_PARTICLE_POINT;
        } else if (particle.type == 'ketamine') {
          gameVelocity -= KETAMINE_PARTICLE_SNORTING_VELOCITY;
          gameVelocity = Math.max(gameVelocity, MIN_GAME_VELOCITY);
        }
        return;
      } else if (particle.position.y >= p.height) {
        if (particle.type == 'cocaine') wastePoint += COCAINE_PARTICLE_POINT;
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // particle should be removed?
      if (particle.position.x < 0) {
        if (particle.type == 'cocaine') wastePoint += COCAINE_PARTICLE_POINT;
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // draw particle
      if (particle.type == 'cocaine') {
        p.noStroke();
        p.fill(...COCAINE_COLOR);
        p.ellipse(particle.position.x, particle.position.y, COCAINE_PARTICLE_SIZE, COCAINE_PARTICLE_SIZE);
      } else if (particle.type == 'ketamine') {
        p.noStroke();
        p.fill(...KETAMINE_COLOR);
        p.ellipse(particle.position.x, particle.position.y, KETAMINE_PARTICLE_SIZE, KETAMINE_PARTICLE_SIZE);

        if (Math.random() < KETAMINE_SPARKLE_RANDOMNESS) {
          p.push();
          p.tint(255, Math.round(100 + (Math.random() * 50))); // random opacity
          const size = KETAMINE_SPARKLE_SIZE + (Math.random() * 64);
          p.image(
            sparkleImage,
            particle.position.x - size / 2,
            particle.position.y - size / 2,
            size,
            size
          );
          p.pop();
        }
      }
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
//   console.log(`distance: ${distance}, game velocity: ${(gameVelocity * 60).toFixed(2)}, particleCounts: ${particleTracks.map(x => x.length)}`);
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
  const totalHeight = TRACK_COUNT * COCAINE_LINE_HEIGHT + (TRACK_COUNT - 1) * TRACK_MARGIN;
  const startY = (p.height - totalHeight) / 2;
  const offsetY = (trackIndex * COCAINE_LINE_HEIGHT) + (trackIndex == 0 ? 0 : trackIndex * TRACK_MARGIN);
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

      let particles: Particle[];

      // TODO: Refactor
      if (gameVelocity <= 350 / 60) {
        particles = generateCocaineLineParticles(length, (particle) => {
          particle.position.x += blankLength + startX - distance;
          particle.position.y += startY;
        });
      } else {
        if (Math.random() < 0.99) {
          particles = generateCocaineLineParticles(length, (particle) => {
            particle.position.x += blankLength + startX - distance;
            particle.position.y += startY;
          });
        } else {
          particles = generateKetamineLineParticles(length, (particle) => {
            particle.position.x += blankLength + startX - distance;
            particle.position.y += startY;
          });
        }
      }

      particleTracks[trackIndex].push(...particles);
      startX += blankLength + length;
      maxStartX = Math.max(maxStartX, startX);
    }
  });

  roadEndDistance = maxStartX;
  console.log('generating road', roadEndDistance);
}


function generateCocaineLineParticles(length: number, iterator = (particle: Particle) => { }) {
  const GENERATION_WINDOW_WIDTH = 20;
  const WINDOW_PARTICLE_COUNT = 20;

  const windowCount = Math.round(length / GENERATION_WINDOW_WIDTH);
  const particles: Particle[] = [];

  for (let i = 0; i <= windowCount; i++) {
    const startX = i * GENERATION_WINDOW_WIDTH;
    const startY = 0;

    for (let j = 0; j < WINDOW_PARTICLE_COUNT; j++) {
      let x = startX + Math.round(Math.random() * GENERATION_WINDOW_WIDTH);
      let y = startY + Math.round((Math.random() - 0.5) * COCAINE_LINE_HEIGHT);

      if (Math.random() <= 0.1) {
        const offset = (Math.random() < 0.5 ? 1 : -1) * (COCAINE_RANDOM_OFFSET_START + (Math.random() * COCAINE_RANDOM_OFFSET_RANDOMNESS));
        x += offset;
        y += offset;
      }

      const particle = new Particle();
      particle.type = 'cocaine';
      particle.position = { x, y };
      iterator(particle);
      particles.push(particle);
    }
  }

  return particles;
}


function generateKetamineLineParticles(length: number, iterator = (particle: Particle) => { }) {
  const GENERATION_WINDOW_WIDTH = 20;
  const WINDOW_PARTICLE_COUNT = 20;

  const windowCount = Math.round(length / GENERATION_WINDOW_WIDTH);
  const particles: Particle[] = [];

  for (let i = 0; i <= windowCount; i++) {
    const startX = i * GENERATION_WINDOW_WIDTH;
    const startY = 0;

    for (let j = 0; j < WINDOW_PARTICLE_COUNT; j++) {
      let x = startX + Math.round(Math.random() * GENERATION_WINDOW_WIDTH);
      let y = startY + Math.round((Math.random() - 0.5) * KETAMINE_LINE_HEIGHT);

      if (Math.random() <= 0.1) {
        const offset = (Math.random() < 0.5 ? 1 : -1) * (KETAMINE_RANDOM_OFFSET_START + (Math.random() * KETAMINE_RANDOM_OFFSET_RANDOMNESS));
        x += offset;
        y += offset;
      }

      const particle = new Particle();
      particle.type = 'ketamine';
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
