// http://bigblueboo.tumblr.com/post/145035932469/from-all-angles#notes

import * as THREE from 'three';


const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 1000);
camera.position.set(0, 0, 100);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const DISTANCE = 50;
const NUMBER_OF_BOXES_X = 10;
const NUMBER_OF_BOXES_Y = 10;

const boxes = [];
const geometry = new THREE.BoxBufferGeometry(25, 25, 25);
const material = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });


export async function init() {
  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    const boxAcc = [];

    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const mesh = new THREE.Mesh(geometry, material);
      const geo = new THREE.EdgesGeometry(geometry);
      const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
      const wireframe = new THREE.LineSegments(geo, mat);
      mesh.add(wireframe);
  
      mesh.position.x = DISTANCE * -4.5 + (DISTANCE * i);
      mesh.position.y = DISTANCE * -4.5 + (DISTANCE * j);
  
      mesh.rotateZ(Math.PI / 18 * j);
      mesh.rotateX(Math.PI / 18 * i);
  
      scene.add(mesh);
      boxAcc.push(mesh);
    }

    boxes.push(boxAcc);
  }
}


export async function destroy() {
  geometry.dispose();
  material.dispose();
  renderer.dispose();
}


export async function start() {}
export async function stop() {}


export function animate() {
  for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
    for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
      const box = boxes[i][j];
      box.rotateY(0.01 * (i / 9 + 1));
    }
  }

  renderer.render(scene, camera);
}

