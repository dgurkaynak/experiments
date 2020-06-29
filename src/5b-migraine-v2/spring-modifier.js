// Derived from:
// https://www.creativebloq.com/javascript/create-interactive-liquid-metal-ball-webgl-4126370

// Global deps
// - THREE

export class GeometrySpringModifier {
  SPRING_STRENGTH = 0.0005;
  DAMPEN = 0.999;

  constructor(geometry) {
    this.geometry = geometry;
    geometry.faces.forEach((face) => {
      this.createSpring(face.a, face.b);
      this.createSpring(face.b, face.c);
      this.createSpring(face.c, face.a);
    });
  }

  createSpring(start, end) {
    const startVertex = this.geometry.vertices[start];
    const endVertex = this.geometry.vertices[end];

    if (!startVertex.springs) {
      startVertex.springs = [];
      startVertex.normal = startVertex.clone().normalize();
      startVertex.originalPosition = startVertex.clone();
    }

    if (!endVertex.springs) {
      endVertex.springs = [];
      endVertex.normal = startVertex.clone().normalize();
      endVertex.originalPosition = endVertex.clone();
    }

    if (!startVertex.velocity) {
      startVertex.velocity = new THREE.Vector3();
    }

    // finally create a spring
    startVertex.springs.push({
      start: startVertex,
      end: endVertex,
      length: startVertex.length(endVertex),
    });
  }

  displaceFace(face, magnitude) {
    this.displaceVertex(face.a, magnitude);
    this.displaceVertex(face.b, magnitude);
    this.displaceVertex(face.c, magnitude);
  }

  displaceVertex(vertexIndex, magnitude) {
    const vertex = this.geometry.vertices[vertexIndex];
    const velocityDelta = vertex.normal.clone().multiplyScalar(magnitude);
    vertex.velocity.add(velocityDelta);
  }

  updateVertexSprings() {
    // go through each spring and
    // work out what the extension is
    let vertexCount = this.geometry.vertices.length;

    while (vertexCount--) {
      const vertex = this.geometry.vertices[vertexCount];
      const vertexSprings = vertex.springs;

      if (!vertexSprings) {
        continue;
      }

      for (let v = 0; v < vertexSprings.length; v++) {
        const vertexSpring = vertexSprings[v];
        const length = vertexSpring.start.length(vertexSpring.end);
        const extension = vertexSpring.length - length;
        const acceleration = new THREE.Vector3(0, 0, 0);

        acceleration
          .copy(vertexSpring.start.normal)
          .multiplyScalar(extension * this.SPRING_STRENGTH);
        vertexSpring.start.velocity.add(acceleration);

        acceleration
          .copy(vertexSpring.end.normal)
          .multiplyScalar(extension * this.SPRING_STRENGTH);
        vertexSpring.end.velocity.add(acceleration);

        vertexSpring.start.add(vertexSpring.start.velocity);
        vertexSpring.end.add(vertexSpring.end.velocity);

        vertexSpring.start.velocity.multiplyScalar(this.DAMPEN);
        vertexSpring.end.velocity.multiplyScalar(this.DAMPEN);
      }

      vertex.add(
        vertex.originalPosition.clone().sub(vertex).multiplyScalar(0.03)
      );
    }
  }
}
