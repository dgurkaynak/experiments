// http://bigblueboo.tumblr.com/post/171834504103/bigblueboo-eyes-see-you#notes
// http://bigblueboo.tumblr.com/post/174117883078/bigblueboo-eyeball#notes

import * as THREE from 'three';
require('./utils/GLTFLoader');
// require('./utils/OrbitControls');

import eyesGltfPath from './assets/eye/eyes.gltf';
import irisBumpMapPath from './assets/eye/iris_bump.png';
import irisColorMapPath from './assets/eye/iris_color.png';
import eyeAlphaMapPath from './assets/eye/translucent_mask.png';
import eyeBumpMapPath from './assets/eye/sclera_bump.png';
import eyeColorMapPath from './assets/eye/sclera_color.png';
import { createConstructorTypeNode } from 'typescript';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// const controls = new THREE.OrbitControls(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

class EyeMeshFactory {
  loader = new THREE.GLTFLoader();
  group: THREE.Group;

  async init() {
    return new Promise((resolve, reject) => {
      this.loader.load(eyesGltfPath, (gltf) => {
        const meshes = [];

        gltf.scene.traverse((child) => {
          if (child.name.indexOf('Right_Iris') == 0) {
            child.material = new THREE.MeshPhongMaterial({
              bumpMap: new THREE.TextureLoader().load(irisBumpMapPath),
              map: new THREE.TextureLoader().load(irisColorMapPath)
            });
            child.position.z = 7.252;
            meshes.push(child);
          } else if (child.name.indexOf('Right_Eye') == 0) {
            child.material = new THREE.MeshPhongMaterial({
              alphaMap: new THREE.TextureLoader().load(eyeAlphaMapPath),
              bumpMap: new THREE.TextureLoader().load(eyeBumpMapPath),
              map: new THREE.TextureLoader().load(eyeColorMapPath),
              color: 0xffffff,
              transparent: true
            });
            child.position.z = 7.252;
            meshes.push(child);
          }
        });

        this.group = new THREE.Group();
        meshes.forEach(x => this.group.add(x));

        resolve();
      }, null, err => reject(err));
    });
  }


  create() {
    if (this.group) return this.group.clone();
  }
}


async function createScene() {
  const eyeFactory = new EyeMeshFactory();
  await eyeFactory.init();

  const eye1 = eyeFactory.create();
  scene.add(eye1);

  const eye2 = eyeFactory.create();
  eye2.position.z = 4;
  scene.add(eye2);
}

camera.position.x = 25;
camera.position.y = 0;
camera.position.z = 0;

camera.lookAt(new THREE.Vector3(0, 0, 0));

function animate() {
  // controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
createScene();
