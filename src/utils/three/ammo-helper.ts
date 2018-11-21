import * as THREE from 'three';


// Cannot get another Ammo instance, it causes abort(33) error
export function generateAmmoShapeFromGeometry(Ammo, geometry: THREE.Geometry, margin = 0.05) {
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
  shape.setMargin(margin);
  return shape;
}
