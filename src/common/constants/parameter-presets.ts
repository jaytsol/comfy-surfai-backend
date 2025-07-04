// src/common/constants/parameter-presets.ts

import { ParameterMapCategory } from '../enums/parameter-map-category.enum';

export interface ParameterPreset {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'image';
  description: string;
  categories: ParameterMapCategory[];
  options?: string[];
  default_value?: any;
  validation?: {
    min?: number;
    max?: number | string;
    step?: number;
  };
  essentialForCategories?: ParameterMapCategory[];
}

export const PARAMETER_PRESETS: ParameterPreset[] = [
  // --- Universal Parameters ---
  {
    key: 'seed',
    label: 'Seed',
    type: 'number',
    description: '생성의 무작위성을 제어합니다. -1은 랜덤 시드를 의미합니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: -1,
    validation: {
      min: -1,
      max: '18446744073709551615', // 문자열로 처리하여 정밀도 손실 방지
      step: 1,
    },
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'batch_size',
    label: 'Batch Size',
    type: 'number',
    description: '한 번에 생성할 결과물의 개수입니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 1,
    validation: { min: 1, max: 16, step: 1 },
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'positive_prompt',
    label: 'Positive Prompt',
    type: 'textarea',
    description: '생성할 결과물의 주된 내용을 상세히 기술합니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'negative_prompt',
    label: 'Negative Prompt',
    type: 'textarea',
    description: '결과물에서 피하고 싶은 요소를 기술합니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'cfg',
    label: 'CFG Scale',
    type: 'number',
    description: '프롬프트를 얼마나 엄격하게 따를지 결정하는 값입니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 7,
    validation: { min: 0, max: 20, step: 0.5 },
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'steps',
    label: 'Steps',
    type: 'number',
    description: '결과물의 디테일을 정교화하는 단계 수입니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 25,
    validation: { min: 1, max: 100, step: 1 },
    essentialForCategories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'denoise',
    label: 'Denoise',
    type: 'number',
    description:
      '이미지 생성 과정에서 노이즈를 얼마나 제거하고 원본을 따를지 결정합니다. (0.0 ~ 1.0)',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 1.0,
    validation: { min: 0, max: 1, step: 0.05 },
  },
  {
    key: 'width',
    label: 'Width',
    type: 'number',
    description: '결과물의 가로 너비(픽셀)입니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 1024,
    validation: { min: 64, max: 4096, step: 8 },
    essentialForCategories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'height',
    label: 'Height',
    type: 'number',
    description: '결과물의 세로 높이(픽셀)입니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 1024,
    validation: { min: 64, max: 4096, step: 8 },
    essentialForCategories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'sampler_name',
    label: 'Sampler Name',
    type: 'select',
    description: '생성에 사용할 샘플링 방식을 선택합니다.',
    categories: [
      ParameterMapCategory.text_to_image,
      ParameterMapCategory.text_to_video,
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    options: [
      'euler',
      'euler_ancestral',
      'dpmpp_2m',
      'dpmpp_sde',
      'dpmpp_2m_sde',
      'lcm',
    ],
  },
  {
    key: 'scheduler',
    label: 'Scheduler',
    type: 'select',
    description: '노이즈 감소 스케줄링 방식을 선택합니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
    ],
    options: ['normal', 'karras', 'exponential', 'simple', 'ddim_uniform'],
  },
  {
    key: 'add_noise',
    label: 'Add Noise',
    type: 'boolean',
    description: '샘플링 과정에 노이즈를 추가할지 여부를 결정합니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.text_to_image,
    ],
    default_value: true,
  },
  {
    key: 'shift',
    label: 'Shift (SD3)',
    type: 'number',
    description: 'Stable Diffusion 3 모델의 고유 파라미터입니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.text_to_image,
    ],
    validation: { step: 0.1 },
  },
  {
    key: 'fps',
    label: 'FPS (Frames Per Second)',
    type: 'number',
    description: '비디오의 초당 프레임 수입니다.',
    categories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 24,
    validation: { min: 1, max: 120, step: 1 },
    essentialForCategories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'crf',
    label: 'CRF (Constant Rate Factor)',
    type: 'number',
    description:
      '비디오 압축 품질을 제어합니다. 낮을수록 품질이 높습니다. (권장: 18-28)',
    categories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
    default_value: 23,
    validation: { min: 0, max: 51, step: 1 },
  },
  {
    key: 'pingpong',
    label: 'Ping-Pong Effect',
    type: 'boolean',
    description:
      '비디오를 정방향 재생 후 역방향으로 재생하는 핑퐁 효과를 적용합니다.',
    categories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'motion_bucket_id',
    label: 'Motion Bucket ID',
    type: 'number',
    description: '비디오의 움직임 강도를 제어합니다.',
    categories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
    validation: { min: 1, step: 1 },
  },
  {
    key: 'length',
    label: 'Length (frames)',
    type: 'number',
    description: '생성될 비디오의 전체 프레임 수입니다.',
    categories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
    validation: { min: 1, step: 1 },
    essentialForCategories: [
      ParameterMapCategory.video_to_video,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'input_image',
    label: 'Input Image',
    type: 'image',
    description: '비디오 생성의 기반이 될 이미지입니다.',
    categories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
    essentialForCategories: [
      ParameterMapCategory.image_to_image,
      ParameterMapCategory.image_to_video,
    ],
  },
  {
    key: 'augmentation_level',
    label: 'Augmentation Level',
    type: 'number',
    description: '입력 이미지를 얼마나 변형시킬지 결정합니다.',
    categories: [ParameterMapCategory.image_to_video],
    validation: { min: 0, step: 0.01 },
  },
];

export const WORKFLOW_CATEGORIES = [
  ...new Set(PARAMETER_PRESETS.flatMap((p) => p.categories)),
];
