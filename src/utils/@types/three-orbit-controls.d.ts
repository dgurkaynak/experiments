/// <reference path="../../../node_modules/@types/three/index.d.ts" />

declare module 'three-orbit-controls' {
  class OrbitControls {
    constructor(camera: THREE.Camera, domElement?: Element);
    getPolarAngle();
    getAzimuthalAngle();

    update();
    reset();
    dispose();
  }


  export default function(three: typeof THREE): typeof OrbitControls;
}
