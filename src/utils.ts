const VSHADER_SOURCE = `
uniform float u_Size;
attribute vec4 a_Position;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

// Fragment shader program
const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

export function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!vertexShader || !fragmentShader || !program) {
    throw new Error('Failed to create shader or program');
  }

  gl.shaderSource(vertexShader, VSHADER_SOURCE);
  gl.shaderSource(fragmentShader, FSHADER_SOURCE);

  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error('Failed to compile vertex shader');
  }
  
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error('Failed to compile fragment shader');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Failed to link program');
  }

  return program;
}


export function initWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  
  if (!gl) {
    throw new Error('WebGL not supported')
  }

  return gl;
}

interface Config{
    color: HTMLInputElement[];
    shape: HTMLSelectElement;
    clear: HTMLButtonElement;
    size: HTMLInputElement;
    segments: HTMLInputElement;
    undo: HTMLButtonElement;
    redo: HTMLButtonElement;
    export: HTMLButtonElement;
    
}
export function initUI(){

    const redSlider = document.querySelector('#redSlider') as HTMLInputElement; 
    const greenSlider = document.querySelector('#greenSlider') as HTMLInputElement;
    const blueSlider = document.querySelector('#blueSlider') as HTMLInputElement;
    const alphaSlider = document.querySelector('#alphaSlider') as HTMLInputElement; 
    const brushSize = document.querySelector('#brushSize') as HTMLInputElement;
    const brushType = document.querySelector('#brushType') as HTMLSelectElement;
    const clearButton = document.querySelector('#clearButton') as HTMLButtonElement;
    const segmentSlider = document.querySelector('#segmentSlider') as HTMLInputElement;
    const undoButton = document.querySelector('#undoButton') as HTMLButtonElement;
    const redoButton = document.querySelector('#redoButton') as HTMLButtonElement;
    const exportButton = document.querySelector('#exportButton') as HTMLButtonElement;


    
    const config: Config = {
        color: [redSlider, greenSlider, blueSlider, alphaSlider],
        shape: brushType,
        clear: clearButton,
        size: brushSize,
        segments: segmentSlider,
        undo: undoButton,
        redo: redoButton,
        export: exportButton
    }

    return config;

}