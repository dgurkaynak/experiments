export function getBoundingBox(points: number[][]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;


  points.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}


export function getCenter(points: number[][]) {
  return points.reduce((acc, [x, y]) => {
    return [
      acc[0] + x / points.length,
      acc[1] + y / points.length
    ];
  }, [0, 0]);
}


export function getDistance(a: number[], b: number[]) {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}


export function resizePoints(points: number[][], scale: number) {
  const center = getCenter(points);
  return points.map(([x, y]) => {
    const distance = getDistance([x, y], center);
    const newDistance = distance * scale;
    const angle = Math.atan2(y - center[1], x - center[0]);
    return [
      center[0] + newDistance * Math.cos(angle),
      center[1] + newDistance * Math.sin(angle)
    ];
  });
}
