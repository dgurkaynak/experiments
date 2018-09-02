import * as THREE from 'three';
require('./utils/OrbitControls');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const controls = new THREE.OrbitControls(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;

const geometry = new THREE.PlaneGeometry( 5, 5 );
const material = new THREE.MeshLambertMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
const plane = new THREE.Mesh( geometry, material );
plane.castShadow = true
scene.add( plane );

const geometry2 = new THREE.PlaneGeometry( 100, 100 );
const material2 = new THREE.MeshLambertMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
const plane2 = new THREE.Mesh( geometry2, material2 );
scene.add( plane2 );
plane2.position.z = -0.5
plane2.receiveShadow = true

const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
dirLight.color.setHSL( 0.1, 1, 0.95 );
dirLight.position.set( -1, 1.75, 1 );
dirLight.position.multiplyScalar( 30 );
scene.add( dirLight );
dirLight.castShadow = true;
const dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 10 );
scene.add( dirLightHeper );

camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 10;

function animate() {
  controls.update();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
