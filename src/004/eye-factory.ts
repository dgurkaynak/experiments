import * as THREE from 'three';
import randomColor from 'randomcolor';
import GLTFLoader from 'three-gltf-loader';


import eyesGltfPath from './assets/eyes.gltf';
import irisBumpMapPath from './assets/iris_bump.png';
import irisColorMapPath from './assets/iris_color.png';
import eyeAlphaMapPath from './assets/translucent_mask.png';
import eyeBumpMapPath from './assets/sclera_bump.png';
import eyeColorMapPath from './assets/sclera_color.png';


class EyeMeshFactory {
  gltfLoader = new GLTFLoader();
  textureLoader = new THREE.TextureLoader();
  group: THREE.Group;


  async init() {
    const [
      eyeGltf,
      irisBumpMapTexture,
      irisColorMapTexture,
      eyeAlphaMapTexture,
      eyeBumpMapTexture,
      eyeColorMapTexture
    ] = await Promise.all([
      this.loadGltf(eyesGltfPath),
      this.loadTexture(irisBumpMapPath),
      this.loadTexture(irisColorMapPath),
      this.loadTexture(eyeAlphaMapPath),
      this.loadTexture(eyeBumpMapPath),
      this.loadTexture(eyeColorMapPath)
    ]);

    const meshes = [];
    eyeGltf.scene.traverse((child) => {
      if (child.name.indexOf('Right_Iris') == 0) {
        child.material = new THREE.MeshPhongMaterial({
          bumpMap: irisBumpMapTexture,
          map: irisColorMapTexture
        });
        child.position.z = 7.252;
        meshes.push(child);
      } else if (child.name.indexOf('Right_Eye') == 0) {
        child.material = new THREE.MeshPhongMaterial({
          alphaMap: eyeAlphaMapTexture,
          bumpMap: eyeBumpMapTexture,
          map: eyeColorMapTexture,
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
  }


  create() {
    if (!this.group) return;
    const eye = this.group.clone();

    // Random color
    const iris = eye.children[0].children[1];
    const newIrisMaterial = iris.material.clone();
    newIrisMaterial.color = new THREE.Color(randomColor({ luminosity: 'light' }));
    iris.material = newIrisMaterial;

    return eye;
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


export default EyeMeshFactory;
