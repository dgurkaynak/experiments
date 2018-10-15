import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import theBoldFontData from './the-bold-font.json';
import Perlin from '../05-head/perlin';
require('../utils/three/OrbitControls');
require('../utils/three/SubdivisionModifier');


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const fontLoader = new THREE.FontLoader();
const theBoldFont = fontLoader.parse(theBoldFontData);


export default class Head extends ExperimentThreeJs {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(25, WIDTH / HEIGHT, 0.1, 1000);
  controls = new THREE.OrbitControls(this.camera);
  renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });

  perlin = new Perlin(128);
  mesh1: THREE.Mesh;
  mesh2: THREE.Mesh;

  constructor() {
    super();

    this.camera.position.set(2.5, 2.5, 10);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(-1, 0, 3);
    this.scene.add(pointLight);

    this.perlin.noiseDivider = 10;
    this.perlin.draw();

    // this.perlin.canvas.id = 'perlin1';
    // this.perlin.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
    // document.body.appendChild(this.perlin.canvas);
  }


  async init() {
    super.init();

    const geometry = new THREE.TextGeometry('BLAH', {
      font: theBoldFont,
      size: 1,
      height: 0.75,
      curveSegments: 12
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      // wireframe: true,
      // map: new THREE.CanvasTexture(this.perlin.canvas),
      // normalMap: new THREE.CanvasTexture(this.perlin.canvas),
      // normalScale: new THREE.Vector2(0.8, 0.8),
      displacementMap: new THREE.CanvasTexture(this.perlin.canvas),
      displacementScale: 0.1,
      displacementBias: -0.05,
      metalness: 0.1,
      roughness: 0.5
    });

    // const material = new THREE.MeshPhongMaterial({ color: 0xffffff });

    const mesh1 = new THREE.Mesh(geometry, material);
    mesh1.castShadow = true;
    mesh1.receiveShadow = true;
    mesh1.position.x = -1.6;
    this.scene.add(mesh1);

    const mesh2 = new THREE.Mesh(geometry, material);
    mesh2.castShadow = true;
    mesh2.receiveShadow = true;
    mesh2.position.x = -1.6;
    mesh2.position.y = -1.1;
    this.scene.add(mesh2);

    this.mesh1 = mesh1;
    this.mesh2 = mesh2;
  }


  requestAnimationFrame() {
    this.controls.update();

    this.perlin.draw();
    if (this.mesh1) this.mesh1.material.displacementMap.needsUpdate = true;
    if (this.mesh2) this.mesh2.material.displacementMap.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
}
