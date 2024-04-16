export function initWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = canvas.getContext('webgl');
  
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
    
}
export function initUI(){

    const redSlider = document.querySelector('#redSlider') as HTMLInputElement; 
    const greenSlider = document.querySelector('#greenSlider') as HTMLInputElement;
    const blueSlider = document.querySelector('#blueSlider') as HTMLInputElement;
    const alphaSlider = document.querySelector('#alphaSlider') as HTMLInputElement; 
    const brushSize = document.querySelector('#brushSize') as HTMLInputElement;
    const brushType = document.querySelector('#brushType') as HTMLSelectElement;
    const clearButton = document.querySelector('#clearButton') as HTMLButtonElement;

    
    const config: Config = {
        color: [redSlider, greenSlider, blueSlider, alphaSlider],
        shape: brushType,
        clear: clearButton,
        size: brushSize
    }

    return config;

}