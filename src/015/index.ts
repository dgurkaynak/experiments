import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import * as dat from 'dat.gui';
import times from 'lodash/times';
import forEachRight from 'lodash/forEachRight';
import CanvasResizer from '../utils/canvas-resizer';
import Particle from './particle';
import ProgressBar from './progress-bar';
import Clock from '../utils/clock';

import noseImagePath from './assets/nose.png';
import sparkleImagePath from './assets/sparkle.png';


/**
 * Constants
 */
const ENABLE_STATS = true;
const TRACK_MARGIN = 75;

const GUISettings = class {
  showFPS = false;
  trackCount = 2;
  gameVelocity = 100;
  maxWastePoint = 10000;

  // Sniff zone
  showSniffZone = false;
  noseX = 100;
  noseWidth = 100;
  noseHoleFactor = 1.0;
  sniffZoneHeight = 50;

  // Sniffing & Lungs
  sniffForce = 75;
  gravityForce = 30;
  maxLungCapacity = 100;
  sniffingCost = this.maxLungCapacity / 3; // Will exhaust in 3s
  lungRecover = this.maxLungCapacity / 6; // Will recover completely in 6s
  lungExhaustPenaltyTime = 3000;
  maxNoseShakeOffset = 5;

  // Cocaine particles
  cocainePoint = 1;
  cocaineSniffingGameVelocityGain = 0.1;
  // Cocaine view
  cocaineParticleSize = 4;
  cocaineLineHeight = 5;
  cocaineRandomOffsetStart = 5;
  cocaineRandomOffsetRandomness = 5;
  cocaineColor = [255, 255, 255];
  cocaineOpacity = 150;

  // Ketamine particles
  ketamineSniffingGameVelocityNegativeGain = 0.5;
  ketamineSpawnPropability = 0.01;
  // Kenamine view
  ketamineParticleSize = 3;
  ketamineLineHeight = 2;
  ketamineRandomOffsetStart = 2;
  ketamineRandomOffsetRandomness = 2;
  ketamineColor = [76, 132, 227];
  ketamineOpacity = 90;
  ketamineSparkleSize = 12;
  ketamineSparkleRandomness = 0.0025;

  restart = () => {
    configure();
    generateRoadIfNecessary(p.width / 2);
    p.loop();
  };
};



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
  dimensionScaleFactor: 1
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI({ width: 300 });
const clock = new Clock();


let noseImage: p5.Image;
let sparkleImage: p5.Image;
let particleTracks: Particle[][] = [];
let leftHoleCenterX: number;
let rightHoleCenterX: number;
let holeWidth: number;
let leftHoleX: number;
let rightHoleX: number;
let isSnorting = false;
let roadEndDistance = 0;
let distance = 0;
let currentTrack = 0;
let lungCapacity = settings.maxLungCapacity;
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

  // Show or hide stats initially
  elements.stats.style.display = settings.showFPS ? 'block' : 'none';

  // Settings
  gui.add(settings, 'showFPS').onChange(() => {
    elements.stats.style.display = settings.showFPS ? 'block' : 'none';
  });
  gui.add(settings, 'trackCount', 1, 10).step(1).onChange(() => settings.restart());
  gui.add(settings, 'gameVelocity', 10, 1000).step(1).listen();
  gui.add(settings, 'maxWastePoint', 100, 10000).step(1);
  gui.domElement.style.width = '100px;'
  gui.close();

  const noseSettings = gui.addFolder('Nose');
  noseSettings.add(settings, 'showSniffZone');
  noseSettings.add(settings, 'noseX', 0, 200).step(1).onChange(configureNoseHoles);
  noseSettings.add(settings, 'noseWidth', 10, 200).step(1).listen().onChange(configureNoseHoles);
  noseSettings.add(settings, 'noseHoleFactor', 1, 2).step(0.01).onChange(configureNoseHoles);
  noseSettings.add(settings, 'sniffZoneHeight', 5, 100).step(1);
  noseSettings.add(settings, 'maxNoseShakeOffset', 1, 40).step(1);

  const sniffLungsSettings = gui.addFolder('Sniffing & Lungs');
  sniffLungsSettings.add(settings, 'sniffForce', 1, 200).step(1);
  sniffLungsSettings.add(settings, 'gravityForce', 10, 200).step(1);
  sniffLungsSettings.add(settings, 'maxLungCapacity', 50, 500).step(1);
  sniffLungsSettings.add(settings, 'sniffingCost', 1, 50).step(1);
  sniffLungsSettings.add(settings, 'lungRecover', 1, 50).step(1);
  sniffLungsSettings.add(settings, 'lungExhaustPenaltyTime', 100, 5000).step(1);

  const cocaineSettings = gui.addFolder('Cocaine Particles');
  cocaineSettings.add(settings, 'cocainePoint', 1, 50).step(1);
  cocaineSettings.add(settings, 'cocaineSniffingGameVelocityGain', 0.001, 1).step(0.001);
  const cocaineViewSettings = cocaineSettings.addFolder('Cocaine View');
  cocaineViewSettings.add(settings, 'cocaineParticleSize', 1, 20).step(1);
  cocaineViewSettings.add(settings, 'cocaineLineHeight', 1, 20).step(1).onChange(() => settings.restart());
  cocaineViewSettings.add(settings, 'cocaineRandomOffsetStart', 1, 20).step(1).onChange(() => settings.restart());
  cocaineViewSettings.add(settings, 'cocaineRandomOffsetRandomness', 1, 20).step(1).onChange(() => settings.restart());
  cocaineViewSettings.addColor(settings, 'cocaineColor');
  cocaineViewSettings.add(settings, 'cocaineOpacity', 1, 255).step(1);

  const ketamineSettings = gui.addFolder('Ketamine Particles');
  ketamineSettings.add(settings, 'ketamineSpawnPropability', 0, 0.5).step(0.001);
  ketamineSettings.add(settings, 'ketamineSniffingGameVelocityNegativeGain', 0.001, 2).step(0.001);
  const ketamineViewSettings = ketamineSettings.addFolder('Ketamine View');
  ketamineViewSettings.add(settings, 'ketamineParticleSize', 1, 20).step(1);
  ketamineViewSettings.add(settings, 'ketamineLineHeight', 1, 20).step(1);
  ketamineViewSettings.add(settings, 'ketamineRandomOffsetStart', 1, 20).step(1);
  ketamineViewSettings.add(settings, 'ketamineRandomOffsetRandomness', 1, 20).step(1);
  ketamineViewSettings.addColor(settings, 'ketamineColor');
  ketamineViewSettings.add(settings, 'ketamineOpacity', 1, 255).step(1);
  // ketamineViewSettings.add(settings, 'ketamineSparkleSize', 5, 25).step(1);
  // ketamineViewSettings.add(settings, 'ketamineSparkleRandomness', 0.00001, 0.00100).step(0.00001);

  gui.add(settings, 'restart');

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


function configure() {
  particleTracks = [];
  isSnorting = false;
  roadEndDistance = 0;
  distance = 0;
  currentTrack = 0;
  lungCapacity = settings.maxLungCapacity;
  lungExhaustedAt = null;
  wastePoint = 0;
  cocainPoint = 0;
  settings.gameVelocity = 100;

  configureNoseHoles();
}


function configureNoseHoles() {
  leftHoleCenterX = settings.noseX + settings.noseWidth * 0.3;
  rightHoleCenterX = settings.noseX + settings.noseWidth * 0.7;
  holeWidth = settings.noseWidth * 0.25 * settings.noseHoleFactor;
  leftHoleX = leftHoleCenterX - (holeWidth / 2);
  rightHoleX = rightHoleCenterX - (holeWidth / 2);
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  // p.frameRate(15);
  p.pixelDensity(1);
  p.background('#000000');

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  configure();
  generateRoadIfNecessary(p.width / 2);

  lungCapacityProgressBar = new ProgressBar(60, p.height - 32, 190, 15);
  wastePointProgressBar = new ProgressBar(p.width - 200, p.height - 32, 190, 15);

  // p.noLoop();
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  p.background('#000000');
  const deltaTime = clock.getDelta();

  // Update distance
  distance += settings.gameVelocity * deltaTime;

  // Info texts
  p.noStroke();
  p.fill(255, 255, 255, 120);
  const infoText = `Total Score: ${Math.round(cocainPoint)} / Total Distance: ${Math.round(distance)} / Waste: ${wastePoint}`;
  p.text(infoText, 15, p.height - 50);

  // Lung stuff
  if (lungExhaustedAt && Date.now() - lungExhaustedAt <= settings.lungExhaustPenaltyTime) {
    lungCapacityProgressBar.fillColor = [255, 0, 0, 255];
    lungCapacityProgressBar.borderColor = [255, 0, 0, 255];
    isSnorting = false;
  }

  if (isSnorting) {
    lungCapacity -= settings.sniffingCost * deltaTime;
    lungCapacity = Math.max(lungCapacity, 0);

    if (lungCapacity == 0) {
      isSnorting = false;
      lungExhaustedAt = Date.now();
      lungCapacityProgressBar.fillColor = [255, 0, 0, 255];
      lungCapacityProgressBar.borderColor = [255, 0, 0, 255];
    }
  } else {
    lungCapacity += settings.lungRecover * deltaTime;
    lungCapacity = Math.min(lungCapacity, settings.maxLungCapacity);

    if (lungExhaustedAt && Date.now() - lungExhaustedAt > settings.lungExhaustPenaltyTime) {
      lungExhaustedAt = null;
      lungCapacityProgressBar.fillColor = [255, 255, 255, 255];
      lungCapacityProgressBar.borderColor = [255, 255, 255, 255];
    }
  }
  p.noStroke();
  p.fill(255, 255, 255, 120);
  p.text(`Lungs`, 15, p.height - 20);
  lungCapacityProgressBar.progress = lungCapacity / 100;
  lungCapacityProgressBar.draw(p);

  // draw waste point
  p.textAlign(p.LEFT);
  p.noStroke();
  p.fill(255, 255, 255, 120);
  p.text(`Waste`, p.width - 250, p.height - 20);
  wastePointProgressBar.progress = wastePoint / settings.maxWastePoint;
  if (wastePointProgressBar.progress > 0.75) {
    wastePointProgressBar.fillColor = [255, 127, 52, 255];
  } else {
    wastePointProgressBar.fillColor = [255, 255, 255, 255];
    wastePointProgressBar.borderColor = [255, 255, 255, 255];
  }
  if (wastePoint >= settings.maxWastePoint) {
    console.log('======== GAME ENDED ===========');
    wastePointProgressBar.fillColor = [255, 0, 0, 255];
    wastePointProgressBar.borderColor = [255, 0, 0, 255];
    p.noLoop();
  }
  wastePointProgressBar.draw(p);

  // Update tracks
  particleTracks.forEach((tracks, trackIndex) => {
    const y = getTrackY(trackIndex);
    const sniffSuccessY = y - (settings.sniffZoneHeight / 2);
    const particleIndexesToBeDeleted: number[] = [];

    // draw sniff success y
    // p.stroke('#f00');
    // p.line(0, sniffSuccessY, p.width, sniffSuccessY);
    // p.noStroke();

    // draw nose and sniff zone
    if (currentTrack == trackIndex) {
      let imageX = settings.noseX;

      const imageSniffZoneFactor = settings.noseWidth / 80;
      const imageHeight = 1775 / 1191 * settings.noseWidth;
      let imageY = sniffSuccessY - imageHeight + (imageHeight * 0.075);

      if (!isSnorting) {
        imageY -= 25 + (25 * (imageSniffZoneFactor - 1));
      }

      // nose shake animation
      if (isSnorting) {
        imageX += (Math.random() - 0.5) * settings.maxNoseShakeOffset;
        imageY += (Math.random() - 0.5) * settings.maxNoseShakeOffset;
      }

      p.image(noseImage, imageX, imageY, settings.noseWidth, imageHeight);

      // draw sniff zone
      if (settings.showSniffZone) {
        p.fill(255, 0, 0, 50);
        p.rect(leftHoleCenterX - (holeWidth / 2), y - (settings.sniffZoneHeight / 2), holeWidth, settings.sniffZoneHeight);
        p.rect(rightHoleCenterX - (holeWidth / 2), y - (settings.sniffZoneHeight / 2), holeWidth, settings.sniffZoneHeight);
      }
    }

    // For each particle
    tracks.forEach((particle, i) => {
      particle.velocity.x = -settings.gameVelocity * deltaTime;
      const force = { x: 0, y: 0 };

      // Update particle if in the sniff zone
      if (isSnorting && isParticleInSniffZone(particle, trackIndex, y)) {
        particle.dirty = true;
        force.y = -settings.sniffForce * deltaTime;
      }

      if (particle.dirty && force.y == 0) {
        force.y = settings.gravityForce * deltaTime;
      }

      particle.update(force);

      // snort success
      if (particle.position.y <= sniffSuccessY) {
        // console.log('Afiyets');
        particleIndexesToBeDeleted.push(i);

        if (particle.type == 'cocaine') {
          settings.gameVelocity += settings.cocaineSniffingGameVelocityGain;
          // settings.gameVelocity = Math.min(settings.gameVelocity, settings.maxGameVelocity);
          cocainPoint += settings.cocainePoint;

          settings.noseWidth += 0.005;
          configureNoseHoles();
        } else if (particle.type == 'ketamine') {
          settings.gameVelocity -= settings.ketamineSniffingGameVelocityNegativeGain;
          settings.gameVelocity = Math.max(settings.gameVelocity, 1);
        }
        return;
      } else if (particle.position.y >= p.height) {
        if (particle.type == 'cocaine') wastePoint += settings.cocainePoint;
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // particle should be removed?
      if (particle.position.x < 0) {
        if (particle.type == 'cocaine') wastePoint += settings.cocainePoint;
        particleIndexesToBeDeleted.push(i);
        return;
      }

      // draw particle
      if (particle.type == 'cocaine') {
        p.noStroke();
        p.fill(...settings.cocaineColor, settings.cocaineOpacity);
        p.ellipse(particle.position.x, particle.position.y, settings.cocaineParticleSize, settings.cocaineParticleSize);
      } else if (particle.type == 'ketamine') {
        p.noStroke();
        p.fill(...settings.ketamineColor, settings.ketamineOpacity);
        p.ellipse(particle.position.x, particle.position.y, settings.ketamineParticleSize, settings.ketamineParticleSize);

        if (Math.random() < settings.ketamineSparkleRandomness) {
          p.push();
          p.tint(255, Math.round(100 + (Math.random() * 50))); // random opacity
          const size = settings.ketamineSparkleSize + (Math.random() * 64);
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

  if (
    particle.position.x >= leftHoleX &&
    particle.position.x <= leftHoleX + holeWidth &&
    particle.position.y >= y - settings.sniffZoneHeight / 2 &&
    particle.position.y <= y + settings.sniffZoneHeight / 2
  ) {
    return true;
  }

  if (
    particle.position.x >= rightHoleX &&
    particle.position.x <= rightHoleX + holeWidth &&
    particle.position.y >= y - settings.sniffZoneHeight / 2 &&
    particle.position.y <= y + settings.sniffZoneHeight / 2
  ) {
    return true;
  }

  return false;
}


// setInterval(() => {
//   console.log(`distance: ${distance}, game velocity: ${(settings.gameVelocity).toFixed(2)}, particleCounts: ${particleTracks.map(x => x.length)}`);
// }, 1000);


function onKeyDown(e: KeyboardEvent) {
  switch (e.keyCode) {
    case 38: // up
      currentTrack = Math.max(currentTrack - 1, 0);
      break;
    case 40: // down
      currentTrack = Math.min(currentTrack + 1, settings.trackCount - 1);
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
  const totalHeight = settings.trackCount * settings.cocaineLineHeight + (settings.trackCount - 1) * TRACK_MARGIN;
  const startY = (p.height - totalHeight) / 2;
  const offsetY = (trackIndex * settings.cocaineLineHeight) + (trackIndex == 0 ? 0 : trackIndex * TRACK_MARGIN);
  return startY + offsetY;
}


function generateRoadIfNecessary(offset = 0) {
  if ((roadEndDistance - distance) > p.width) return;

  let maxStartX = 0;

  times(settings.trackCount, (trackIndex) => {
    if (!particleTracks[trackIndex]) particleTracks[trackIndex] = [];
    const startY = getTrackY(trackIndex);
    let startX = offset + roadEndDistance;

    while (startX <= (roadEndDistance + p.width)) {
      const blankLength = 50 + Math.random() * 650;
      let length: number;

      let particles: Particle[];

      if (Math.random() < settings.ketamineSpawnPropability) {
        length = 50 + Math.random() * 50;
        particles = generateKetamineLineParticles(length, (particle) => {
          particle.position.x += blankLength + startX - distance;
          particle.position.y += startY;
        });
      } else {
        length = 50 + Math.random() * 250;
        particles = generateCocaineLineParticles(length, (particle) => {
          particle.position.x += blankLength + startX - distance;
          particle.position.y += startY;
        });
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
      let y = startY + Math.round((Math.random() - 0.5) * settings.cocaineLineHeight);

      if (Math.random() <= 0.1) {
        const offset = (Math.random() < 0.5 ? 1 : -1) * (settings.cocaineRandomOffsetStart + (Math.random() * settings.cocaineRandomOffsetRandomness));
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
      let y = startY + Math.round((Math.random() - 0.5) * settings.ketamineLineHeight);

      if (Math.random() <= 0.1) {
        const offset = (Math.random() < 0.5 ? 1 : -1) * (settings.ketamineRandomOffsetStart + (Math.random() * settings.ketamineRandomOffsetRandomness));
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
