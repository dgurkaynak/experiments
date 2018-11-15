import p5 from 'p5';
import times from 'lodash/times';
import sampleSize from 'lodash/sampleSize';


interface Point {
  x: number;
  y: number;
}


interface Line {
  points: Point[];
  width: number;
  color: string;
}


export default class MultipleLineCurveEntity {
  lines: Line[];
  curvePointCount: number;
  xCoordSpace: number[];
  yCoordSpace: number[];
  lineWidthSpace: number[];
  colorSpace: string[];


  static create(
    lineCount: number,
    curvePointCount: number,
    xCoordSpace: number[],
    yCoordSpace: number[],
    lineWidthSpace: number[],
    colorSpace: string[]
  ) {
    const entity = new MultipleLineCurveEntity();
    entity.curvePointCount = curvePointCount;
    entity.xCoordSpace = xCoordSpace;
    entity.yCoordSpace = yCoordSpace;
    entity.lineWidthSpace = lineWidthSpace;
    entity.colorSpace = colorSpace;

    entity.lines = times(lineCount, () => entity.createRandomLine());

    return entity;
  }


  static crossover(
    mother: MultipleLineCurveEntity,
    father: MultipleLineCurveEntity
  ) {
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

    return [ entity1, entity2 ];
  }


  draw(p: p5) {
    this.lines.sort((a, b) => {
      return b.width - a.width;
    }).forEach((line) => {
      p.stroke(line.color);
      p.strokeWeight(line.width);
      p.noFill();
      p.beginShape();
      line.points.forEach(point => p.curveVertex(point.x, point.y));
      p.endShape();
    });
  }


  createRandomLine() {
    const xCoords = sampleSize(this.xCoordSpace, this.curvePointCount);
    const yCoords = sampleSize(this.yCoordSpace, this.curvePointCount);
    const color = sampleSize(this.colorSpace, 1)[0];
    const width = sampleSize(this.lineWidthSpace, 1)[0];

    const points = times(this.curvePointCount, (i) => ({ x: xCoords[i], y: yCoords[i] }));

    return {
      points,
      width,
      color
    };
  }


  mutate() {
    const randomLineIndex = Math.floor(Math.random() * this.lines.length);
    this.lines.splice(randomLineIndex, 1);
    this.lines.push(this.createRandomLine());
  }
}


function lerp(A: number, B: number, ratio: number) {
  return A + ratio * (B - A);
}
