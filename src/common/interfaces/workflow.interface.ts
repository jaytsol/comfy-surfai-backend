/**
 * 워크플로우의 동적 파라미터에 대한 UI 렌더링 정보를 정의합니다.
 */
export interface WorkflowParameterUIConfig {
  type: 'text' | 'number' | 'textarea' | 'checkbox' | 'select';
  label?: string;
  description?: string;
  options?: string[];
  placeholder?: string;
}

/**
 * 워크플로우의 parameter_map에 포함될 각 항목의 구조를 정의합니다.
 */
export interface WorkflowParameterMappingItem {
  node_id: string;
  input_name: string;
  ui?: WorkflowParameterUIConfig;
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
   * ComfyUI의 원본 워크플로우 API 포맷 JSON 객체입니다.
   * 이 속성은 템플릿의 경우 반드시 존재해야 합니다.
   */
  definition: object;
  parameter_map?: Record<string, WorkflowParameterMappingItem>;
  previewImageUrl?: string;
  tags?: string[];

  // ✨ --- 오류 해결을 위해 Workflow 엔티티의 속성들을 추가합니다 --- ✨
  isPublicTemplate: boolean;
  isTemplate: boolean;
  ownerUserId?: number;
  sourceTemplateId?: number;
  createdAt: Date;
  updatedAt: Date;
}
