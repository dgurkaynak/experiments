import * as THREE from 'three';
import Stats from 'stats.js';
import OrbitControlsFactory from 'three-orbit-controls';
const OrbitControls = OrbitControlsFactory(THREE);
import CanvasResizer from '../utils/canvas-resizer';
import Animator from '../utils/animator';
import getAmmo from 'ammo.js'; const Ammo = getAmmo();
import * as ammoHelper from '../utils/three/ammo-helper';
import times from 'lodash/times';
import throttle from 'lodash/throttle';
import GLTFLoader from 'three-gltf-loader';
import { FFD } from '../utils/three/ffd';

import theBoldFontData from '../006/the-bold-font.json';
import toiletGltfPath from './assets/toilet.gltf';
import toiletColorMapPath from './assets/toilet_color.jpg';


/**
 * Constants
 */
const ENABLE_STATS = false;
const ENABLE_ORBIT_CONTROLS = false;

const GRAVITY = -9.8;
const MARGIN = 0.05;
const TEXT_BB_SEGMENTS = [8, 4, 1]; // Soft-body segment count, [1, 1, 1] means rigid-body (no bending capabilities)
const ENABLE_SHADOWS = false;
const SOFT_BODY_MASS = 1;
const SOFT_BODY_PRESSURE = 25;
const TEXT_SPAWN_INTERVAL = 1000;


/**
 * Setup environment
 */
const elements = {
  container: document.getElementById('container'),
  stats: document.getElementById('stats'),
};
const renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });
const resizer = new CanvasResizer(renderer.domElement, {
  dimension: [1024, 1024],
  dimensionScaleFactor: window.devicePixelRatio
});
const animator = new Animator(animate);
const stats = new Stats();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, resizer.width / resizer.height, 0.1, 1000);
const orbitControls = ENABLE_ORBIT_CONTROLS ? new OrbitControls(camera) : null;


/**
 * Experiment variables
 */
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const fontLoader = new THREE.FontLoader();
const theBoldFont = fontLoader.parse(theBoldFontData);
const clock = new THREE.Clock();

const defaultTextGeometry = new THREE.TextGeometry('BLAH', {
  font: theBoldFont,
  size: 1,
  height: 0.75,
  curveSegments: 12
});
const defaultTextMaterial = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.1,
  roughness: 0.5
});
const meshes: THREE.Mesh[] = [];

const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
const broadphase = new Ammo.btDbvtBroadphase();
const solver = new Ammo.btSequentialImpulseConstraintSolver();
const softBodySolver = new Ammo.btDefaultSoftBodySolver();
const physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
physicsWorld.setGravity(new Ammo.btVector3(0, GRAVITY, 0));
(<any>physicsWorld.getWorldInfo()).set_m_gravity(new Ammo.btVector3(0, GRAVITY, 0));
const softBodies = [];
const softBodyHelpers = new Ammo.btSoftBodyHelpers();
const cleanSoftBodiesThrottle = throttle(cleanSoftBodies, 500);



/**
 * Main/Setup function, initialize stuff...
 */
async function main() {
  renderer.setSize(resizer.width, resizer.height);
  elements.container.appendChild(renderer.domElement);
  resizer.resize = onWindowResize;
  resizer.init();

  if (ENABLE_STATS) {
    stats.showPanel(0);
    elements.stats.appendChild(stats.dom);
  }

  // Start experiment
  if (ENABLE_SHADOWS) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  camera.position.set(15, 5, 25);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 10);
  pointLight.position.set(-1, 1, 3);
  if (ENABLE_SHADOWS) {
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.1;
    pointLight.shadow.camera.far = 25;
  }
  scene.add(pointLight);

  await setupToilet();

  animator.start();
}


async function setupToilet() {
  // Load model and texture
  const [toiletGtlf, toiletColorMapTexture] = await Promise.all([
    loadGltf(toiletGltfPath),
    loadTexture(toiletColorMapPath)
  ]);

  // Add to scene
  (<any>toiletGtlf).scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = new THREE.MeshPhongMaterial({ map: toiletColorMapTexture });

      child.geometry.rotateX(- Math.PI / 2);
      child.geometry.translate(5, 0, 0);
      child.geometry.scale(0.5, 0.5, 0.5);

      if (ENABLE_SHADOWS) {
        child.castShadow = true;
        child.receiveShadow = true;
      }

      scene.add(child);
      meshes.push(child);
    }
  });

  // Start physics stuff
  const transparentMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });

  // Toilet mouth - donut shape
  const geometry1 = new THREE.TorusGeometry(3, 0.5, null, 20);
  geometry1.rotateX(Math.PI / 2);
  geometry1.scale(1.05, 0.25, 1.25)
  geometry1.translate(-0.15, -2.0, 0.55);
  const mesh1 = new THREE.Mesh(geometry1, transparentMaterial);
  const shape1 = ammoHelper.generateAmmoShapeFromGeometry(Ammo, geometry1, MARGIN);
  createRigidBody(shape1);
  scene.add(mesh1);
  meshes.push(mesh1);

  // Toilet inside - vase shape
  const lathePoints = times(10, i => new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2));
  const geometry2 = new THREE.LatheGeometry(lathePoints);
  geometry2.scale(0.25, 0.25, 0.3);
  geometry2.translate(-0.20, -4, 0.5);
  const mesh2 = new THREE.Mesh(geometry2, transparentMaterial);
  const shape2 = ammoHelper.generateAmmoShapeFromGeometry(Ammo, geometry2, MARGIN);
  createRigidBody(shape2);
  scene.add(mesh2);
  meshes.push(mesh2);
}


function createRigidBody(physicsShape) {
  const motionState = new Ammo.btDefaultMotionState();
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(0, localInertia);
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, physicsShape, localInertia);
  const body = new Ammo.btRigidBody(rbInfo);
  physicsWorld.addRigidBody(body);
}


function generateAndAddSoftBody(
  decorator: (geometry: THREE.Geometry) => void = () => {},
  geometry = defaultTextGeometry.clone(),
  material = defaultTextMaterial
) {
  const mesh = new THREE.Mesh(geometry, material);
  if (ENABLE_SHADOWS) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  scene.add(mesh);

  const undeformedVertices = geometry.vertices.map(v => new THREE.Vector3().copy(v))
  const bBox = new THREE.Box3();
  bBox.setFromPoints(geometry.vertices);

  const ffd = new FFD();
  ffd.rebuildLattice(bBox, TEXT_BB_SEGMENTS);

  const bBoxWidth = Math.abs(bBox.max.x - bBox.min.x);
  const bBoxHeight = Math.abs(bBox.max.y - bBox.min.y);
  const bBoxDepth = Math.abs(bBox.max.z - bBox.min.z);
  const bBoxGeometry = new THREE.BoxGeometry(bBoxWidth, bBoxHeight, bBoxDepth, TEXT_BB_SEGMENTS[0], TEXT_BB_SEGMENTS[1], TEXT_BB_SEGMENTS[2]);
  const bBoxGeometryTemp = bBoxGeometry.clone();

  decorator(bBoxGeometry);

  const volume = createSoftBody(bBoxGeometry, SOFT_BODY_MASS, SOFT_BODY_PRESSURE);

  bBoxGeometryTemp.translate(bBoxWidth / 2, bBoxHeight / 2, bBoxDepth / 2);
  bBoxGeometryTemp.mergeVertices();
  const vertexIndexToLatticeMapping = {};
  for (let i = 0; i < ffd.getTotalCtrlPtCount() ; i++) {
    const ctrlPos = ffd.getPosition(i);
    const targetI = findMinIndex(bBoxGeometryTemp.vertices, v => v.distanceTo(ctrlPos));
    vertexIndexToLatticeMapping[targetI] = i;
  }
  bBoxGeometryTemp.dispose();

  volume.mesh = mesh;
  volume.bBoxGeometry = bBoxGeometry;
  volume.textGeometry = geometry;
  volume.undeformedVertices = undeformedVertices;
  volume.vertexIndexToLatticeMapping = vertexIndexToLatticeMapping;
  volume.ffd = ffd;
}


function createSoftBody(geometry: THREE.Geometry, mass: number, pressure: number) {
  const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);

  // Merge the vertices so the triangle soup is converted to indexed triangles
  geometry.mergeVertices();

  // Convert again to BufferGeometry, indexed
  // const indexedBufferGeom = createIndexedBufferGeometryFromGeometry(geometry);
  const numVertices = geometry.vertices.length;
  const numFaces = geometry.faces.length;
  const bufferGeometryIndexed = new THREE.BufferGeometry();
  const vertices = new Float32Array(numVertices * 3);
  const indices = new (numFaces * 3 > 65535 ? Uint32Array : Uint16Array)(numFaces * 3);

  for (let i = 0; i < numVertices; i++) {
      const p = geometry.vertices[i];
      const i3 = i * 3;
      vertices[i3] = p.x;
      vertices[i3 + 1] = p.y;
      vertices[i3 + 2] = p.z;
  }

  for (let i = 0; i < numFaces; i++) {
      const f = geometry.faces[i];
      const i3 = i * 3;
      indices[i3] = f.a;
      indices[i3 + 1] = f.b;
      indices[i3 + 2] = f.c;
  }

  bufferGeometryIndexed.setIndex(new THREE.BufferAttribute(indices, 1));
  bufferGeometryIndexed.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

  // Create index arrays mapping the indexed vertices to bufGeometry vertices
  // mapIndices(bufGeometry, indexedBufferGeom);
  const bufVertices = bufferGeometry.attributes.position.array;
  const idxVertices = bufferGeometryIndexed.attributes.position.array;
  const numBufVertices = bufVertices.length / 3;
  const numIdxVertices = idxVertices.length / 3;
  bufferGeometry.ammoVertices = idxVertices;
  bufferGeometry.ammoIndices = bufferGeometryIndexed.index.array;
  bufferGeometry.ammoIndexAssociation = [];

  for (let i = 0; i < numIdxVertices; i++) {
      const association = [];
      bufferGeometry.ammoIndexAssociation.push( association );
      const i3 = i * 3;

      for (let j = 0; j < numBufVertices; j++) {
          const j3 = j * 3;
          if (isEqual(
            idxVertices[i3], idxVertices[i3 + 1],  idxVertices[i3 + 2],
            vertices[j3], vertices[j3 + 1], vertices[j3 + 2]
          )) {
              association.push(j3);
          }
      }
  }

  bufferGeometryIndexed.dispose();

  // Volume physic object
  const volumeSoftBody = (<any>softBodyHelpers).CreateFromTriMesh(
    physicsWorld.getWorldInfo(),
    bufferGeometry.ammoVertices,
    bufferGeometry.ammoIndices,
    bufferGeometry.ammoIndices.length / 3,
    true
  );
  const sbConfig = volumeSoftBody.get_m_cfg();

  sbConfig.set_viterations(40);
  sbConfig.set_piterations(40);
  sbConfig.set_collisions(0x11); // Soft-soft and soft-rigid collisions
  sbConfig.set_kDF(0.0); // Friction
  sbConfig.set_kDP(0.01); // Damping
  sbConfig.set_kPR(pressure); // Pressure
  volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9); // Stiffness
  volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9); // Stiffness
  volumeSoftBody.setTotalMass(mass, false);
  (<any>Ammo).castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(MARGIN);
  physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
  volumeSoftBody.setActivationState(4); // Disable deactivation

  const softBody = { physicsBody: volumeSoftBody, bufferGeometry };
  softBodies.push(softBody);

  return softBody;
}


function cleanSoftBodies() {
  const toBeDeleteds = softBodies.filter((softBody) => {
    return softBody.textGeometry.vertices[0].y < -4.5;
  });

  toBeDeleteds.forEach((softBody) => {
    const index = softBodies.indexOf(softBody);
    if (index > -1) softBodies.splice(index, 1);


    softBody.bufferGeometry.dispose();
    softBody.bBoxGeometry.dispose();
    softBody.mesh.geometry.dispose();
    scene.remove(softBody.mesh);
    physicsWorld.removeSoftBody(softBody.physicsBody);
  });
}



function updatePhysics(deltaTime) {
  // Step world
  physicsWorld.stepSimulation(deltaTime, 100);

  softBodies.forEach((volume) => {
    const geometry = volume.bufferGeometry;
    const softBody = volume.physicsBody;
    const volumePositions = geometry.attributes.position.array;
    const volumeNormals = geometry.attributes.normal.array;
    const association = geometry.ammoIndexAssociation;
    const numVerts = association.length;
    const nodes = softBody.get_m_nodes();

    for (let j = 0; j < numVerts; j++) {
      const node = nodes.at(j);
      const nodePos = node.get_m_x();
      const x = nodePos.x();
      const y = nodePos.y();
      const z = nodePos.z();
      const nodeNormal = node.get_m_n();
      const nx = nodeNormal.x();
      const ny = nodeNormal.y();
      const nz = nodeNormal.z();
      const assocVertex = association[j];

      for (let k = 0, kl = assocVertex.length; k < kl; k++) {
        let indexVertex = assocVertex[k];
        volumePositions[indexVertex] = x;
        volumeNormals[indexVertex] = nx;
        indexVertex++;
        volumePositions[indexVertex] = y;
        volumeNormals[indexVertex] = ny;
        indexVertex++;
        volumePositions[indexVertex] = z;
        volumeNormals[indexVertex] = nz;
      }
    }

    const originalGeometry = new THREE.Geometry().fromBufferGeometry(geometry);
    originalGeometry.mergeVertices();
    originalGeometry.vertices.forEach((vertex, i) => {
      const latticeIndex = volume.vertexIndexToLatticeMapping[i];
      volume.ffd.setPosition(latticeIndex, vertex);
    });
    originalGeometry.dispose();

    for (let i = 0; i < volume.textGeometry.vertices.length; i++) {
      const eval_pt = volume.ffd.evalWorld(volume.undeformedVertices[i]);
      if (eval_pt.equals(volume.textGeometry.vertices[i])) continue;
      volume.textGeometry.vertices[i].copy(eval_pt);
    }
    volume.textGeometry.verticesNeedUpdate = true;
  });
}


const addTextThrottled = throttle(() => {
  generateAndAddSoftBody((geometry) => {
    geometry.translate(
      (Math.random() < 0.5 ? -1.35 : 0.95) + (Math.random() - 0.5) * 0.15,
      6.5,
      (Math.random() < 0.5 ? -1.05 : 1.35) + (Math.random() - 0.5) * 0.15
    );
    geometry.rotateY((Math.random() - 0.25) * Math.PI / 2);
    // geometry.rotateX((Math.random() - 0.5) * Math.PI / 8);
    // geometry.rotateZ((Math.random() - 0.5) * Math.PI / 8);
  });
}, TEXT_SPAWN_INTERVAL);


/**
 * Animate stuff...
 */
function animate() {
  if (ENABLE_STATS) stats.begin();
  if (ENABLE_ORBIT_CONTROLS) orbitControls.update();

  const deltaTime = clock.getDelta();
  addTextThrottled();
  updatePhysics(deltaTime);
  cleanSoftBodiesThrottle();
  renderer.render(scene, camera);

  if (ENABLE_STATS) stats.end();
}


/**
 * On window resized
 */
function onWindowResize(width: number, height: number) {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}


function isEqual(x1, y1, z1, x2, y2, z2, delta = 0.000001) {
  return Math.abs(x2 - x1) < delta &&
    Math.abs(y2 - y1) < delta &&
    Math.abs(z2 - z1) < delta;
}


function findMinIndex(arr: THREE.Vector3[], fn) {
  let index = -1;
  let min = Infinity;

  arr.forEach((v, i) => {
    const result = fn(v);
    if (result < min) {
      min = result;
      index = i;
    }
  });

  return index;
}


function loadGltf(path) {
  return new Promise((resolve, reject) => gltfLoader.load(path, resolve, null, reject));
}


function loadTexture(path): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => textureLoader.load(path, resolve, null, reject));
}


function wait(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}


/**
 * Clean your shit
 */
function dispose() {
  animator.dispose();
  resizer.destroy();
  renderer.dispose();
  orbitControls && orbitControls.dispose();

  meshes.forEach((mesh) => {
    mesh.geometry.dispose();
    (<any>mesh.material).dispose();
  });

  softBodies.forEach((softBody) => {
    const index = softBodies.indexOf(softBody);
    if (index > -1) softBodies.splice(index, 1);

    softBody.bufferGeometry.dispose();
    softBody.bBoxGeometry.dispose();
    softBody.mesh.geometry.dispose();
    scene.remove(softBody.mesh);
    physicsWorld.removeSoftBody(softBody.physicsBody);
  });

  Object.keys(elements).forEach((key) => {
    const element = elements[key];
    while (element.firstChild) { element.removeChild(element.firstChild); }
  });
}


main().catch(err => console.error(err));
(module as any).hot && (module as any).hot.dispose(dispose);
