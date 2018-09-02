// http://bigblueboo.tumblr.com/post/145035932469/from-all-angles#notes
import * as THREE from 'three';

const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(150, window.innerWidth / window.innerHeight, 0.1, 1000);
const camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor(0xffffff);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const boxes = [];
const DIST = 50;

for (let i = 0; i < 10; i++) {
  const boxAcc = [];
  for (let j = 0; j < 10; j++) {
    const geometry = new THREE.BoxBufferGeometry(25, 25, 25);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const mesh = new THREE.Mesh( geometry, material );
    const geo = new THREE.EdgesGeometry( geometry ); // or WireframeGeometry
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const wireframe = new THREE.LineSegments(geo, mat);
    mesh.add(wireframe);

    mesh.position.x = DIST * -4.5 + (DIST * i);
    mesh.position.y = DIST * -4.5 + (DIST * j);

    mesh.rotateZ(Math.PI / 18 * j);
    mesh.rotateX(Math.PI / 18 * i);

    scene.add(mesh);
    boxAcc.push(mesh);
  }
  boxes.push(boxAcc);
}

camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 100;

function animate() {
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const box = boxes[i][j];
      box.rotateY(0.01 * (i / 9 + 1));
    }
  }

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

