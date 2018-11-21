export function lerp(A: number, B: number, ratio: number) {
  return A + ratio * (B - A);
}
