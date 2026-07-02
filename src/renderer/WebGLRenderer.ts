// ============================================================
// WebGLRenderer.ts - WebGL GPGPU renderer for million-cell grids
// ============================================================

import { Grid } from '../engine/Grid';
import { CellState, TerrainType, BuffFlag, LeviathanState } from '../Types';

// Vertex shader - fullscreen quad
const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Compute shader - Game of Life rules as GLSL
const COMPUTE_SHADER = `
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_terrain;
uniform sampler2D u_buffs;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float getCell(sampler2D tex, vec2 coord) {
  return texture2D(tex, coord / u_resolution).r;
}

void main() {
  vec2 coord = v_texCoord * u_resolution;
  float current = texture2D(u_state, v_texCoord).r;
  float terrain = texture2D(u_terrain, v_texCoord).r;
  float buff = texture2D(u_buffs, v_texCoord).r;

  if (terrain > 0.4 && terrain < 0.6) {
    // Wall
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Count red neighbors
  float redCount = 0.0;
  float blueCount = 0.0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx == 0 && dy == 0) continue;
      vec2 nc = (coord + vec2(float(dx), float(dy))) / u_resolution;
      float n = texture2D(u_state, nc).r;
      if (n > 0.4 && n < 0.6) redCount += 1.0;
      else if (n > 0.6) blueCount += 1.0;
    }
  }

  // Is swamp
  float isSwamp = terrain > 0.6 ? 1.0 : 0.0;
  float birthCount = 3.0 + isSwamp;
  float survMax = 3.0 + step(0.4, buff);

  float newState = 0.0;

  if (current > 0.1) {
    // Alive
    float sameNeighbors = current < 0.6 ? redCount : blueCount;
    if (sameNeighbors >= 2.0 && sameNeighbors <= survMax) {
      newState = current;
    }
  } else {
    // Empty - reproduction
    bool redBirth = redCount == birthCount;
    bool blueBirth = blueCount == birthCount;
    if (redBirth && blueBirth) {
      newState = redCount > blueCount ? 0.5 : (blueCount > redCount ? 0.7 : (fract(coord.x * 0.1 + coord.y * 0.2) > 0.5 ? 0.5 : 0.7));
    } else if (redBirth) {
      newState = 0.5;
    } else if (blueBirth) {
      newState = 0.7;
    }
  }

  gl_FragColor = vec4(newState, 0.0, 0.0, 1.0);
}
`;

// Render shader - maps state texture to colors
const RENDER_SHADER = `
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_terrain;
uniform sampler2D u_buffs;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

void main() {
  float state = texture2D(u_state, v_texCoord).r;
  float terrain = texture2D(u_terrain, v_texCoord).r;
  float buff = texture2D(u_buffs, v_texCoord).r;

  vec3 color;

  if (terrain > 0.4 && terrain < 0.6) {
    color = vec3(0.176, 0.192, 0.259); // Wall
  } else if (terrain > 0.6) {
    color = vec3(0.176, 0.416, 0.310); // Swamp
  } else if (state > 0.4 && state < 0.6) {
    color = buff > 0.4 ? vec3(0.976, 0.780, 0.310) : vec3(0.902, 0.224, 0.275); // Red / GeneBoost
  } else if (state > 0.6) {
    color = vec3(0.271, 0.482, 0.616); // Blue
  } else {
    color = vec3(0.039, 0.055, 0.090); // Empty
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private computeProgram: WebGLProgram | null = null;
  private renderProgram: WebGLProgram | null = null;
  private stateTextures: [WebGLTexture | null, WebGLTexture | null] = [null, null];
  private terrainTexture: WebGLTexture | null = null;
  private buffTexture: WebGLTexture | null = null;
  private framebuffers: [WebGLFramebuffer | null, WebGLFramebuffer | null] = [null, null];
  private currentBuffer: number = 0;
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private available: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
  }

  isAvailable(): boolean {
    return this.available;
  }

  private init(): void {
    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      console.warn('WebGL not available');
      return;
    }

    this.gl = gl;

    // Enable float textures for GPGPU
    const ext = gl.getExtension('OES_texture_float');
    if (!ext) {
      console.warn('Float textures not supported, using UNSIGNED_BYTE fallback');
    }

    this.computeProgram = this.createProgram(VERTEX_SHADER, COMPUTE_SHADER);
    this.renderProgram = this.createProgram(VERTEX_SHADER, RENDER_SHADER);

    if (!this.computeProgram || !this.renderProgram) {
      console.warn('Failed to create WebGL programs');
      return;
    }

    this.available = true;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl!;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  /**
   * Initialize textures and framebuffers for the grid
   */
  initGrid(width: number, height: number): void {
    if (!this.gl || !this.available) return;

    this.gridWidth = width;
    this.gridHeight = height;
    const gl = this.gl;

    // Create ping-pong state textures
    for (let i = 0; i < 2; i++) {
      this.stateTextures[i] = this.createDataTexture(width, height);
      this.framebuffers[i] = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.stateTextures[i], 0);
    }

    // Create terrain and buff textures
    this.terrainTexture = this.createDataTexture(width, height);
    this.buffTexture = this.createDataTexture(width, height);

    this.currentBuffer = 0;
  }

  private createDataTexture(width: number, height: number): WebGLTexture {
    const gl = this.gl!;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Use FLOAT if available, otherwise UNSIGNED_BYTE
    const type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }

  /**
   * Upload grid data to GPU textures
   */
  uploadGrid(grid: Grid): void {
    if (!this.gl || !this.available) return;
    const gl = this.gl;

    const cells = grid.getCellsArray();
    const terrain = grid.getTerrainArray();
    const buffs = grid.getBuffsArray();

    // Convert to RGBA float data
    const size = this.gridWidth * this.gridHeight;
    const stateData = new Float32Array(size * 4);
    const terrainData = new Float32Array(size * 4);
    const buffData = new Float32Array(size * 4);

    for (let i = 0; i < size; i++) {
      // State: 0=empty, 0.5=red, 0.7=blue
      stateData[i * 4] = cells[i] === CellState.RED ? 0.5 : cells[i] === CellState.BLUE ? 0.7 : 0.0;
      stateData[i * 4 + 1] = 0;
      stateData[i * 4 + 2] = 0;
      stateData[i * 4 + 3] = 1;

      // Terrain: 0=normal, 0.5=wall, 0.7=swamp
      terrainData[i * 4] = terrain[i] === TerrainType.WALL ? 0.5 : terrain[i] === TerrainType.SWAMP ? 0.7 : 0.0;
      terrainData[i * 4 + 1] = 0;
      terrainData[i * 4 + 2] = 0;
      terrainData[i * 4 + 3] = 1;

      // Buffs: 0=none, 0.5=gene_boost
      buffData[i * 4] = buffs[i] === BuffFlag.GENE_BOOST ? 0.5 : 0.0;
      buffData[i * 4 + 1] = 0;
      buffData[i * 4 + 2] = 0;
      buffData[i * 4 + 3] = 1;
    }

    // Upload to textures
    gl.bindTexture(gl.TEXTURE_2D, this.stateTextures[0]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.gridWidth, this.gridHeight, 0, gl.RGBA, gl.FLOAT, stateData);

    gl.bindTexture(gl.TEXTURE_2D, this.stateTextures[1]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.gridWidth, this.gridHeight, 0, gl.RGBA, gl.FLOAT, stateData);

    gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.gridWidth, this.gridHeight, 0, gl.RGBA, gl.FLOAT, terrainData);

    gl.bindTexture(gl.TEXTURE_2D, this.buffTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.gridWidth, this.gridHeight, 0, gl.RGBA, gl.FLOAT, buffData);
  }

  /**
   * Run one compute pass (GPGPU Game of Life step)
   */
  compute(): void {
    if (!this.gl || !this.available || !this.computeProgram) return;
    const gl = this.gl;

    const srcIdx = this.currentBuffer;
    const dstIdx = 1 - this.currentBuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[dstIdx]);
    gl.viewport(0, 0, this.gridWidth, this.gridHeight);

    gl.useProgram(this.computeProgram);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.stateTextures[srcIdx]);
    gl.uniform1i(gl.getUniformLocation(this.computeProgram, 'u_state'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
    gl.uniform1i(gl.getUniformLocation(this.computeProgram, 'u_terrain'), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.buffTexture);
    gl.uniform1i(gl.getUniformLocation(this.computeProgram, 'u_buffs'), 2);

    gl.uniform2f(gl.getUniformLocation(this.computeProgram, 'u_resolution'), this.gridWidth, this.gridHeight);

    // Draw fullscreen quad
    this.drawQuad();

    this.currentBuffer = dstIdx;
  }

  /**
   * Render the current state to the canvas
   */
  renderDisplay(): void {
    if (!this.gl || !this.available || !this.renderProgram) return;
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    gl.useProgram(this.renderProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.stateTextures[this.currentBuffer]);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_state'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.terrainTexture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_terrain'), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.buffTexture);
    gl.uniform1i(gl.getUniformLocation(this.renderProgram, 'u_buffs'), 2);

    gl.uniform2f(gl.getUniformLocation(this.renderProgram, 'u_resolution'), this.gridWidth, this.gridHeight);

    this.drawQuad();
  }

  private drawQuad(): void {
    const gl = this.gl!;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), gl.STATIC_DRAW);

    const posLoc = 0; // a_position location
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.deleteBuffer(buffer);
  }

  /**
   * Read back grid state from GPU (for stats counting)
   */
  readBackState(): { cells: Uint8Array; redCount: number; blueCount: number } {
    if (!this.gl || !this.available) {
      return { cells: new Uint8Array(0), redCount: 0, blueCount: 0 };
    }

    const gl = this.gl;
    const size = this.gridWidth * this.gridHeight;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.currentBuffer]);
    const pixels = new Float32Array(size * 4);
    gl.readPixels(0, 0, this.gridWidth, this.gridHeight, gl.RGBA, gl.FLOAT, pixels);

    const cells = new Uint8Array(size);
    let redCount = 0, blueCount = 0;

    for (let i = 0; i < size; i++) {
      const val = pixels[i * 4];
      if (val > 0.4 && val < 0.6) {
        cells[i] = CellState.RED;
        redCount++;
      } else if (val > 0.6) {
        cells[i] = CellState.BLUE;
        blueCount++;
      } else {
        cells[i] = CellState.EMPTY;
      }
    }

    return { cells, redCount, blueCount };
  }

  destroy(): void {
    if (!this.gl) return;
    for (let i = 0; i < 2; i++) {
      if (this.stateTextures[i]) this.gl.deleteTexture(this.stateTextures[i]);
      if (this.framebuffers[i]) this.gl.deleteFramebuffer(this.framebuffers[i]);
    }
    if (this.terrainTexture) this.gl.deleteTexture(this.terrainTexture);
    if (this.buffTexture) this.gl.deleteTexture(this.buffTexture);
    if (this.computeProgram) this.gl.deleteProgram(this.computeProgram);
    if (this.renderProgram) this.gl.deleteProgram(this.renderProgram);
  }
}
