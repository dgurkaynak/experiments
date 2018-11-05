export default function saveImage(canvas: HTMLCanvasElement) {
  const dataString = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = 'image.png';
  link.href = dataString;
  link.click();
}
