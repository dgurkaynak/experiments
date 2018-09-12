// http://bigblueboo.tumblr.com/post/145035932469/from-all-angles#notes

import * as THREE from 'three';
import IExperiment from '../iexperiment';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const DISTANCE = 50;
const NUMBER_OF_BOXES_X = 10;
const NUMBER_OF_BOXES_Y = 10;


export default class RotatingCubes implements IExperiment {
  scene = new THREE.Scene();
  // camera = new THREE.PerspectiveCamera(150, WIDTH / HEIGHT, 0.1, 1000);
  camera = new THREE.OrthographicCamera(WIDTH / -2, WIDTH / 2, HEIGHT / 2, HEIGHT / -2, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  
  geometry = new THREE.BoxBufferGeometry(25, 25, 25);
  material = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  boxes = [];


  constructor() {
    this.camera.position.set(0, 0, 100);

    this.renderer.setClearColor(0xffffff);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }


  async init() {
    for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
      const boxAcc = [];
  
      for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
        const mesh = new THREE.Mesh(this.geometry, this.material);
        const geo = new THREE.EdgesGeometry(this.geometry);
        const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        const wireframe = new THREE.LineSegments(geo, mat);
        mesh.add(wireframe);
    
        const offsetX = (NUMBER_OF_BOXES_X - 1) / 2;
        const offsetY = (NUMBER_OF_BOXES_Y - 1) / 2;
        mesh.position.x = DISTANCE * -offsetX + (DISTANCE * i);
        mesh.position.y = DISTANCE * -offsetY + (DISTANCE * j);
    
        mesh.rotateZ(Math.PI / 18 * j);
        mesh.rotateX(Math.PI / 18 * i);
    
        this.scene.add(mesh);
        boxAcc.push(mesh);
      }
  
      this.boxes.push(boxAcc);
    }
  }


  async destroy() {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }


  async start() {}
  async stop() {}


  animate() {
    for (let i = 0; i < NUMBER_OF_BOXES_X; i++) {
      for (let j = 0; j < NUMBER_OF_BOXES_Y; j++) {
        const box = this.boxes[i][j];
        box.rotateY(0.01 * (i / 9 + 1));
      }
    }
  
    this.renderer.render(this.scene, this.camera);
  }
}
