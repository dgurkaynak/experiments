import p5 from 'p5/lib/p5.min';
import Stats from 'stats.js';
import CanvasResizer from '../utils/canvas-resizer';
import times from 'lodash/times';
import { hex2rgb } from '../utils/color-helper';
import randomColor from 'randomColor';


/**
 * Constants
 */
interface Point { x: number, y: number };
const ENABLE_STATS = true;
const FRAME_COUNT_LIMIT = 25;
const LIGHT_COUNT = 50;
const LIGHT_COLORS = randomColor({
  luminosity: 'light',
  count: LIGHT_COUNT,
  hue: 'red'
});
const LIGHT_ALPHA = 75;
const LIGHT_WEIGHT = 3;



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

let lights: Point[];
let wallLineSegments: Point[][];
let frameCount = 0;



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}


/**
 * p5's setup function
 */
function setup() {
  const renderer: any = p.createCanvas(resizer.width, resizer.height);
  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  lights = times(LIGHT_COUNT, (i) => {
    const x = Math.random() * resizer.width;
    const y = Math.random() * resizer.height;
    const direction = {
      x: Math.random() - 0.5,
      y: Math.random() - 0.5
    };
    return { x, y, direction, hitCount: 0, color: LIGHT_COLORS[i] };
  });

  wallLineSegments = [
    [{ x: 0, y: 0 }, { x: resizer.width, y: 0 }],
    [{ x: resizer.width, y: 0 }, { x: resizer.width, y: resizer.height }],
    [{ x: resizer.width, y: resizer.height }, { x: 0, y: resizer.height }],
    [{ x: 0, y: resizer.height }, { x: 0, y: 0 }]
  ];

  // p.pixelDensity(1);
  p.background('#000');
}


/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  lights.forEach((point) => {
    // Next point, far enough to cover all the viewport
    const rayEndPoint = {
      x: point.x + point.direction.x * 1000000,
      y: point.y + point.direction.y * 1000000
    };
    // if (frameCount % 60 == 0) {
    //   rayEndPoint.x = point.x + (p.mouseX - point.x) * 1000000;
    //   rayEndPoint.y = point.y + (p.mouseY - point.y) * 1000000;
    // }

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
      console.log('no intersection');
      return;
    }

    // Get the closest intersection distance,
    // and finally get real intersections (it may be multiple, actually 1 or 2)
    const closestIntersectionDistance = minBy(allIntersections, i => i.distance).distance;
    const intersections = allIntersections.filter(i => i.distance == closestIntersectionDistance);

    // Draw the line
    const intersectionPoint = intersections[0].point;
    const color = hex2rgb(point.color);
    p.stroke(color.r, color.g, color.b, LIGHT_ALPHA);
    p.strokeWeight(LIGHT_WEIGHT);
    p.line(point.x, point.y, intersectionPoint.x, intersectionPoint.y);

    // Update point
    point.x = intersectionPoint.x;
    point.y = intersectionPoint.y;
    point.hitCount++;

    // Update direction
    intersections.forEach((i) => {
      const lineAngle = Math.atan2(
        i.lineSegment[0].y - i.lineSegment[1].y,
        i.lineSegment[0].x - i.lineSegment[1].x,
      );

      if (lineAngle == 0 || lineAngle == Math.PI) { // horizontal
        point.direction.y *= -1;
      }

      if (lineAngle == Math.PI / 2 || lineAngle == -Math.PI / 2) { // vertical
        point.direction.x *= -1;
      }
    });
  });

  frameCount++;
  if (frameCount == FRAME_COUNT_LIMIT) {
    console.log('Done');
    p.noLoop();
  }

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
