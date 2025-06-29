// src/common/constants/parameter-presets.ts

export interface ParameterPreset {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean';
  description: string;
  categories: string[];
  options?: string[]; // 'select' 타입일 경우 사용
}

export const PARAMETER_PRESETS: ParameterPreset[] = [
  // --- Universal Parameters ---
  {
    key: 'seed',
    label: 'Seed',
    type: 'number',
    description: '생성의 무작위성을 제어합니다. -1은 랜덤 시드를 의미합니다.',
    categories: ['image', 'video', 'audio', 'text-to-image', 'image-to-video'],
  },

  // --- Text & Image & Video Common Parameters ---
  {
    key: 'positive_prompt',
    label: 'Positive Prompt',
    type: 'textarea',
    description: '생성할 결과물의 주된 내용을 상세히 기술합니다.',
    categories: ['image', 'video', 'text-to-image', 'image-to-video'],
  },
  {
    key: 'negative_prompt',
    label: 'Negative Prompt',
    type: 'textarea',
    description: '결과물에서 피하고 싶은 요소를 기술합니다.',
    categories: ['image', 'video', 'text-to-image', 'image-to-video'],
  },
  {
    key: 'cfg',
    label: 'CFG Scale',
    type: 'number',
    description: '프롬프트를 얼마나 엄격하게 따를지 결정하는 값입니다.',
    categories: ['image', 'video', 'text-to-image'],
  },
  {
    key: 'steps',
    label: 'Steps',
    type: 'number',
    description: '결과물의 디테일을 정교화하는 단계 수입니다.',
    categories: ['image', 'video', 'text-to-image'],
  },

  // --- Image & Video Resolution ---
  {
    key: 'width',
    label: 'Width',
    type: 'number',
    description: '결과물의 가로 너비(픽셀)입니다.',
    categories: ['image', 'video', 'text-to-image', 'image-to-video'],
  },
  {
    key: 'height',
    label: 'Height',
    type: 'number',
    description: '결과물의 세로 높이(픽셀)입니다.',
    categories: ['image', 'video', 'text-to-image', 'image-to-video'],
  },
  
  // --- Sampler ---
  {
    key: 'sampler_name',
    label: 'Sampler Name',
    type: 'select',
    description: '생성에 사용할 샘플링 방식을 선택합니다.',
    categories: ['image', 'video', 'text-to-image'],
    options: ['euler', 'euler_ancestral', 'dpmpp_2m', 'dpmpp_sde', 'dpmpp_2m_sde', 'lcm'],
  },

  // --- Video-Specific Parameters ---
  {
    key: 'fps',
    label: 'FPS (Frames Per Second)',
    type: 'number',
    description: '비디오의 초당 프레임 수입니다.',
    categories: ['video', 'image-to-video'],
  },
  {
    key: 'motion_bucket_id',
    label: 'Motion Bucket ID',
    type: 'number',
    description: '비디오의 움직임 강도를 제어합니다.',
    categories: ['video', 'image-to-video'],
  },
  {
    key: 'length',
    label: 'Length (frames)',
    type: 'number',
    description: '생성될 비디오의 전체 프레임 수입니다.',
    categories: ['video', 'image-to-video'],
  },

  // --- Image-to-Video Specific ---
  {
    key: 'input_image',
    label: 'Input Image',
    type: 'text', // 실제로는 파일 업로드지만, 여기서는 경로를 텍스트로 받음
    description: '비디오 생성의 기반이 될 이미지입니다.',
    categories: ['image-to-video'],
  },
  {
    key: 'augmentation_level',
    label: 'Augmentation Level',
    type: 'number',
    description: '입력 이미지를 얼마나 변형시킬지 결정합니다.',
    categories: ['image-to-video'],
  },
];

export const WORKFLOW_CATEGORIES = [...new Set(PARAMETER_PRESETS.flatMap(p => p.categories))];
