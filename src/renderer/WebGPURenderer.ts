// ============================================================
// WebGPURenderer.ts - WebGPU GPGPU renderer (next-gen GPU compute)
// ============================================================

import { Grid } from '../engine/Grid';
import { CellState, TerrainType, BuffFlag } from '../Types';

// WGSL Compute shader for Game of Life
const GOL_COMPUTE_SHADER = `
struct Params {
  width: u32,
  height: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> currentState: array<f32>;
@group(0) @binding(2) var<storage, read_write> nextState: array<f32>;
@group(0) @binding(3) var<storage, read> terrain: array<f32>;
@group(0) @binding(4) var<storage, read> buffs: array<f32>;

fn getIndex(x: i32, y: i32) -> u32 {
  return u32(y) * params.width + u32(x);
}

fn countNeighbors(cells: array<f32>, cx: i32, cy: i32, targetState: f32) -> u32 {
  var count: u32 = 0u;
  for (var dy: i32 = -1; dy <= 1; dy = dy + 1) {
    for (var dx: i32 = -1; dx <= 1; dx = dx + 1) {
      if (dx == 0 && dy == 0) { continue; }
      let nx = cx + dx;
      let ny = cy + dy;
      if (nx >= 0 && nx < i32(params.width) && ny >= 0 && ny < i32(params.height)) {
        let n = cells[getIndex(nx, ny)];
        if (abs(n - targetState) < 0.1) {
          count = count + 1u;
        }
      }
    }
  }
  return count;
}

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = i32(gid.x);
  let y = i32(gid.y);

  if (x >= i32(params.width) || y >= i32(params.height)) { return; }

  let idx = getIndex(x, y);
  let current = currentState[idx];
  let t = terrain[idx];
  let buff = buffs[idx];

  // Wall terrain
  if (t > 0.4 && t < 0.6) {
    nextState[idx] = 0.0;
    return;
  }

  let redN = countNeighbors(currentState, x, y, 0.5);
  let blueN = countNeighbors(currentState, x, y, 0.7);
  let isSwamp = t > 0.6;
  let birthCount: u32 = if isSwamp { 4u } else { 3u };
  let survMax: u32 = if buff > 0.4 { 4u } else { 3u };

  var newState: f32 = 0.0;

  if (current > 0.1) {
    // Alive - check survival
    let sameN = if current < 0.6 { redN } else { blueN };
    if (sameN >= 2u && sameN <= survMax) {
      newState = current;
    }
  } else {
    // Empty - check reproduction
    let redBirth = redN == birthCount;
    let blueBirth = blueN == birthCount;
    if (redBirth && blueBirth) {
      newState = if redN > blueN { 0.5 } else if blueN > redN { 0.7 } else { 0.5 };
    } else if (redBirth) {
      newState = 0.5;
    } else if (blueBirth) {
      newState = 0.7;
    }
  }

  nextState[idx] = newState;
}
`;

// Render shader (fullscreen quad with color mapping)
const RENDER_SHADER = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) texCoord: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) idx: u32) -> VertexOutput {
  var pos = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0),
  );
  var output: VertexOutput;
  output.position = vec4(pos[idx], 0.0, 1.0);
  output.texCoord = pos[idx] * 0.5 + 0.5;
  return output;
}

struct Params {
  width: u32,
  height: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var stateTex: texture_2d<f32>;
@group(0) @binding(2) var stateSampler: sampler;

@fragment
fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
  let coord = vec2<i32>(input.texCoord * vec2<f32>(f32(params.width), f32(params.height)));
  let state = textureLoad(stateTex, coord, 0).r;

  var color: vec3<f32>;
  if (state > 0.4 && state < 0.6) {
    color = vec3(0.902, 0.224, 0.275); // Red
  } else if (state > 0.6) {
    color = vec3(0.271, 0.482, 0.616); // Blue
  } else {
    color = vec3(0.039, 0.055, 0.090); // Empty
  }
  return vec4(color, 1.0);
}
`;

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private renderPipeline: GPURenderPipeline | null = null;
  private stateBuffers: [GPUBuffer | null, GPUBuffer | null] = [null, null];
  private terrainBuffer: GPUBuffer | null = null;
  private buffBuffer: GPUBuffer | null = null;
  private stateTextures: [GPUTexture | null, GPUTexture | null] = [null, null];
  private bindGroups: [GPUBindGroup | null, GPUBindGroup | null] = [null, null];
  private paramBuffer: GPUBuffer | null = null;
  private currentBuffer: number = 0;
  private gridWidth: number = 0;
  private gridHeight: number = 0;
  private available: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async init(): Promise<boolean> {
    if (!('gpu' in navigator)) {
      console.warn('WebGPU not supported');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.warn('No WebGPU adapter found');
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu') as unknown as GPUCanvasContext;

      if (!this.context) {
        console.warn('Failed to get WebGPU context');
        return false;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: format,
        alphaMode: 'opaque',
      });

      // Create compute pipeline
      const computeModule = this.device.createShaderModule({ code: GOL_COMPUTE_SHADER });
      this.computePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module: computeModule, entryPoint: 'main' },
      });

      // Create render pipeline
      const renderModule = this.device.createShaderModule({ code: RENDER_SHADER });
      this.renderPipeline = this.device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: renderModule, entryPoint: 'vs' },
        fragment: {
          module: renderModule,
          entryPoint: 'fs',
          targets: [{ format }],
        },
        primitive: { topology: 'triangle-list' },
      });

      this.available = true;
      return true;
    } catch (err) {
      console.warn('WebGPU init failed:', err);
      return false;
    }
  }

  /**
   * Initialize GPU buffers for the grid
   */
  initGrid(width: number, height: number): void {
    if (!this.device || !this.available) return;
    const device = this.device;

    this.gridWidth = width;
    this.gridHeight = height;
    const size = width * height;
    const byteSize = size * 4; // f32

    // Create storage buffers (ping-pong)
    for (let i = 0; i < 2; i++) {
      this.stateBuffers[i] = device.createBuffer({
        size: byteSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
      });
    }

    this.terrainBuffer = device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.buffBuffer = device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Parameter uniform buffer
    this.paramBuffer = device.createBuffer({
      size: 16, // 2 x u32 padded
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create state textures for rendering
    for (let i = 0; i < 2; i++) {
      this.stateTextures[i] = device.createTexture({
        size: { width, height },
        format: 'r32float',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING,
      });
    }

    // Create bind groups for compute (one for each ping-pong direction)
    for (let i = 0; i < 2; i++) {
      const src = i;
      const dst = 1 - i;
      this.bindGroups[i] = device.createBindGroup({
        layout: this.computePipeline!.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.paramBuffer! } },
          { binding: 1, resource: { buffer: this.stateBuffers[src]! } },
          { binding: 2, resource: { buffer: this.stateBuffers[dst]! } },
          { binding: 3, resource: { buffer: this.terrainBuffer! } },
          { binding: 4, resource: { buffer: this.buffBuffer! } },
        ],
      });
    }

    this.currentBuffer = 0;
  }

  /**
   * Upload grid data to GPU
   */
  uploadGrid(grid: Grid): void {
    if (!this.device || !this.available) return;

    const cells = grid.getCellsArray();
    const terrain = grid.getTerrainArray();
    const buffs = grid.getBuffsArray();
    const size = this.gridWidth * this.gridHeight;

    const stateData = new Float32Array(size);
    const terrainData = new Float32Array(size);
    const buffData = new Float32Array(size);

    for (let i = 0; i < size; i++) {
      stateData[i] = cells[i] === CellState.RED ? 0.5 : cells[i] === CellState.BLUE ? 0.7 : 0.0;
      terrainData[i] = terrain[i] === TerrainType.WALL ? 0.5 : terrain[i] === TerrainType.SWAMP ? 0.7 : 0.0;
      buffData[i] = buffs[i] === BuffFlag.GENE_BOOST ? 0.5 : 0.0;
    }

    this.device.queue.writeBuffer(this.stateBuffers[0]!, 0, stateData);
    this.device.queue.writeBuffer(this.stateBuffers[1]!, 0, stateData);
    this.device.queue.writeBuffer(this.terrainBuffer!, 0, terrainData);
    this.device.queue.writeBuffer(this.buffBuffer!, 0, buffData);

    // Upload params
    const params = new Uint32Array([this.gridWidth, this.gridHeight]);
    this.device.queue.writeBuffer(this.paramBuffer!, 0, params);
  }

  /**
   * Run one compute pass
   */
  compute(): void {
    if (!this.device || !this.computePipeline || !this.available) return;

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.computePipeline);
    pass.setBindGroup(0, this.bindGroups[this.currentBuffer]!);
    pass.dispatchWorkgroups(
      Math.ceil(this.gridWidth / 16),
      Math.ceil(this.gridHeight / 16)
    );
    pass.end();

    this.device.queue.submit([encoder.finish()]);
    this.currentBuffer = 1 - this.currentBuffer;
  }

  /**
   * Render to canvas
   */
  renderDisplay(): void {
    if (!this.device || !this.renderPipeline || !this.context || !this.available) return;

    // Note: Full render pipeline requires texture sampling setup
    // For now we use a simplified read-back + canvas2d approach
    // In production, you'd set up the full render pipeline with textures

    // For the compute-only path, we read back results and render via Canvas 2D
    // This is still extremely fast since the compute is on GPU
  }

  /**
   * Read back state for statistics
   */
  async readBackState(): Promise<{ cells: Uint8Array; redCount: number; blueCount: number }> {
    if (!this.device || !this.available) {
      return { cells: new Uint8Array(0), redCount: 0, blueCount: 0 };
    }

    const size = this.gridWidth * this.gridHeight;
    const byteSize = size * 4;

    const readBuffer = this.device.createBuffer({
      size: byteSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(
      this.stateBuffers[this.currentBuffer]!, 0,
      readBuffer, 0,
      byteSize
    );
    this.device.queue.submit([encoder.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const data = new Float32Array(readBuffer.getMappedRange());

    const cells = new Uint8Array(size);
    let redCount = 0, blueCount = 0;

    for (let i = 0; i < size; i++) {
      if (data[i] > 0.4 && data[i] < 0.6) {
        cells[i] = CellState.RED;
        redCount++;
      } else if (data[i] > 0.6) {
        cells[i] = CellState.BLUE;
        blueCount++;
      }
    }

    readBuffer.unmap();
    readBuffer.destroy();

    return { cells, redCount, blueCount };
  }

  destroy(): void {
    for (let i = 0; i < 2; i++) {
      this.stateBuffers[i]?.destroy();
      this.stateTextures[i]?.destroy();
    }
    this.terrainBuffer?.destroy();
    this.buffBuffer?.destroy();
    this.paramBuffer?.destroy();
  }
}
