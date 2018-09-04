// http://bigblueboo.tumblr.com/post/171834504103/bigblueboo-eyes-see-you#notes
// http://bigblueboo.tumblr.com/post/174117883078/bigblueboo-eyeball#notes

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
require('./utils/GLTFLoader');
// require('./utils/OrbitControls');


import eyesGltfPath from './assets/eye/eyes.gltf';
import irisBumpMapPath from './assets/eye/iris_bump.png';
import irisColorMapPath from './assets/eye/iris_color.png';
import eyeAlphaMapPath from './assets/eye/translucent_mask.png';
import eyeBumpMapPath from './assets/eye/sclera_bump.png';
import eyeColorMapPath from './assets/eye/sclera_color.png';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 50;
camera.lookAt(new THREE.Vector3(0, 0, 0));
// const controls = new THREE.OrbitControls(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// const prevCanvasEl = document.getElementsByTagName('canvas');
// if (prevCanvasEl[0]) document.body.removeChild(prevCanvasEl[0]);
document.body.appendChild(renderer.domElement);

const light = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light);

const spotLight = new THREE.SpotLight( 0xffffff, 1 );
spotLight.position.set( 0, 10, 25 );
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.decay = 2;
spotLight.distance = 50;
spotLight.castShadow = true;
// spotLight.shadow.mapSize.width = 1024;
// spotLight.shadow.mapSize.height = 1024;
// spotLight.shadow.camera.near = 10;
// spotLight.shadow.camera.far = 200;
scene.add( spotLight );
// const lightHelper = new THREE.SpotLightHelper( spotLight );
// scene.add( lightHelper );

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

        const innerGroup = new THREE.Group();
        meshes.forEach(x => innerGroup.add(x));
        innerGroup.rotateY(- Math.PI / 2);
        this.group = new THREE.Group();
        this.group.add(innerGroup);
        this.group.castShadow = true;

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

  (window as any).eyes = pointsOnSphere(100).filter(pos => pos.z > 0.2).map((pos) => {
    const eye = eyeFactory.create();
    const scale = 10.5;
    eye.position.set(pos.x * scale, pos.y * scale, pos.z * scale);
    scene.add(eye);
    return eye;
  });

  // Look at the mouse
  // var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -25);
  // var raycaster = new THREE.Raycaster();
  // var mouse = new THREE.Vector2();
  // var intersectPoint = new THREE.Vector3();
  // window.addEventListener('mousemove', (event) => {
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //   raycaster.setFromCamera(mouse, camera);
  //   raycaster.ray.intersectPlane(plane, intersectPoint);
  //   eyes.forEach(x => x.lookAt(intersectPoint))
  // }, false);
}
createScene();


// https://github.com/spite/looper/blob/master/modules/points-sphere.js
function pointsOnSphere(n) {
  const pts = [];
  const inc = Math.PI * (3 - Math.sqrt(5));
  const off = 2.0 / n;
  let r;
  var phi;
  let dmin = 10000;
  const prev = new THREE.Vector3();
  const cur = new THREE.Vector3();

  for (var k = 0; k < n; k++){
    cur.y = k * off - 1 + (off /2);
    r = Math.sqrt(1 - cur.y * cur.y);
    phi = k * inc;
    cur.x = Math.cos(phi) * r;
    cur.z = Math.sin(phi) * r;

    const dist = cur.distanceTo(prev);
    if(dist < dmin) dmin = dist;

    pts.push(cur.clone());
    prev.copy(cur);
  }

  return pts;
}


function animate() {
  // controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
