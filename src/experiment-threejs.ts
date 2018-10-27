import Experiment from './experiment';
import * as THREE from 'three';
import Stats from 'stats.js';
import { OrbitControls } from 'three-orbitcontrols-ts';


export default class ExperimentThreeJs extends Experiment {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.Renderer;
  onWindowResizeBinded = this.onWindowResize.bind(this);

  enableOrbitControls = false;
  controls: OrbitControls;

  enableStats = true;
  stats: Stats;

  async init() {
    document.body.style.overflow = 'hidden';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.containerEl.appendChild(this.renderer.domElement);

    if (this.enableOrbitControls) this.controls = new OrbitControls(this.camera);

    if (this.enableStats) {
      this.stats = new Stats();
      this.stats.showPanel(0);
      this.statsEl.appendChild(this.stats.dom);
    }

    window.addEventListener('resize', this.onWindowResizeBinded, false);
  }


  async destroy() {
    document.body.style.overflow = '';
    window.removeEventListener('resize', this.onWindowResizeBinded, false);
  }


  onWindowResize() {
    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = WIDTH / HEIGHT;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      this.camera.left = WIDTH / -2;
      this.camera.right = WIDTH / 2;
      this.camera.top = HEIGHT / 2;
      this.camera.bottom = HEIGHT / -2;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(WIDTH, HEIGHT);
  }

  requestAnimationFrame() {
    if (this.enableOrbitControls) this.controls.update();
  }
}
