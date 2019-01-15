export function lerp(A: number, B: number, ratio: number) {
  return A + ratio * (B - A);
}


export function map(n: number, start1: number, stop1: number, start2: number, stop2: number) {
  return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}
