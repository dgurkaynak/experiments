import nudged from 'nudged';


export default class FaceLandmarks68 {
  points: [number, number][];


  constructor(points: number[][]) {
    this.points = points as [number, number][];
  }


  static createFromObjectArray(pointsObj: { _x: number, _y: number }[]) {
    const points = pointsObj.map(({ _x, _y }) => [_x, _y] as [number, number]);
    return new FaceLandmarks68(points);
  }


  toPath() {
    // Outer boundary, or convex hull
    const includePath = [].concat(
      this.points.slice(0, 17),
      this.points.slice(17, 27).reverse()
    );

    return {
      include: includePath,
      exclude: this.points.slice(60, 68) // inner mouth
    }
  }


  /**
   * Returns nudged transformation.
   * See https://github.com/axelpale/nudged for more details
   *
   * @param target
   * @param pointsPreprocessor
   */
  estimateTransformationTo(target: FaceLandmarks68, pointsPreprocessor = (points: number[][]) => points) {
    return nudged.estimate(
      'TSR',
      pointsPreprocessor(this.points),
      pointsPreprocessor(target.points)
    );
  }
}
