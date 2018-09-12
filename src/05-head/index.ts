// https://www.turbosquid.com/3d-models/free-3ds-mode-scan-photogrammetry-heads-human-eyes/777450

import * as THREE from 'three';
import IExperiment from '../iexperiment';
require('../utils/three/CTMLoader');
require('../utils/three/OrbitControls');

import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import specularMapTexturePath from './assets/Map-SPEC.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const ctmLoader = new THREE.CTMLoader();
const textureLoader = new THREE.TextureLoader();


export default class Head implements IExperiment {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);
  controls = new THREE.OrbitControls(this.camera);
  renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });


  constructor() {
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 1, 2);
    this.scene.add(pointLight);
  }


  async init() {
    ctmLoader.load(headCtmPath, (geometry) => {
      
      
      const material = new THREE.MeshPhongMaterial({
        specular: 0x303030,
        shininess: 25,
        map: textureLoader.load(colorMapTexturePath),
        specularMap: textureLoader.load(specularMapTexturePath),
        normalMap: textureLoader.load(normalMapTexturePath),
        normalScale: new THREE.Vector2(0.8, 0.8)
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.1;
      mesh.scale.setScalar(2.25);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

    });
  }


  async destroy() {}
  async start() {}
  async stop() {}


  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
