import Experiment from './experiment';
import * as THREE from 'three';
import Stats from 'stats.js';
import { OrbitControls } from 'three-orbitcontrols-ts';
import CanvasResizer from './utils/canvas-resizer';


export default class ExperimentThreeJs extends Experiment {
  canvasResizer: CanvasResizer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  onWindowResizeBinded = this.onWindowResize.bind(this);

  enableOrbitControls = false;
  controls: OrbitControls;

  enableStats = true;
  stats: Stats;

  async init() {
    this.containerEl.appendChild(this.renderer.domElement);
    this.canvasResizer.resize = this.onWindowResize.bind(this);
    this.canvasResizer.init(this.renderer.domElement);

    if (this.enableOrbitControls) this.controls = new OrbitControls(this.camera);

    if (this.enableStats) {
      this.stats = new Stats();
      this.stats.showPanel(0);
      this.statsEl.appendChild(this.stats.dom);
    }
  }


  async destroy() {
    this.canvasResizer.destroy();
    this.renderer.dispose();
  }


  onWindowResize(width: number, height: number) {
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = width / this.canvasResizer.dimensionScaleFactor / -2;
      this.camera.right = width / this.canvasResizer.dimensionScaleFactor / 2;
      this.camera.top = height / this.canvasResizer.dimensionScaleFactor / 2;
      this.camera.bottom = height / this.canvasResizer.dimensionScaleFactor / -2;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height);
  }


  requestAnimationFrame() {
    if (this.enableOrbitControls) this.controls.update();
  }
}
