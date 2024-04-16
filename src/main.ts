import { createProgram, initUI, initWebGL } from './utils';
enum Shape {
  SQUARE = 1,
  TRIANGLE = 2,
  CIRCLE = 3,
};
interface Point {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  size: number;
  shape: Shape;
}



class Buffer {
  arr: Float32Array[];
  count: number;
  offset: number;
  poolIndex: number;
  numPoints: number;

  constructor() {
    this.arr = [];
    this.arr.push(new Float32Array(2048)); // Start with one array
    this.count = 0;  // Tracks the current index in the current Float32Array
    this.offset = 8; // Each point takes 8 slots in the array
    this.poolIndex = 0; // Which Float32Array in arr we are using
    this.numPoints = 0; // Total points stored in the Buffer
  }

  addPoint(x: number, y: number, r: number, g: number, b: number, a: number, size: number, shape: number) {
    //we need to extend the array
    if (this.count && this.count % 2040 == 0) {
      this.poolIndex++;
      this.arr.push(new Float32Array(2048));
      this.count = 0;
    }
    this.arr[this.poolIndex][this.count] = x;
    this.arr[this.poolIndex][this.count + 1] = y;
    this.arr[this.poolIndex][this.count + 2] = r;
    this.arr[this.poolIndex][this.count + 3] = g;
    this.arr[this.poolIndex][this.count + 4] = b;
    this.arr[this.poolIndex][this.count + 5] = a;
    this.arr[this.poolIndex][this.count + 6] = size;
    this.arr[this.poolIndex][this.count + 7] = shape;

    this.count += this.offset;
    this.numPoints++;
  }

  getLastPoint() {
    if (this.count === 0) {
      return null;
    }

    const baseIndex = this.count - this.offset;
    return {
      x: this.arr[this.poolIndex][baseIndex],
      y: this.arr[this.poolIndex][baseIndex + 1],
      r: this.arr[this.poolIndex][baseIndex + 2],
      g: this.arr[this.poolIndex][baseIndex + 3],
      b: this.arr[this.poolIndex][baseIndex + 4],
      a: this.arr[this.poolIndex][baseIndex + 5],
      size: this.arr[this.poolIndex][baseIndex + 6],
      shape: this.arr[this.poolIndex][baseIndex + 7]
    };
  }

  removeLastPoint() {
    if (this.count === 0) {
      return;
    }
    this.count -= this.offset;
    this.numPoints--;
  }

  clear() {
    this.arr = [new Float32Array(2048)]; // Reset the array holding the points
    this.count = 0;
    this.poolIndex = 0;
    this.numPoints = 0;
  }

  // Add an iterator
  [Symbol.iterator]() {
    let index = 0;
    let poolIndex = 0;
    let numPointsIterated = 0;

    return {
      next: () => {
        if (numPointsIterated >= this.numPoints) {
          return { done: true };
        }

        if (index === 256) {  // When we reach the end of the current array
          poolIndex++;
          index = 0;
        }

        const baseIndex = index * this.offset;
        let value: Point = {
          x: this.arr[poolIndex][baseIndex],
          y: this.arr[poolIndex][baseIndex + 1],
          r: this.arr[poolIndex][baseIndex + 2],
          g: this.arr[poolIndex][baseIndex + 3],
          b: this.arr[poolIndex][baseIndex + 4],
          a: this.arr[poolIndex][baseIndex + 5],
          size: this.arr[poolIndex][baseIndex + 6],
          shape: this.arr[poolIndex][baseIndex + 7]
        };

        index++;
        numPointsIterated++;

        return { value, done: false };
      }
    };
  }

}

const canvas = document.getElementById('webgl') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Failed to get canvas element');
}
const gl = initWebGL(canvas);
const config = initUI();
const program = createProgram(gl);

let isDrawing = false;

class Paint {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  points: Float32Array = new Float32Array(1000);

  a_Position: number;
  u_FragColor: WebGLUniformLocation;
  u_Size: WebGLUniformLocation;
  buff: Buffer = new Buffer();
  redoBuff: Buffer = new Buffer();  

  constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
    this.gl = gl;
    this.program = program;

    this.a_Position = this.gl.getAttribLocation(this.program, 'a_Position');
    if (this.a_Position < 0) throw new Error('Failed to get attribute location');

    const color = this.gl.getUniformLocation(this.program, 'u_FragColor');
    if (!color) throw new Error('Failed to get color uniform');
    this.u_FragColor = color;
    const size = this.gl.getUniformLocation(this.program, 'u_Size');
    if (!size) throw new Error('Failed to get size uniform');
    this.u_Size = size;

    console.log(this.u_FragColor);
    console.log(this.u_Size);
    console.log(this.a_Position);
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);



  }

  addPoint(point: Point) {
    this.buff.addPoint(point.x, point.y, point.r, point.g, point.b, point.a, point.size, point.shape);
  }

  draw() {
    if (this.buff.numPoints > 0) {
      // Only draw the most recent point
      const lastPoint = this.buff.getLastPoint();
      this.drawPoint(lastPoint as Point);
    }
  }
  drawSquare(point: Point) {
    //@ts-ignore
    const { x, y, r, g, b, a, size, shape } = point;

    this.gl.vertexAttrib3f(this.a_Position, x, y, 0.0);
    this.gl.uniform4f(this.u_FragColor, r, g, b, a);
    this.gl.uniform1f(this.u_Size, size);


    const buff = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);

    // Calculate half the size to center the square around (x, y)
    const halfSize = size / 2;

    // Specify vertices to form two triangles that create a square
    const vertices = new Float32Array([
      x - halfSize, y - halfSize,  // First triangle
      x + halfSize, y - halfSize,
      x - halfSize, y + halfSize,
      x + halfSize, y - halfSize,  // Second triangle
      x + halfSize, y + halfSize,
      x - halfSize, y + halfSize
    ]);

    // Load vertices into the buffer
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.DYNAMIC_DRAW);

    // Set up and enable the vertex attribute pointer
    this.gl.vertexAttribPointer(this.a_Position, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);

    // Draw the square using two triangles
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6); // 6 vertices (3 per triangle * 2)
  }
  drawTriangle(point: Point) {
    const { x, y, r, g, b, a, size, shape } = point;
    console.log({ x, y, r, g, b, a, size, shape });

    this.gl.vertexAttrib3f(this.a_Position, x, y, 0.0);
    this.gl.uniform4f(this.u_FragColor, r, g, b, a);
    this.gl.uniform1f(this.u_Size, size);

    const buff = this.gl.createBuffer();
    if (!buff) throw new Error('Failed to create buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      x, y, 0.0,
      x + size / 2, y, 0.0,
      x, y + size / 2, 0.0,
    ]), this.gl.DYNAMIC_DRAW);

    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
  }

  undo() {
    const lastPoint = this.buff.getLastPoint();
    if (lastPoint) {
      this.buff.removeLastPoint();
      this.redoBuff.addPoint(lastPoint.x, lastPoint.y, lastPoint.r, lastPoint.g, lastPoint.b, lastPoint.a, lastPoint.size, lastPoint.shape);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      for (const point of this.buff) {
        this.drawPoint(point as Point);
      }
    }
    this.buff.removeLastPoint();
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    for (const point of this.buff) {
      this.drawPoint(point as Point);
    }
  }
  // there's a bug with this lol
  redo(){
    const lastPoint = this.redoBuff.getLastPoint();
    if (lastPoint) {
      this.redoBuff.removeLastPoint();
      this.buff.addPoint(lastPoint.x, lastPoint.y, lastPoint.r, lastPoint.g, lastPoint.b, lastPoint.a, lastPoint.size, lastPoint.shape);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      for (const point of this.buff) {
        this.drawPoint(point as Point);
      }
    }
  }

  export(){
    const canvas = document.getElementById('webgl') as HTMLCanvasElement;
    const dataURL = canvas.toDataURL();
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'canvas.png';
    a.click();
  }


  drawCircle(point: Point) {
    const { x, y, r, g, b, a, size } = point;
    const segments = parseInt(config.segments.value); // Ensure this is set appropriately
  
    // Calculate the angle between each segment
    const angleStep = Math.PI * 2 / segments;
    const vertices = new Float32Array(3 * (segments + 2)); // +2 for the center and the loop back
  
    // Center vertex for TRIANGLE_FAN
    vertices[0] = x; // x
    vertices[1] = y; // y
    vertices[2] = 0.0; // z
  
    // Calculate vertices around the circle
    for (let i = 1; i <= segments + 1; i++) {
      vertices[i * 3 + 0] = x + size * Math.cos(angleStep * (i - 1)); // x
      vertices[i * 3 + 1] = y + size * Math.sin(angleStep * (i - 1)); // y
      vertices[i * 3 + 2] = 0.0; // z
    }
  
    // Create buffer and upload data
    const buff = this.gl.createBuffer();
    if (!buff) throw new Error('Failed to create buffer');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
  
    // Set up vertex attributes
    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(this.a_Position);
  
    // Set uniform for color
    this.gl.uniform4f(this.u_FragColor, r, g, b, a);
    this.gl.uniform1f(this.u_Size, size);
  
    // Draw the circle using triangle fan
    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, segments + 2);
  }
  
  drawPoint(point: Point) {
    switch (point.shape) {
      case Shape.SQUARE:
        this.drawSquare(point);
        break;
      case Shape.TRIANGLE:
        this.drawTriangle(point);
        break;
      case Shape.CIRCLE:
        this.drawCircle(point);
        break;
    }
  }
  
}


//drawing logic

const paint = new Paint(gl, program);

canvas.addEventListener('mousedown', function (event) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  let x = event.clientX; // x coordinate of a mouse pointer
  let y = event.clientY; // y coordinate of a mouse pointer

  // Convert the x and y coordinates to WebGL coordinates 
  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  const r = parseFloat(config.color[0].value) / 100;
  const g = parseFloat(config.color[1].value) / 100;
  const b = parseFloat(config.color[2].value) / 100;
  const a = parseFloat(config.color[3].value) / 100;
  const size = parseFloat(config.size.value) / 100;
  const shape = parseFloat(config.shape.value) as Shape;
  paint.buff.addPoint(x, y, r, g, b, a, size, shape);
  paint.draw();
});

canvas.addEventListener('mousemove', function (event) {
  if (isDrawing) {
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX;
    let y = event.clientY;

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    const r = parseFloat(config.color[0].value) / 100;
    const g = parseFloat(config.color[1].value) / 100;
    const b = parseFloat(config.color[2].value) / 100;
    const a = parseFloat(config.color[3].value) / 100;
    const size = parseFloat(config.size.value) / 100;
    const shape = parseFloat(config.shape.value) as Shape;
    paint.buff.addPoint(x, y, r, g, b, a, size, shape);
    paint.draw();
  }
});

canvas.addEventListener('mouseup', function () {
  isDrawing = false;
});

config.clear.addEventListener('mousedown', function () {

  gl.clearColor(1, 1, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  paint.buff.clear();
  paint.draw();
});

config.undo.addEventListener('mousedown', function () {
  paint.undo();
});

config.redo.addEventListener('mousedown', function () {
  paint.redo();
});

config.export.addEventListener('mousedown', function () {
  paint.export();
});