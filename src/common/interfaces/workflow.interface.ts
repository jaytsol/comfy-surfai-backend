// src/common/interfaces/workflow.interface.ts

/**
 * 워크플로우의 parameter_map에 포함될 각 항목의 표준화된 구조를 정의합니다.
 * 이 구조는 UI 렌더링, 데이터 유효성 검사, 노드 매핑에 필요한 모든 정보를 포함합니다.
 */
export interface WorkflowParameterMappingItem {
  // 1. ComfyUI 노드 매핑 정보 (필수)
  node_id: string;
  input_name: string;

  // 2. UI 렌더링을 위한 정보
  label: string;
  description?: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean';
  default_value?: any;
  options?: string[];

  // 3. 데이터 유효성 검사를 위한 정보 (선택적)
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
}

/**
 * 데이터베이스에 저장되고 API를 통해 전달되는 워크플로우 템플릿의
 * 전체 데이터 구조를 정의하는 인터페이스입니다.
 * Workflow 엔티티의 공용 속성들을 포함합니다.
 */
export interface WorkflowTemplate {
  id: number;
  name: string;
  description?: string;
  /**
   * ComfyUI의 워크플로우 API 포맷 JSON 객체입니다.
   */
  definition: object;
  /**
   * 표준화된 구조를 따르는 파라미터 맵입니다.
   */
  parameter_map?: Record<string, WorkflowParameterMappingItem>;
  previewImageUrl?: string;
  tags?: string[];
  isPublicTemplate: boolean;
  isTemplate: boolean;
  ownerUserId?: number;
  sourceTemplateId?: number;
  createdAt: Date;
  updatedAt: Date;
}