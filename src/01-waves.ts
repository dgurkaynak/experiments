import * as THREE from 'three';
require('./utils/OrbitControls');


const BG_COLOR = 0x000000;
const SPHERE_COLOR = 0xffffff;
const SPHERE_RADIUS = 0.025;
const NUMBER_X = 50;
const NUMBER_Z = 50;
const SPHERE_DISTANCE = 1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new THREE.OrbitControls(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(BG_COLOR);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(SPHERE_RADIUS);
const material = new THREE.MeshBasicMaterial({ color: SPHERE_COLOR });
const cubes = [];

for (let i = 0; i < NUMBER_X; i++) {
  const cubesX = [];
  for (let j = 0; j < NUMBER_Z; j++) {
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = i * SPHERE_DISTANCE - (NUMBER_X / 2 * SPHERE_DISTANCE);
    cube.position.z = j * SPHERE_DISTANCE - (NUMBER_Z / 2 * SPHERE_DISTANCE);
    cubesX.push(cube);
    scene.add(cube);
  }
  cubes.push(cubesX);
}

camera.position.x = 0;
camera.position.y = 4;
camera.position.z = NUMBER_Z / 2 * SPHERE_DISTANCE;
controls.update();

let delta = 0;

function animate() {
  for (let i = 0; i < NUMBER_X; i++) {
    for (let j = 0; j < NUMBER_Z; j++) {
      const cube = cubes[i][j];
      cube.position.y = (Math.sin(i * 0.5 + delta * 0.025) + Math.sin(j * 0.5 + delta * 0.025)) * 0.5;
    }
  }
  delta++;

  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
