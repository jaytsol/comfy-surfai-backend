// src/comfyui/interfaces/comfyui-workflow.interface.ts
export interface ComfyUIResponse {
  prompt_id: string;
  number: number;
  node_errors: Record<string, any>;
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
