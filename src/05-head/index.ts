import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import GeometrySpringModifier from './spring-modifier';
require('../utils/three/CTMLoader');

import headCtmPath from './assets/LeePerry.ctm';
import colorMapTexturePath from './assets/Map-COL.jpg';
import specularMapTexturePath from './assets/Map-SPEC.jpg';
import normalMapTexturePath from './assets/Infinite-Level_02_Tangent_SmoothUV.jpg';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const ctmLoader = new THREE.CTMLoader();
const textureLoader = new THREE.TextureLoader();


export default class Head extends ExperimentThreeJs {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
  enableOrbitControls = false;

  rayCaster = new THREE.Raycaster();
  mousePosition = new THREE.Vector2();
  mesh: THREE.Mesh;
  springModifier: GeometrySpringModifier;


  constructor() {
    super();

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
    ctmLoader.load(headCtmPath, (geometry_) => {

      const geometry = new THREE.Geometry().fromBufferGeometry(geometry_);

      const material = new THREE.MeshStandardMaterial({
        map: textureLoader.load(colorMapTexturePath),
        normalMap: textureLoader.load(normalMapTexturePath),
        normalScale: new THREE.Vector2(0.8, 0.8),
        metalness: 0.1,
        roughness: 0.5
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = 0.1;
      mesh.scale.setScalar(2.25);

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      this.mesh = mesh;
      this.springModifier = new GeometrySpringModifier(geometry);
      this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    });

    super.init();
  }


  requestAnimationFrame() {
    super.requestAnimationFrame();

    if (this.mesh) {
      this.springModifier.updateVertexSprings();
      this.mesh.geometry.verticesNeedUpdate = true;
      this.mesh.geometry.normalsNeedUpdate = true;
      this.mesh.geometry.computeFaceNormals();
      this.mesh.geometry.computeVertexNormals();
    }

    this.renderer.render(this.scene, this.camera);
  }


  onMouseMove(e: MouseEvent) {
    const mouseX = e.offsetX || e.clientX;
    const mouseY = e.offsetY || e.clientY;

    const vector = new THREE.Vector3(
      (mouseX / window.innerWidth) * 2 - 1,
      -(mouseY / window.innerHeight) * 2 + 1,
      0.5
    );

    vector.unproject(this.camera);
    this.rayCaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
    const intersects = this.rayCaster.intersectObject(this.mesh);

    if(intersects.length) {
      this.springModifier.displaceFace(intersects[0].face, 0.00005);
    }
  }
}
