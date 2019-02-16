// Port of:
// https://github.com/wellflat/imageprocessing-labs/blob/master/cv/poisson_blending/poisson.js


const EPS = 1.0E-08;


export default class PoissonBlender {
  canvas = document.createElement('canvas');
  context = this.canvas.getContext('2d');


  blend(sourceImageData: ImageData, destinationImageData: ImageData, maskImageData: ImageData, boundingBoxes: number[][] = [], iteration = 10) {
    this.canvas.width = destinationImageData.width;
    this.canvas.height = destinationImageData.height;
    this.context.putImageData(destinationImageData, 0, 0);
    const resultImageData = this.context.getImageData(0, 0, destinationImageData.width, destinationImageData.height);

    const { width, height } = destinationImageData;

    if (!boundingBoxes || boundingBoxes.length == 0) {
      boundingBoxes = [[0, 0, width, height]];
    }

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

      for (let bb_i = 0; bb_i < boundingBoxes.length; bb_i++) {
        const [bb_x, bb_y, bb_width, bb_height] = boundingBoxes[bb_i];

        for (let y = bb_y; y < bb_y + bb_height; y++) {
          step = y * width << 2;

          for (let x = bb_x; x < bb_x + bb_width; x++) {
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
                      sumvq[c] += sourceImageData.data[l + c] - sourceImageData.data[naddr[n] + c];
                    }
                  }
                }
              } else {
                if (y >= 0 && x >= 0 && y < height && x < width) {
                  fp[0] = destinationImageData.data[l + m];
                  fp[1] = destinationImageData.data[l + m + 1];
                  fp[2] = destinationImageData.data[l + m + 2];
                  gp[0] = sourceImageData.data[l];
                  gp[1] = sourceImageData.data[l + 1];
                  gp[2] = sourceImageData.data[l + 2];
                  for (let n = 0; n < 4; n++) {
                    for (let c = 0; c < 3; c++) {
                      fq[c] = destinationImageData.data[naddr[n] + m + c];
                      // modification : we ignore pixels outside face mask, since these cause artifacts
                      // gq[c] = blendingImageData.data[naddr[n] + c];
                      gq[c] = sourceImageData.data[l + c];
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
          } // x loop end
        } // y loop end
      } // bb loop end

      if (terminate[0] && terminate[1] && terminate[2]) break;
    } // iteration loop

    this.context.putImageData(resultImageData, 0, 0);
    return resultImageData;
  }
}
