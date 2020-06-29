// Global deps
// - p5.js
// - stats.js
// - dat.gui
// - tween.js
// - lodash (times)

import { CanvasResizer } from '../lib/canvas-resizer.js';
import { hex2rgb } from '../lib/color-helper.js';

/**
 * Constants
 */
const ENABLE_STATS = true;

const GUISettings = function () {
  this.reflectionLimit = 10;
  this.rayCount = 360 * 10;
  this.rayAlpha = 5;
  this.rayWeight = 1;
  this.lightColor1 = '#f00';
  this.lightColor2 = '#00f';
};

/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
let p;
const resizer = new CanvasResizer(null, {
  dimension: [1024, 1024],
  dimensionScaleFactor: 1,
});
const stats = new Stats();
const settings = new GUISettings();
const gui = new dat.GUI();
let frameCount = 0;

let rays;
let lineSegments;

/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  new p5((p_) => {
    p = p_;
    p.setup = setup;
    p.draw = draw;
  }, elements.container);

  gui.add(settings, 'reflectionLimit', 1, 10);
  gui.add(settings, 'rayCount', 1, 7200);
  gui.add(settings, 'rayAlpha', 1, 255);
  gui.add(settings, 'rayWeight', 1, 50);
  gui.addColor(settings, 'lightColor1');
  gui.addColor(settings, 'lightColor2');
  gui.close();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }
}

/**
 * p5's setup function
 */
function setup() {
  const renderer = p.createCanvas(resizer.width, resizer.height);
  p.pixelDensity(1);

  resizer.canvas = renderer.canvas;
  resizer.resize = onWindowResize;
  resizer.init();

  rays = [];

  const triangleWeight = resizer.height / 2.5;
  const centerX = resizer.width / 2;
  const centerY = resizer.height / 2 + triangleWeight / 5;

  lineSegments = [
    // frame
    [
      { x: 0, y: 0 },
      { x: resizer.width, y: 0 },
    ],
    [
      { x: resizer.width, y: 0 },
      { x: resizer.width, y: resizer.height },
    ],
    [
      { x: resizer.width, y: resizer.height },
      { x: 0, y: resizer.height },
    ],
    [
      { x: 0, y: resizer.height },
      { x: 0, y: 0 },
    ],
    // triangle
    [
      { x: centerX, y: centerY - triangleWeight },
      {
        x: centerX + (triangleWeight * Math.sqrt(3)) / 2,
        y: centerY + triangleWeight / 2,
      },
    ],
    [
      {
        x: centerX + (triangleWeight * Math.sqrt(3)) / 2,
        y: centerY + triangleWeight / 2,
      },
      {
        x: centerX - (triangleWeight * Math.sqrt(3)) / 2,
        y: centerY + triangleWeight / 2,
      },
    ],
    [
      {
        x: centerX - (triangleWeight * Math.sqrt(3)) / 2,
        y: centerY + triangleWeight / 2,
      },
      { x: centerX, y: centerY - triangleWeight },
    ],
  ];

  p.background('#000');
}

function setupLightAnimation() {
  const onUpdate = ({ blueX, blueY, redX, redY }) => {
    rays = [];
    addLight(redX, redY, settings.lightColor1);
    addLight(blueX, blueY, settings.lightColor2);
  };
  const duration = 3000;

  const coordinates = {
    blueX: 5,
    blueY: 5,
    redX: resizer.width - 5,
    redY: resizer.height - 5,
  };

  const tween1 = new TWEEN.Tween(coordinates);
  tween1.to(
    { blueX: resizer.width - 5, blueY: 5, redX: 5, redY: resizer.height - 5 },
    duration
  );
  tween1.easing(TWEEN.Easing.Quintic.InOut);
  tween1.onUpdate(onUpdate);

  const tween2 = new TWEEN.Tween(coordinates);
  tween2.to(
    { blueX: resizer.width - 5, blueY: resizer.height - 5, redX: 5, redY: 5 },
    duration
  );
  tween2.easing(TWEEN.Easing.Quintic.InOut);
  tween2.onUpdate(onUpdate);

  const tween3 = new TWEEN.Tween(coordinates);
  tween3.to(
    { blueX: 5, blueY: resizer.height - 5, redX: resizer.width - 5, redY: 5 },
    duration
  );
  tween3.easing(TWEEN.Easing.Quintic.InOut);
  tween3.onUpdate(onUpdate);

  const tween4 = new TWEEN.Tween(coordinates);
  tween4.to(
    { blueX: 5, blueY: 5, redX: resizer.width - 5, redY: resizer.height - 5 },
    duration
  );
  tween4.easing(TWEEN.Easing.Quintic.InOut);
  tween4.onUpdate(onUpdate);

  tween1.chain(tween2);
  tween2.chain(tween3);
  tween3.chain(tween4);
  tween4.chain(tween1);

  tween1.start();
}

function addLight(x, y, color, rayCount = settings.rayCount) {
  _.times(rayCount, (i) => {
    const angle = i * ((2 * Math.PI) / rayCount);
    // Ignore horizontal and vertical rays, because they're ugly
    // if (angle % (Math.PI / 2) == 0) return;
    rays.push({
      angle,
      color,
      x: x + (Math.random() - 0.5) * 5,
      y: y + (Math.random() - 0.5) * 5,
      hitCount: 0,
    });
  });
}

function castRays() {
  const lightIndexesToBeDeleted = [];

  rays.forEach((point, i) => {
    // Next point, far enough to cover all the viewport
    const rayEndPoint = {
      x: point.x + Math.cos(point.angle) * 100000,
      y: point.y + Math.sin(-point.angle) * 100000,
    };

    // Check all the line segments for intersection
    const allIntersections = [];
    lineSegments.forEach((lineSegment) => {
      const intersectionPoint = getIntersection(
        [point, rayEndPoint],
        lineSegment
      );
      if (!intersectionPoint) return;
      const distance = getDistance(point, intersectionPoint);
      if (distance < 1) return; // ignore already intersected ones
      allIntersections.push({
        distance,
        lineSegment,
        point: intersectionPoint,
      });
    });

    if (allIntersections.length == 0) {
      // console.log('no intersection');
      lightIndexesToBeDeleted.push(i);
      return;
    }

    // Get the closest intersection distance,
    // and finally get real intersections (it may be multiple, actually 1 or 2)
    const closestIntersectionDistance = minBy(
      allIntersections,
      (i) => i.distance
    ).distance;
    const intersections = allIntersections.filter(
      (i) => i.distance == closestIntersectionDistance
    );

    // Draw the line
    const intersectionPoint = intersections[0].point;
    const color = hex2rgb(point.color);
    const alpha =
      settings.rayAlpha -
      point.hitCount * (settings.rayAlpha / settings.reflectionLimit);
    p.stroke(color.r, color.g, color.b, settings.rayAlpha);
    p.strokeWeight(settings.rayWeight);
    p.line(point.x, point.y, intersectionPoint.x, intersectionPoint.y);

    // Update angle
    intersections.forEach((i) => {
      let lineAngle = Math.atan2(
        -1 * (i.lineSegment[0].y - i.lineSegment[1].y),
        i.lineSegment[0].x - i.lineSegment[1].x
      );
      lineAngle = lineAngle < 0 ? Math.PI + lineAngle : lineAngle;
      let lineNormalAngle = lineAngle - Math.PI / 2;
      lineNormalAngle =
        lineNormalAngle < 0 ? Math.PI + lineNormalAngle : lineNormalAngle;
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

  rays = rays.filter((light, i) => {
    return (
      light.hitCount < settings.reflectionLimit &&
      lightIndexesToBeDeleted.indexOf(i) == -1
    );
  });
}

/**
 * Animate stuff...
 */
function draw() {
  if (ENABLE_STATS) stats.begin();

  // Two light source rotating
  p.background('#000');
  if (frameCount == 0) setupLightAnimation();
  TWEEN.update((frameCount * 1000) / 30);
  while (rays.length > 0) {
    castRays();
  }

  frameCount++;
  if (ENABLE_STATS) stats.end();
}

/**
 * On window resized
 */
function onWindowResize(width, height) {
  p.resizeCanvas(width, height);
}

/**
 * Clean your shit
 */
function dispose() {
  // gui.destroy();
  resizer.destroy();
  p.remove();
  p = null;

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  });
}

function getIntersection(lineSegment1, lineSegment2) {
  const p1 = lineSegment1[0];
  const p2 = lineSegment1[1];
  const p3 = lineSegment2[0];
  const p4 = lineSegment2[1];
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  const numeA = (p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x);
  const numeB = (p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x);

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
      x: p1.x + uA * (p2.x - p1.x),
      y: p1.y + uA * (p2.y - p1.y),
    };
  }

  return;
}

function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
}

function minBy(arr, lambda) {
  const mapped = arr.map(lambda);
  const minValue = Math.min.apply(Math, mapped);
  return arr[mapped.indexOf(minValue)];
}

main().catch((err) => console.error(err));
