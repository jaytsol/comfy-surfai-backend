// src/common/interfaces/comfyui-workflow.interface.ts
export interface ComfyUIOutputFile {
  filename: string;
  subfolder: string;
  type: 'output' | 'temp' | 'input';
  // 비디오의 경우 추가적인 포맷 정보가 있을 수 있습니다.
  format?: string;
}

export interface ComfyUIResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, any>;
  output?: {
    images?: ComfyUIOutputFile[];
    gifs?: ComfyUIOutputFile[];
  };
}

export interface GenerationResult {
  prompt_id: string;
  outputs: { id: number; r2Url: string }[];
}

export interface ComfyUIResult {
  success: boolean;
  message: string;
  data: ComfyUIResponse;
}

export interface ComfyUIInput {
  seed?: number;
  steps?: number;
  cfg?: number;
  sampler_name?: string;
  scheduler?: string;
  denoise?: number;
  model?: [string, number];
  positive?: [string, number];
  negative?: [string, number];
  latent_image?: [string, number];
  ckpt_name?: string;
  width?: number;
  height?: number;
  batch_size?: number;
  text?: string;
  clip?: [string, number];
  samples?: [string, number];
  vae?: [string, number];
  filename_prefix?: string;
  images?: [string, number];
}

export interface ComfyUINode {
  inputs: ComfyUIInput;
  class_type: string;
  _meta?: {
    title: string;
  };
}

export interface ComfyUIWorkflow {
  [key: string]: ComfyUINode;
}

export interface ComfyUIWebSocketMessage {
  type: string;
  data: ComfyUIResponse;
}
