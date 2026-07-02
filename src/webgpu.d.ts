// ============================================================
// webgpu.d.ts - WebGPU type declarations
// ============================================================

// Minimal WebGPU type declarations for TypeScript compilation
// In production, use @webgpu/types package

declare global {
  interface Navigator {
    readonly gpu: GPU;
  }

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  }

  interface GPURequestAdapterOptions {
    powerPreference?: 'low-power' | 'high-performance';
    forceFallbackAdapter?: boolean;
  }

  interface GPUAdapter {
    requestDevice(options?: GPUDeviceDescriptor): Promise<GPUDevice>;
  }

  interface GPUDeviceDescriptor {
    requiredFeatures?: Iterable<string>;
    requiredLimits?: Record<string, number>;
  }

  interface GPUDevice extends EventTarget {
    createShaderModule(descriptor: { code: string; label?: string }): GPUShaderModule;
    createComputePipeline(descriptor: any): GPUComputePipeline;
    createRenderPipeline(descriptor: any): GPURenderPipeline;
    createBuffer(descriptor: any): GPUBuffer;
    createTexture(descriptor: any): GPUTexture;
    createBindGroup(descriptor: any): GPUBindGroup;
    createBindGroupLayout(descriptor: any): GPUBindGroupLayout;
    createPipelineLayout(descriptor: any): GPUPipelineLayout;
    createCommandEncoder(descriptor?: any): GPUCommandEncoder;
    queue: GPUQueue;
    destroy(): void;
  }

  interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: ArrayBufferView, dataOffset?: number, size?: number): void;
    writeTexture(destination: any, data: ArrayBufferView, dataLayout: any, size: any): void;
    submit(commandBuffers: Iterable<GPUCommandBuffer>): void;
  }

  interface GPUShaderModule {}
  interface GPUComputePipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }
  interface GPURenderPipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }
  interface GPUBindGroupLayout {}
  interface GPUPipelineLayout {}
  interface GPUCommandBuffer {}

  interface GPUBuffer {
    destroy(): void;
    mapAsync(mode: number, offset?: number, size?: number): Promise<void>;
    getMappedRange(offset?: number, size?: number): ArrayBuffer;
    unmap(): void;
  }

  interface GPUTexture {
    createView(descriptor?: any): GPUTextureView;
    destroy(): void;
  }
  interface GPUTextureView {}

  interface GPUBindGroup {}

  interface GPUCommandEncoder {
    beginComputePass(descriptor?: any): GPUComputePassEncoder;
    beginRenderPass(descriptor: any): GPURenderPassEncoder;
    copyBufferToBuffer(source: GPUBuffer, sourceOffset: number, destination: GPUBuffer, destinationOffset: number, size: number): void;
    finish(): GPUCommandBuffer;
  }

  interface GPUComputePassEncoder {
    setPipeline(pipeline: GPUComputePipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    dispatchWorkgroups(x: number, y?: number, z?: number): void;
    end(): void;
  }

  interface GPURenderPassEncoder {
    setPipeline(pipeline: GPURenderPipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    end(): void;
  }

  interface GPUCanvasContext {
    configure(config: {
      device: GPUDevice;
      format: GPUTextureFormat;
      alphaMode?: 'opaque' | 'premultiplied';
    }): void;
    unconfigure(): void;
    getCurrentTexture(): GPUTexture;
  }

  type GPUTextureFormat = 'rgba8unorm' | 'bgra8unorm' | string;

  declare const GPUBufferUsage: {
    readonly MAP_READ: number;
    readonly MAP_WRITE: number;
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly INDEX: number;
    readonly VERTEX: number;
    readonly UNIFORM: number;
    readonly STORAGE: number;
    readonly INDIRECT: number;
    readonly QUERY_RESOLVE: number;
  };

  declare const GPUMapMode: {
    readonly READ: number;
    readonly WRITE: number;
  };

  declare const GPUTextureUsage: {
    readonly COPY_SRC: number;
    readonly COPY_DST: number;
    readonly TEXTURE_BINDING: number;
    readonly STORAGE_BINDING: number;
    readonly RENDER_ATTACHMENT: number;
  };
}

export {};
