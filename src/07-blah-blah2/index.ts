import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import theBoldFontData from '../06-blah-blah/the-bold-font.json';
import { FFD } from '../utils/three/ffd';
const Ammo = {}; require('../utils/ammo.js')(Ammo);
require('../utils/three/OrbitControls');
require('../utils/three/SubdivisionModifier');


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const GRAVITY = -9.8;
const MARGIN = 0.05;

const fontLoader = new THREE.FontLoader();
const theBoldFont = fontLoader.parse(theBoldFontData);


export default class Head extends ExperimentThreeJs {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, WIDTH / HEIGHT, 0.1, 1000);
  controls = new THREE.OrbitControls(this.camera);
  renderer = new THREE.WebGLRenderer({ antialias: window.devicePixelRatio == 1 });

  clock = new THREE.Clock();
  pos = new THREE.Vector3();
  quat = new THREE.Quaternion();
  physicsWorld;
  rigidBodies = [];
  softBodies = [];
  transformAux1 = new Ammo.btTransform();
  softBodyHelpers = new Ammo.btSoftBodyHelpers();

  defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.1,
    roughness: 0.5
  });

  constructor() {
    super();

    this.camera.position.set(2.5, 2.5, 10);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(-1, 0, 3);
    this.scene.add(pointLight);
  }


  async init() {
    super.init();

    // Physics
    const collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const softBodySolver = new Ammo.btDefaultSoftBodySolver();
    this.physicsWorld = new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, softBodySolver);
    this.physicsWorld.setGravity(new Ammo.btVector3(0, GRAVITY, 0));
    this.physicsWorld.getWorldInfo().set_m_gravity(new Ammo.btVector3(0, GRAVITY, 0));

    // Create objects
    // Ground
    this.pos.set(0, -0.5, 0);
    this.quat.set(0, 0, 0, 1);
    const groundMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
    const ground = this.createParalellepiped(40, 1, 40, 0, this.pos, this.quat, groundMaterial);
    ground.castShadow = true;
    ground.receiveShadow = true;


    setInterval(() => {
      this.addSoftBody((geometry) => {
        geometry.translate(0, 5, 0);
        // geometry.rotateY(Math.random() * Math.PI / 4);
      });
    }, 2500);

  }


  addSoftBody(
    decorator: (bufferGeometry: THREE.BufferGeometry) => void = () => {},
    geometry: THREE.Geometry = new THREE.TextGeometry('BLAH', {
      font: theBoldFont,
      size: 1,
      height: 0.75,
      curveSegments: 12
    }),
    material: THREE.Material = this.defaultMaterial
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const undeformedVertices = [];

    for (let i = 0; i < geometry.vertices.length; i++) {
      const copy_pt = new THREE.Vector3();
      copy_pt.copy(geometry.vertices[i]);
      undeformedVertices.push(copy_pt);
    }

    const bBox = new THREE.Box3();
    bBox.setFromPoints(geometry.vertices);

    const segments = [8, 4, 1];
    const ffd = new FFD();
    ffd.rebuildLattice(bBox, segments);

    const bBoxWidth = Math.abs(bBox.max.x - bBox.min.x);
    const bBoxHeight = Math.abs(bBox.max.y - bBox.min.y);
    const bBoxDepth = Math.abs(bBox.max.z - bBox.min.z);
    const bBoxGeometry = new THREE.BoxGeometry(bBoxWidth, bBoxHeight, bBoxDepth, segments[0], segments[1], segments[2]);
    const bBoxBufferGeometry = new THREE.BufferGeometry().fromGeometry(bBoxGeometry);
    const bBoxGeometryTemp = new THREE.Geometry().fromBufferGeometry(bBoxBufferGeometry);

    decorator(bBoxBufferGeometry);
    // bufferGeometry.translate(0, 2.5, 0);
    const volume = this.createSoftVolume(bBoxBufferGeometry, 25, 50);

    bBoxGeometryTemp.translate(bBoxWidth / 2, bBoxHeight / 2, bBoxDepth / 2);
    bBoxGeometryTemp.mergeVertices();

    const vertexIndexToLatticeMapping = {};

    for (let i = 0; i < ffd.getTotalCtrlPtCount() ; i++) {
      const ctrlPos = ffd.getPosition(i);
      const targetI = findMinIndex(bBoxGeometryTemp.vertices, v => v.distanceTo(ctrlPos));
      vertexIndexToLatticeMapping[targetI] = i;
    }

    volume.textGeometry = geometry;
    volume.undeformedVertices = undeformedVertices;
    volume.vertexIndexToLatticeMapping = vertexIndexToLatticeMapping;
    volume.ffd = ffd;
  }


  requestAnimationFrame() {
    this.controls.update();

    const deltaTime = this.clock.getDelta();
    this.updatePhysics(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }


  updatePhysics(deltaTime) {
    // Step world
    this.physicsWorld.stepSimulation(deltaTime, 10);
    // Update soft volumes
    for (let i = 0, il = this.softBodies.length; i < il; i++) {
        const volume = this.softBodies[i];
        const geometry = volume.geometry;
        const softBody = volume.userData.physicsBody;
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

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.normal.needsUpdate = true;

        const originalGeometry = new THREE.Geometry().fromBufferGeometry(geometry);
        originalGeometry.mergeVertices();
        originalGeometry.vertices.forEach((vertex, i) => {
          const latticeIndex = volume.vertexIndexToLatticeMapping[i];
          volume.ffd.setPosition(latticeIndex, vertex);
        });

        for (let i = 0; i < volume.textGeometry.vertices.length; i++) {
          var eval_pt = volume.ffd.evalWorld(volume.undeformedVertices[i]);
          if (eval_pt.equals(volume.textGeometry.vertices[i])) continue;
          volume.textGeometry.vertices[i].copy(eval_pt);
        }
        volume.textGeometry.verticesNeedUpdate = true;
    }

    // Update rigid bodies
    for (let i = 0, il = this.rigidBodies.length; i < il; i++) {
      const objThree = this.rigidBodies[i];
      const objPhys = objThree.userData.physicsBody;
      const ms = objPhys.getMotionState();
      if (ms) {
        ms.getWorldTransform(this.transformAux1);
        const p = this.transformAux1.getOrigin();
        const q = this.transformAux1.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }
  }


  createParalellepiped(sx, sy, sz, mass, pos, quat, material) {
    var threeObject = new THREE.Mesh(new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1), material);
    var shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
    shape.setMargin(MARGIN);
    this.createRigidBody(threeObject, shape, mass, pos, quat);
    return threeObject;
  }

  createRigidBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos);
    threeObject.quaternion.copy(quat);
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, physicsShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    threeObject.userData.physicsBody = body;
    this.scene.add(threeObject);
    if ( mass > 0 ) {
      this.rigidBodies.push(threeObject);
      // Disable deactivation
      body.setActivationState( 4 );
    }
    this.physicsWorld.addRigidBody(body);
    return body;
  }



  createSoftVolume(bufferGeom, mass, pressure) {
    processGeometry(bufferGeom);
    var volume = new THREE.Mesh(bufferGeom, new THREE.MeshPhongMaterial({
      color: 0xFFFFFF,
      wireframe: true,
      transparent: true,
      opacity: 0
    }));
    volume.castShadow = true;
    volume.receiveShadow = true;
    volume.frustumCulled = false;
    this.scene.add(volume);

    // Volume physic object
    const volumeSoftBody = this.softBodyHelpers.CreateFromTriMesh(
      this.physicsWorld.getWorldInfo(),
      bufferGeom.ammoVertices,
      bufferGeom.ammoIndices,
      bufferGeom.ammoIndices.length / 3,
      true
    );
    const sbConfig = volumeSoftBody.get_m_cfg();
    sbConfig.set_viterations(40);
    sbConfig.set_piterations(40);
    // Soft-soft and soft-rigid collisions
    sbConfig.set_collisions(0x11);
    // Friction
    sbConfig.set_kDF(0.1);
    // Damping
    sbConfig.set_kDP(0.01);
    // Pressure
    sbConfig.set_kPR( pressure );
    // Stiffness
    volumeSoftBody.get_m_materials().at(0).set_m_kLST(0.9);
    volumeSoftBody.get_m_materials().at(0).set_m_kAST(0.9);
    volumeSoftBody.setTotalMass(mass, false);
    Ammo.castObject(volumeSoftBody, Ammo.btCollisionObject).getCollisionShape().setMargin(MARGIN);
    this.physicsWorld.addSoftBody(volumeSoftBody, 1, -1);
    volume.userData.physicsBody = volumeSoftBody;
    // Disable deactivation
    volumeSoftBody.setActivationState(4);
    this.softBodies.push(volume);

    return volume;
  }

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


function processGeometry(bufGeometry: THREE.BufferGeometry) {
  // Obtain a Geometry
  const geometry = new THREE.Geometry().fromBufferGeometry(bufGeometry);
  // Merge the vertices so the triangle soup is converted to indexed triangles
  geometry.mergeVertices();
  // Convert again to BufferGeometry, indexed
  const indexedBufferGeom = createIndexedBufferGeometryFromGeometry(geometry);
  // Create index arrays mapping the indexed vertices to bufGeometry vertices
  mapIndices(bufGeometry, indexedBufferGeom);
}


function createIndexedBufferGeometryFromGeometry(geometry: THREE.Geometry) {
  const numVertices = geometry.vertices.length;
  const numFaces = geometry.faces.length;
  const bufferGeom = new THREE.BufferGeometry();
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

  bufferGeom.setIndex(new THREE.BufferAttribute(indices, 1));
  bufferGeom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));

  return bufferGeom;
}


// Creates ammoVertices, ammoIndices and ammoIndexAssociation in bufGeometry
function mapIndices(bufGeometry: THREE.BufferGeometry, indexedBufferGeom: THREE.BufferGeometry) {
  const vertices = bufGeometry.attributes.position.array;
  const idxVertices = indexedBufferGeom.attributes.position.array;
  const indices = indexedBufferGeom.index.array;
  const numIdxVertices = idxVertices.length / 3;
  const numVertices = vertices.length / 3;
  bufGeometry.ammoVertices = idxVertices;
  bufGeometry.ammoIndices = indices;
  bufGeometry.ammoIndexAssociation = [];

  for (let i = 0; i < numIdxVertices; i++) {
      const association = [];
      bufGeometry.ammoIndexAssociation.push( association );
      const i3 = i * 3;

      for (let j = 0; j < numVertices; j++) {
          const j3 = j * 3;
          if (isEqual(
            idxVertices[ i3 ], idxVertices[ i3 + 1 ],  idxVertices[ i3 + 2 ],
            vertices[ j3 ], vertices[ j3 + 1 ], vertices[ j3 + 2 ]
          )) {
              association.push(j3);
          }
      }
  }
}


function isEqual(x1, y1, z1, x2, y2, z2, delta = 0.000001) {
  return Math.abs(x2 - x1) < delta &&
    Math.abs(y2 - y1) < delta &&
    Math.abs(z2 - z1) < delta;
}
