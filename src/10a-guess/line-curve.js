// Deps:
// - p5
// - lodash (times, sampleSize)

export class MultipleLineCurveEntity {
  static create(
    lineCount,
    curvePointCount,
    xCoordSpace,
    yCoordSpace,
    lineWidthSpace,
    colorSpace
  ) {
    const entity = new MultipleLineCurveEntity();
    entity.curvePointCount = curvePointCount;
    entity.xCoordSpace = xCoordSpace;
    entity.yCoordSpace = yCoordSpace;
    entity.lineWidthSpace = lineWidthSpace;
    entity.colorSpace = colorSpace;

    entity.lines = _.times(lineCount, () => entity.createRandomLine());

    return entity;
  }

  static crossover(mother, father) {
    const entity1 = new MultipleLineCurveEntity();
    entity1.curvePointCount = mother.curvePointCount;
    entity1.xCoordSpace = mother.xCoordSpace;
    entity1.yCoordSpace = mother.yCoordSpace;
    entity1.lineWidthSpace = mother.lineWidthSpace;
    entity1.colorSpace = mother.colorSpace;

    const entity2 = new MultipleLineCurveEntity();
    entity2.curvePointCount = mother.curvePointCount;
    entity2.xCoordSpace = mother.xCoordSpace;
    entity2.yCoordSpace = mother.yCoordSpace;
    entity2.lineWidthSpace = mother.lineWidthSpace;
    entity2.colorSpace = mother.colorSpace;

    const middleIndex = Math.round(mother.lines.length / 2);

    entity1.lines = [].concat(
      mother.lines.slice(0, middleIndex),
      father.lines.slice(middleIndex)
    );

    entity2.lines = [].concat(
      mother.lines.slice(middleIndex),
      father.lines.slice(0, middleIndex)
    );

    return [entity1, entity2];
  }

  constructor() {
    this.lines = null;
    this.curvePointCount = null;
    this.xCoordSpace = null;
    this.yCoordSpace = null;
    this.lineWidthSpace = null;
    this.colorSpace = null;
  }

  draw(p) {
    this.lines
      .sort((a, b) => {
        return b.width - a.width;
      })
      .forEach((line) => {
        p.stroke(line.color);
        p.strokeWeight(line.width);
        p.noFill();
        p.beginShape();
        line.points.forEach((point) => p.curveVertex(point.x, point.y));
        p.endShape();
      });
  }

  createRandomLine() {
    const xCoords = _.sampleSize(this.xCoordSpace, this.curvePointCount);
    const yCoords = _.sampleSize(this.yCoordSpace, this.curvePointCount);
    const color = _.sampleSize(this.colorSpace, 1)[0];
    const width = _.sampleSize(this.lineWidthSpace, 1)[0];

    const points = _.times(this.curvePointCount, (i) => ({
      x: xCoords[i],
      y: yCoords[i],
    }));

    return {
      points,
      width,
      color,
    };
  }

  mutate() {
    const randomLineIndex = Math.floor(Math.random() * this.lines.length);
    this.lines.splice(randomLineIndex, 1);
    this.lines.push(this.createRandomLine());
  }
}

function lerp(A, B, ratio) {
  return A + ratio * (B - A);
}
