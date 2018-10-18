import * as THREE from 'three';
import ExperimentThreeJs from '../experiment-threejs';
import theBoldFontData from '../06-blah-blah/the-bold-font.json';
import { FFD } from '../utils/three/ffd';
const Ammo = {}; require('../utils/ammo.js')(Ammo);
require('../utils/three/OrbitControls');
require('../utils/three/GLTFLoader');

import toiletGltfPath from './assets/toilet.gltf';
import toiletColorMapPath from './assets/toilet_color.jpg';
import { CopyShader, WireframeGeometry } from 'three';


const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const GRAVITY = -9.8;
const MARGIN = 0.05;


export default class Head extends ExperimentThreeJs {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(20, WIDTH / HEIGHT, 0.1, 1000);
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

  gltfLoader = new THREE.GLTFLoader();
  textureLoader = new THREE.TextureLoader();
  fontLoader = new THREE.FontLoader();
  theBoldFont = this.fontLoader.parse(theBoldFontData);

  defaultMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    metalness: 0.1,
    roughness: 0.5
  });

  cleanSoftBodiesThrottled = throttle(this.cleanSoftBodies, 500, this);

  constructor() {
    super();

    this.camera.position.set(15, 5, 25);
    this.camera.lookAt(new THREE.Vector3(-100, 100, 0));

    this.renderer.setClearColor(0x000000);
    this.renderer.setSize(WIDTH, HEIGHT);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 10);
    pointLight.position.set(-1, 1, 3);
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
    // this.pos.set(0, -0.5, 0);
    // this.quat.set(0, 0, 0, 1);
    // const groundMaterial = new THREE.MeshPhongMaterial({color: 0x000000});
    // const ground = this.createParalellepiped(40, 1, 40, 0, this.pos, this.quat, groundMaterial);
    // ground.castShadow = true;
    // ground.receiveShadow = true;


    const [toiletGtlf, toiletColorMapTexture] = await Promise.all([
      this.loadGltf(toiletGltfPath),
      this.loadTexture(toiletColorMapPath)
    ]);

    toiletGtlf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshPhongMaterial({
          // wireframe: true,
          // transparent: true,
          // opacity: 0.25,
          map: toiletColorMapTexture
        });
        
        child.geometry.rotateX(- Math.PI / 2);
        child.geometry.translate(5, 0, 0);
        child.geometry.scale(0.5, 0.5, 0.5);

        this.setupCollision();

        this.scene.add(child);
      }
    });


    setInterval(() => {
      this.addSoftBody((geometry) => {
        geometry.translate(
          (Math.random() < 0.5 ? -1.35 : 0.95) + (Math.random() - 0.5) * 0.15, 
          6.5, 
          (Math.random() < 0.5 ? -1.05 : 1.35) + (Math.random() - 0.5) * 0.15
        );
        geometry.rotateY((Math.random() - 0.25) * Math.PI / 2);
        // geometry.rotateX((Math.random() - 0.5) * Math.PI / 8);
        // geometry.rotateZ((Math.random() - 0.5) * Math.PI / 8);
      });
    }, 1000);

  }


  setupCollision() {
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      transparent: true, 
      opacity: 0.0
    });

    const geo1 = new THREE.TorusGeometry(3, 0.5, null, 20);
    geo1.rotateX(Math.PI / 2);
    geo1.scale(1.05, 0.25, 1.25)
    geo1.translate(-0.15, -2.0, 0.55);
    const mesh1 = new THREE.Mesh(geo1, material);
    this.scene.add(mesh1);

    const shape1 = generateAmmoShapeFromGeometry(geo1);
    this.createRigidBody(mesh1, shape1, 0, this.pos, this.quat);


    const lathePoints = [];
    for (let i = 0; i < 10; i++) {
      lathePoints.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2));
    }
    const geo2 = new THREE.LatheGeometry(lathePoints);
    geo2.scale(0.25, 0.25, 0.3);
    geo2.translate(-0.20, -4, 0.5);
    const mesh2 = new THREE.Mesh(geo2, material);
    this.scene.add(mesh2);

    const shape2 = generateAmmoShapeFromGeometry(geo2);
    this.createRigidBody(mesh2, shape2, 0, this.pos, this.quat);
  }


  addSoftBody(
    decorator: (bufferGeometry: THREE.BufferGeometry) => void = () => {},
    geometry: THREE.Geometry = new THREE.TextGeometry('BLAH', {
      font: this.theBoldFont,
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
    const volume = this.createSoftVolume(bBoxBufferGeometry, 2, 1);

    bBoxGeometryTemp.translate(bBoxWidth / 2, bBoxHeight / 2, bBoxDepth / 2);
    bBoxGeometryTemp.mergeVertices();

    const vertexIndexToLatticeMapping = {};

    for (let i = 0; i < ffd.getTotalCtrlPtCount() ; i++) {
      const ctrlPos = ffd.getPosition(i);
      const targetI = findMinIndex(bBoxGeometryTemp.vertices, v => v.distanceTo(ctrlPos));
      vertexIndexToLatticeMapping[targetI] = i;
    }

    volume.textMesh = mesh;
    volume.textGeometry = geometry;
    volume.undeformedVertices = undeformedVertices;
    volume.vertexIndexToLatticeMapping = vertexIndexToLatticeMapping;
    volume.ffd = ffd;
  }


  cleanSoftBodies() {
    const softBodiesToBeDeleted = [];

    this.softBodies.forEach((softBody) => {
      if (softBody.textGeometry.vertices[0].y < -4.5) {
        softBodiesToBeDeleted.push(softBody);
      }
    });

    softBodiesToBeDeleted.forEach((softBody) => {
      const index = this.softBodies.indexOf(softBody);
      if (index > -1) this.softBodies.splice(index, 1);

      this.scene.remove(softBody);
      this.scene.remove(softBody.textMesh);
      softBody.textGeometry.dispose();

      this.physicsWorld.removeSoftBody(softBody.userData.physicsBody);
    });
  }


  requestAnimationFrame() {
    this.controls.update();

    const deltaTime = this.clock.getDelta();
    this.updatePhysics(deltaTime);
    this.cleanSoftBodiesThrottled();

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
    sbConfig.set_kDF(0.0);
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


  async loadGltf(path) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(path, resolve, null, reject);
    });
  }


  async loadTexture(path): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(path, resolve, null, reject);
    });
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


function generateAmmoShapeFromGeometry(geometry) {
  const vertices = geometry.vertices;
  const triangles = [];
  geometry.mergeVertices();
  geometry.faces.forEach((face) => {
    triangles.push([
      { x: vertices[face.a].x, y: vertices[face.a].y, z: vertices[face.a].z },
      { x: vertices[face.b].x, y: vertices[face.b].y, z: vertices[face.b].z },
      { x: vertices[face.c].x, y: vertices[face.c].y, z: vertices[face.c].z }
    ]);
  });

  const triangleMesh = new Ammo.btTriangleMesh();
  const _vec3_1 = new Ammo.btVector3(0,0,0);
  const _vec3_2 = new Ammo.btVector3(0,0,0);
  const _vec3_3 = new Ammo.btVector3(0,0,0);
  triangles.forEach((triangle) => {
    _vec3_1.setX(triangle[0].x);
    _vec3_1.setY(triangle[0].y);
    _vec3_1.setZ(triangle[0].z);

    _vec3_2.setX(triangle[1].x);
    _vec3_2.setY(triangle[1].y);
    _vec3_2.setZ(triangle[1].z);

    _vec3_3.setX(triangle[2].x);
    _vec3_3.setY(triangle[2].y);
    _vec3_3.setZ(triangle[2].z);

    triangleMesh.addTriangle(_vec3_1, _vec3_2, _vec3_3, true);
  });
  const shape = new Ammo.btBvhTriangleMeshShape(triangleMesh, true, true);
  shape.setMargin(MARGIN);
  return shape;
}


function throttle(fn, threshhold, scope) {
  threshhold || (threshhold = 250);
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date,
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}
