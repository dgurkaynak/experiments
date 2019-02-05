import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import saveImage from '../utils/canvas-save-image';
import sampleSize from 'lodash/sampleSize';
import times from 'lodash/times';
import { hex2rgb } from '../utils/color-helper';
// import * as colors from 'nice-color-palettes';
import * as dat from 'dat.gui';
import fontPath from './LemonMilk.otf';



/**
 * Constants
 */
interface Point { x: number, y: number };
const ENABLE_STATS = true;
const GUISettings = function() {
  this.reflectionLimit = 10;
  this.rayCount = 360 * 20;
  this.rayAlpha = 5;
  this.rayWeight = 1;
  // this.lightColor = sampleSize(sampleSize(colors, 1)[0], 1)[0];
  this.lightColor = '#fff';

  this.clear = function() {
    p.clear();
    p.background('#000');
  };

  this.save = function() {
    saveImage(resizer.canvas);
  };
};




/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
  clickMessage: document.createElement('div')
};
let p: p5;
const resizer = new CanvasResizer(null, {
  dimension: [1080, 1080],
  // dimension: 'fullscreen',
  dimensionScaleFactor: window.devicePixelRatio
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();

let lights: Point[];
let wallLineSegments: Point[][];
let font: p5.Font;
let isClickMessageHidden = false;



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

  gui.add(settings, 'reflectionLimit', 1, 10);
  gui.add(settings, 'rayCount', 1, 36000);
  gui.add(settings, 'rayAlpha', 1, 255);
  gui.add(settings, 'rayWeight', 1, 50);
  gui.addColor(settings, 'lightColor');
  gui.add(settings, 'clear');
  gui.add(settings, 'save');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  elements.clickMessage.textContent = 'Click to add a light';
  elements.clickMessage.style.position = 'absolute';
  elements.clickMessage.style.top = '50%';
  elements.clickMessage.style.left = '50%';
  elements.clickMessage.style.fontFamily = 'sans-serif';
  elements.clickMessage.style.fontSize = '12px';
  elements.clickMessage.style.color = '#fff';
  elements.clickMessage.style.textAlign = 'center';
  elements.clickMessage.style.zIndex = '2';
  elements.clickMessage.style.transform = 'translate3d(-50px, -15px, 0)';
  elements.container.appendChild(elements.clickMessage);
}


/**
 * p5's preload function
 */
function preload() {
  font = p.loadFont(fontPath);
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  resizer.canvas.addEventListener('click', () => mouseClicked(), false);

  lights = [];

  wallLineSegments = [
    // frame
    [{ x: 0, y: 0 }, { x: resizer.width, y: 0 }],
    [{ x: resizer.width, y: 0 }, { x: resizer.width, y: resizer.height }],
    [{ x: resizer.width, y: resizer.height }, { x: 0, y: resizer.height }],
    [{ x: 0, y: resizer.height }, { x: 0, y: 0 }]
  ];

  // p.pixelDensity(1);
  p.background('#000');

  // const textPoints = font.textToPoints('X', 340, 1950, 2160);
  // const textPoints = font.textToPoints('S', 500, 1950, 2160);
  const textPoints = font.textToPoints('W', 50, 1950, 2160);
  textPoints.forEach((point, i, arr) => {
    let nextPoint = arr[i + 1];
    if (!nextPoint) nextPoint = arr[0];
    wallLineSegments.push([ point, nextPoint ]);
    // for debug purposes, draw the letter
    // p.stroke('#fff');
    // p.strokeWeight(1);
    // p.line(point.x, point.y, nextPoint.x, nextPoint.y);
  });
}


function mouseClicked() {
  if (!isClickMessageHidden) {
    elements.container.removeChild(elements.clickMessage);
    p.background('#000');
    isClickMessageHidden = true;
  }

  addPointLight(p.mouseX, p.mouseY);
}


function addPointLight(x, y, color = settings.lightColor) {
  times(settings.rayCount, (i) => {
    const angle = i * (2 * Math.PI / settings.rayCount);
    // Ignore horizontal and vertical rays, because they're ugly
    // if (angle % (Math.PI / 2) == 0) return;
    lights.push({
      x: x + (Math.random() - 0.5) * 5,
      y: y + (Math.random() - 0.5) * 5,
      angle,
      hitCount: 0,
      color
    });
  });
}


function addLineLight(p1: Point, p2: Point, angle: Number, angleOffset = 0, color = settings.lightColor) {
  times(settings.rayCount, (i) => {
    const x = p.map(i, 0, settings.rayCount, p1.x, p2.x);
    const y = p.map(i, 0, settings.rayCount, p1.y, p2.y);
    const angle_ = p.map(i, 0, settings.rayCount, angle + angleOffset, angle - angleOffset);
    // Ignore horizontal and vertical rays, because they're ugly
    // if (angle % (Math.PI / 2) == 0) return;
    lights.push({
      x,
      y,
      angle: angle_,
      hitCount: 0,
      color
    });
  });
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  const lightIndexesToBeDeleted = [];

  lights.forEach((point, i) => {
    // Next point, far enough to cover all the viewport
    const rayEndPoint = {
      x: point.x + Math.cos(point.angle) * 100000,
      y: point.y + Math.sin(-point.angle) * 100000
    };

    // Check all the line segments for intersection
    const allIntersections = [];
    wallLineSegments.forEach((lineSegment) => {
      const intersectionPoint = getIntersection([ point, rayEndPoint ], lineSegment);
      if (!intersectionPoint) return;
      const distance = getDistance(point, intersectionPoint);
      if (distance < 1) return; // ignore already intersected ones
      allIntersections.push({ distance, lineSegment, point: intersectionPoint });
    });

    if (allIntersections.length == 0) {
      // console.log('no intersection');
      lightIndexesToBeDeleted.push(i);
      return;
    }

    // Get the closest intersection distance,
    // and finally get real intersections (it may be multiple, actually 1 or 2)
    const closestIntersectionDistance = minBy(allIntersections, i => i.distance).distance;
    const intersections = allIntersections.filter(i => i.distance == closestIntersectionDistance);

    // Draw the line
    const intersectionPoint = intersections[0].point;
    const color = hex2rgb(point.color);
    const alpha = settings.rayAlpha - point.hitCount * (settings.rayAlpha / settings.reflectionLimit);
    p.stroke(color.r, color.g, color.b, settings.rayAlpha);
    p.strokeWeight(settings.rayWeight);
    p.line(point.x, point.y, intersectionPoint.x, intersectionPoint.y);

    // Update angle
    intersections.forEach((i) => {
      let lineAngle = Math.atan2(
        -1 * (i.lineSegment[0].y - i.lineSegment[1].y),
        i.lineSegment[0].x - i.lineSegment[1].x,
      );
      lineAngle = lineAngle < 0 ? Math.PI + lineAngle : lineAngle;
      let lineNormalAngle = lineAngle - Math.PI / 2;
      lineNormalAngle = lineNormalAngle < 0 ? Math.PI + lineNormalAngle : lineNormalAngle;
      let rayAngle = Math.atan2(
        -1 * (i.point.y - point.y),
        i.point.x - point.x
      );

      point.angle = lineNormalAngle - (Math.PI - lineNormalAngle + rayAngle);
    });

    // Update point
    point.x = intersectionPoint.x;
    point.y = intersectionPoint.y;
    point.hitCount++;
  });

  lights = lights.filter((light, i) => {
    return light.hitCount < settings.reflectionLimit &&
      lightIndexesToBeDeleted.indexOf(i) == -1;
  });

  if (ENABLE_STATS) stats.end();
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
  gui.destroy();
  resizer.destroy();
  p.remove();
  p = null;

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}

function getIntersection(lineSegment1: Point[], lineSegment2: Point[]) {
  const p1 = lineSegment1[0];
  const p2 = lineSegment1[1];
  const p3 = lineSegment2[0];
  const p4 = lineSegment2[1];
  const denom = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
  const numeA = ((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x));
  const numeB = ((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x));

  if (denom == 0) {
    if (numeA == 0 && numeB == 0) {
      return; // COLINEAR
    }
    return; // PARALLEL
  }

  const uA = numeA / denom;
  const uB = numeB / denom;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    return {
      x: p1.x + (uA * (p2.x - p1.x)),
      y: p1.y + (uA * (p2.y - p1.y))
    };
  }

  return;
}


function getDistance(p1: Point, p2: Point) {
  return Math.sqrt(
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.x - p1.x, 2)
  );
}


function minBy(arr, lambda: Function) {
  const mapped = arr.map(lambda);
  const minValue = Math.min.apply(Math, mapped);
  return arr[mapped.indexOf(minValue)];
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
