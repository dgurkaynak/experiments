import * as THREE from 'three';


export default interface Experiment {
  renderer: THREE.WebGLRenderer;
  init(): Promise<void>;
  destroy(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  animate();
}
