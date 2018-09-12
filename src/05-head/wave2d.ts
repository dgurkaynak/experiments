// http://curran.github.io/HTML5Examples/canvas/waveSimulation2D/

export default class Wave2D {
  canvas: HTMLCanvasElement = document.createElement('canvas');
  c = this.canvas.getContext('2d');
  grayStrings: string[] = []
  
  pullStrength = 0.005;
  dampeningFactor = 0.98;
  cells: {height: number, velocity: number}[] = [];

  
  constructor(private cellCount: number, private cellSize: number) {
    this.canvas.width = cellCount * cellSize;
    this.canvas.height = cellCount * cellSize;

    this.cacheGrayStrings();
    this.createCells();
  }


  cacheGrayStrings() {
    for(let gray = 0; gray < 255; gray++){
        this.c.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        this.grayStrings.push(this.c.fillStyle);
    }
  }


  createCells() {
    for(let i = 0; i < this.cellCount; i++){
      for(let j = 0; j < this.cellCount; j++){
        this.cells.push({ height: 0.5, velocity: 0 });
      }
    }
  }


  draw() {
    for(let i = 0; i < this.cellCount; i++){
      for(let j = 0; j < this.cellCount; j++){
        const cell = this.cells[i + j * this.cellCount];
        const x = i / (this.cellCount-1) * this.canvas.width;
        const y = j / (this.cellCount-1) * this.canvas.height;
        let gray = Math.floor(cell.height * 255);
        gray = gray > 255 ? 255 : gray < 0 ? 0 : gray;
        
        this.c.fillStyle = this.grayStrings[gray];
        this.c.fillRect(x, y, this.cellSize + 1, this.cellSize + 1);
      }
    }
  }

  iterate() {
    for(let i = 0; i < this.cellCount; i++){
      for(let j = 0; j < this.cellCount; j++){
        // center cell
        const c = this.cells[i + j * this.cellCount];

        for(let di = -1; di <= 1; di++){
          for(let dj = -1; dj <= 1; dj++){
            if(di !== 0 || dj !== 0){
              const ni = ((i + di) + this.cellCount) % this.cellCount;
              const nj = ((j + dj) + this.cellCount) % this.cellCount;
  
              const neighbor = this.cells[ni + nj * this.cellCount];
              c.velocity += this.pullStrength * (neighbor.height - c.height);
            }
          }
        }
        
        // increment velocity
        c.height += c.velocity;
        
        // apply dampening
        c.velocity *= this.dampeningFactor;
      }
    }
  }

  applyForce(x: number, y: number, height: number) {
    const i = Math.floor((this.cellCount - 1) * x / this.canvas.width);
    const j = Math.floor((this.cellCount - 1) * y / this.canvas.height);
    const cell = this.cells[i + j * this.cellCount];
    cell.height = height;
    cell.velocity = 0;
  }
}
