import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const BG_COLOR = 0x000000;
const SPHERE_COLOR = 0xffffff;
const SPHERE_RADIUS = 0.025;
const NUMBER_X = 50;
const NUMBER_Z = 50;
const SPHERE_DISTANCE = 1;


export default class Waves extends ExperimentThreeJs {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  enableOrbitControls = false;

  geometry = new THREE.SphereGeometry(SPHERE_RADIUS);
  material = new THREE.MeshBasicMaterial({ color: SPHERE_COLOR });
  cubes = [];
  delta = 0;


  constructor() {
    super();
    this.camera.position.set(0, 4, NUMBER_Z / 2 * SPHERE_DISTANCE);

    this.renderer.setClearColor(BG_COLOR);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }


  async init() {
    for (let i = 0; i < NUMBER_X; i++) {
      const cubesX = [];

      for (let j = 0; j < NUMBER_Z; j++) {
        const cube = new THREE.Mesh(this.geometry, this.material);
        cube.position.x = i * SPHERE_DISTANCE - (NUMBER_X / 2 * SPHERE_DISTANCE);
        cube.position.z = j * SPHERE_DISTANCE - (NUMBER_Z / 2 * SPHERE_DISTANCE);
        cubesX.push(cube);
        this.scene.add(cube);
      }

      this.cubes.push(cubesX);
    }

    super.init();
  }


  async destroy() {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }


  requestAnimationFrame() {
    super.requestAnimationFrame();

    for (let i = 0; i < NUMBER_X; i++) {
      for (let j = 0; j < NUMBER_Z; j++) {
        const cube = this.cubes[i][j];
        cube.position.y = (Math.sin(i * 0.5 + this.delta * 0.025) + Math.sin(j * 0.5 + this.delta * 0.025)) * 0.5;
      }
    }
    this.delta++;

    this.renderer.render(this.scene, this.camera);
  }
}
