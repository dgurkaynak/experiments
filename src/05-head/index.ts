import * as THREE from 'three';
import IExperiment from '../iexperiment';
import Wave2D from './wave2d';
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

  rayCaster = new THREE.Raycaster();
  mousePosition = new THREE.Vector2();
  mesh: THREE.Mesh;
  wave2d = new Wave2D(64, 16);

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

    this.wave2d.dampeningFactor = 0.95;
    this.wave2d.pullStrength = 0.01;
    this.wave2d.draw();

    // this.wave2d.canvas.id = 'head-displacement-map';
    // this.wave2d.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
    // document.body.appendChild(this.wave2d.canvas);
  }


  async init() {
    ctmLoader.load(headCtmPath, (geometry) => {

      const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(colorMapTexturePath),
        normalMap: textureLoader.load(normalMapTexturePath),
        normalScale: new THREE.Vector2(0.8, 0.8),
        metalness: 0.1,
        roughness: 0.5,
        displacementMap: new THREE.CanvasTexture(this.wave2d.canvas),
        displacementScale: 0.05,
        displacementBias: -0.025,
      });
      

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.1;
      mesh.scale.setScalar(2.25);
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.mesh = mesh;
    });


    document.body.addEventListener('click', this.onClick.bind(this), false);
  }


  async destroy() {}
  async start() {}
  async stop() {}


  animate() {
    this.controls.update();

    this.wave2d.draw();
    this.wave2d.iterate();
    if (this.mesh) this.mesh.material.displacementMap.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }


  onClick(e: MouseEvent) {
    this.mousePosition.x = (e.clientX / WIDTH) * 2 - 1;
    this.mousePosition.y = - (e.clientY / HEIGHT) * 2 + 1;

    this.rayCaster.setFromCamera(this.mousePosition, this.camera);
    const intersects = this.rayCaster.intersectObject(this.mesh, true);
    
    if (intersects[0]) {
      const x = Math.floor(intersects[0].uv.x * 1024);
      const y = Math.floor((1 - intersects[0].uv.y) * 1024);
      console.log('Applying force...', x, y);
      this.wave2d.applyForce(x, y, -1);
    }
  }
}
