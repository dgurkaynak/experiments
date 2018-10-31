import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import Wave2dCanvas from './wave2d-canvas';
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
  wave2d = new Wave2dCanvas(64, 16);


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

    this.wave2d.dampeningFactor = 0.95;
    this.wave2d.pullStrength = 0.01;
    this.wave2d.draw();

    // this.wave2d.canvas.id = 'head-displacement-map';
    // this.wave2d.canvas.style = 'position: absolute; top: 0; left: 0; width: 1024px; height: 1024px; zoom: 0.25;';
    // document.body.appendChild(this.wave2d.canvas);
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
      this.renderer.domElement.addEventListener('click', this.onClick.bind(this), false);

    });

    super.init();
  }


  requestAnimationFrame() {
    super.requestAnimationFrame();

    this.wave2d.draw();
    this.wave2d.iterate();
    if (this.mesh) this.mesh.material.displacementMap.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }


  onClick(e: MouseEvent) {
    this.mousePosition.x = (e.clientX / (this.canvasResizer.canvasWidth / this.canvasResizer.dimensionScaleFactor)) * 2 - 1;
    this.mousePosition.y = - (e.clientY / (this.canvasResizer.canvasHeight / this.canvasResizer.dimensionScaleFactor)) * 2 + 1;

    this.rayCaster.setFromCamera(this.mousePosition, this.camera);
    const intersects = this.rayCaster.intersectObject(this.mesh, true);

    if (intersects[0]) {
      const x = Math.floor(intersects[0].uv.x * 1024);
      const y = Math.floor((1 - intersects[0].uv.y) * 1024);
      console.log('Applying force...', x, y);
      this.wave2d.applyForce(x, y, -2);
    }
  }
}
