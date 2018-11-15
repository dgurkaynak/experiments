import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import PerlinCanvas from './perlin-canvas';
import CanvasResizer from '../utils/canvas-resizer';
require('../utils/three/CTMLoader');

import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import specularMapTexturePath from './assets/Map-SPEC.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';


const ctmLoader = new THREE.CTMLoader();
const textureLoader = new THREE.TextureLoader();


export default class Head extends ExperimentThreeJs {
  canvasResizer = new CanvasResizer({
    dimension: 'fullscreen',
    dimensionScaleFactor: window.devicePixelRatio
  });

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, this.canvasResizer.canvasWidth / this.canvasResizer.canvasHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
  enableOrbitControls = false;

  rayCaster = new THREE.Raycaster();
  mousePosition = new THREE.Vector2();
  mesh: THREE.Mesh;
  perlin = new PerlinCanvas(512);


  constructor() {
    super();

    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(this.canvasResizer.canvasWidth, this.canvasResizer.canvasHeight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 1, 2);
    this.scene.add(pointLight);

    this.perlin.noiseDivider = 50;
    this.perlin.draw();

    // this.perlin.canvas.id = 'head-displacement-map';
    // this.perlin.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
    // document.body.appendChild(this.perlin.canvas);
  }


  async init() {
    ctmLoader.load(headCtmPath, (geometry_) => {

      const geometry = new THREE.Geometry().fromBufferGeometry(geometry_);

      const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(colorMapTexturePath),
        normalMap: textureLoader.load(normalMapTexturePath),
        normalScale: new THREE.Vector2(0.8, 0.8),
        metalness: 0.1,
        roughness: 0.5,
        displacementMap: new THREE.CanvasTexture(this.perlin.canvas),
        displacementScale: 0.0075,
        displacementBias: -0.00375,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.1;
      mesh.scale.setScalar(2.25);

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.mesh = mesh;

    });

    super.init();
  }


  requestAnimationFrame() {
    super.requestAnimationFrame();

    this.perlin.draw();
    if (this.mesh) this.mesh.material.displacementMap.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
}
