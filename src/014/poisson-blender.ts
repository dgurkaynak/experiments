// Port of:
// https://github.com/wellflat/imageprocessing-labs/blob/master/cv/poisson_blending/poisson.js


const EPS = 1.0E-08;


export default class PoissonBlender {
  canvas = document.createElement('canvas');
  context = this.canvas.getContext('2d');


  blend(blendingImageData: ImageData, baseImageData: ImageData, maskImageData: ImageData, iteration = 10) {
    this.canvas.width = baseImageData.width;
    this.canvas.height = baseImageData.height;
    this.context.putImageData(baseImageData, 0, 0);
    const resultImageData = this.context.getImageData(0, 0, baseImageData.width, baseImageData.height);

    const { width, height } = baseImageData;
    let edge = false;
    let error = 0;
    let sumf = [0, 0, 0];
    let sumfstar = [0, 0, 0];
    let sumvq = [0, 0, 0];
    const fp = [];
    const fq = [];
    const gp = [];
    const gq = [];
    const subf = [];
    const subg = [];
    let naddr = [];
    const threshold = 128;
    let terminate = [];
    let step: number;
    let l: number;
    let m: number;

    for (let i = 0; i < iteration; i++) {
      terminate = [true, true, true];

      for (let y = 1; y < height - 1; y++) {
        step = y * width << 2;

        for (let x = 1; x < width - 1; x++) {
          l = step + (x << 2);
          m = 0;
          naddr = [l - (width << 2), l - 4, l + 4, l + (width << 2)];

          if (maskImageData.data[l] > threshold) {
            sumf = [0.0, 0.0, 0.0];
            sumfstar = [0.0, 0.0, 0.0];
            sumvq = [0.0, 0.0, 0.0];
            edge = false;

            for (let n = 0; n < 4; n++) {
              if (maskImageData.data[naddr[n]] <= threshold) {
                edge = true;
                break;
              }
            }

            if (!edge) {
              if (y >= 0 && x >= 0 && y < height && x < width) {
                for (let n = 0; n < 4; n++) {
                  for (let c = 0; c < 3; c++) {
                    sumf[c] += resultImageData.data[naddr[n] + m + c];
                    sumvq[c] += blendingImageData.data[l + c] - blendingImageData.data[naddr[n] + c];
                  }
                }
              }
            } else {
              if (y >= 0 && x >= 0 && y < height && x < width) {
                fp[0] = baseImageData.data[l + m];
                fp[1] = baseImageData.data[l + m + 1];
                fp[2] = baseImageData.data[l + m + 2];
                gp[0] = blendingImageData.data[l];
                gp[1] = blendingImageData.data[l + 1];
                gp[2] = blendingImageData.data[l + 2];
                for (let n = 0; n < 4; n++) {
                  for (let c = 0; c < 3; c++) {
                    fq[c] = baseImageData.data[naddr[n] + m + c];
                    gq[c] = blendingImageData.data[naddr[n] + c];
                    sumfstar[c] += fq[c];
                    subf[c] = fp[c] - fq[c];
                    subf[c] = subf[c] > 0 ? subf[c] : -subf[c];
                    subg[c] = gp[c] - gq[c];
                    subg[c] = subg[c] > 0 ? subg[c] : -subg[c];
                    if (subf[c] > subg[c]) {
                      sumvq[c] += subf[c];
                    } else {
                      sumvq[c] += subg[c];
                    }
                  }
                }
              }
            }

            for (let c = 0; c < 3; c++) {
              fp[c] = (sumf[c] + sumfstar[c] + sumvq[c]) * 0.25; // division 4
              error = Math.floor(fp[c] - resultImageData.data[l + m + c]);
              error = error > 0 ? error : -error;
              if (terminate[c] && error > EPS * (1 + (fp[c] > 0 ? fp[c] : -fp[c]))) {
                terminate[c] = false;
              }
              resultImageData.data[l + m + c] = fp[c];
            }

          } // mask if
        } // x loop
      } // y loop

      if (terminate[0] && terminate[1] && terminate[2]) break;
    } // iteration loop

    this.context.putImageData(resultImageData, 0, 0);
    return resultImageData;
  }
}
