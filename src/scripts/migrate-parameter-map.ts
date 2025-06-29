// comfy-surfai-backend/src/scripts/migrate-parameter-map.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { WorkflowService } from '../admin/workflow/workflow.service';
import { INestApplicationContext } from '@nestjs/common';
import { Workflow } from '../common/entities/workflow.entity';
import { UpdateWorkflowTemplateDTO } from 'src/common/dto/workflow/update-workflow-template.dto';

// --- 새로운 표준 구조 정의 ---
interface ParameterMappingItem {
  node_id: string;
  input_name: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean';
  default_value?: any;
  options?: string[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
}

// --- 변환 로직 ---
function transformParameterMap(oldMap: any): Record<string, ParameterMappingItem> {
  if (!oldMap) return {};
  const newMap: Record<string, ParameterMappingItem> = {};

  for (const key in oldMap) {
    const oldItem = oldMap[key];
    
    // 이미 새로운 구조이거나, 필수 필드가 없으면 건너뛰기
    if (!oldItem || !oldItem.node_id || !oldItem.input_name) {
        // 만약 이미 새로운 구조의 label이 있다면, 그것으로 판단
        if(oldItem.label) {
            newMap[key] = oldItem;
        }
        continue;
    }

    // Case 1: 비디오 템플릿 (중첩된 ui 객체 존재)
    if (oldItem.ui) {
      newMap[key] = {
        node_id: oldItem.node_id,
        input_name: oldItem.input_name,
        label: oldItem.ui.label || key,
        description: oldItem.ui.description || '',
        type: oldItem.ui.type || 'text',
        default_value: oldItem.ui.default_value,
        options: oldItem.ui.options,
        validation: oldItem.ui.validation,
      };
    } 
    // Case 2: 이미지 템플릿 (description만 존재)
    else {
      // key를 기반으로 label 생성 (e.g., "positive_prompt" -> "Positive Prompt")
      const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      // description에서 validation 정보 추출 (간단한 버전)
      const description = oldItem.description || '';
      const minMatch = description.match(/최소 ([\d.]+)/);
      const maxMatch = description.match(/최대 ([\d.]+)/);

      newMap[key] = {
        node_id: oldItem.node_id,
        input_name: oldItem.input_name,
        label: label,
        description: description,
        type: key.includes('prompt') ? 'textarea' : 'text', // 간단한 추론
        default_value: oldItem.default_value,
        validation: {
            min: minMatch ? parseFloat(minMatch[1]) : undefined,
            max: maxMatch ? parseFloat(maxMatch[1]) : undefined,
        }
      };
    }
  }
  return newMap;
}


// --- NestJS Standalone Application 실행 ---
async function bootstrap() {
  let app: INestApplicationContext | null = null;
  try {
    app = await NestFactory.createApplicationContext(AppModule);
    const workflowService = app.get(WorkflowService);

    console.log('Starting workflow template migration...');

    const templates = await workflowService.findAllTemplates();
    console.log(`Found ${templates.length} templates to process.`);

    for (const template of templates) {
      console.log(`Processing template #${template.id}: ${template.name}`);
      
      const originalMap = template.parameter_map;
      const newMap = transformParameterMap(originalMap);

      // JSON.stringify를 이용해 깊은 비교
      if (JSON.stringify(originalMap) === JSON.stringify(newMap)) {
        console.log(`  -> No changes needed for template #${template.id}. Skipping.`);
        continue;
      }

      console.log(`  -> Migrating parameter_map for template #${template.id}.`);
      // console.log('  Original:', JSON.stringify(originalMap, null, 2));
      // console.log('  New:', JSON.stringify(newMap, null, 2));

      const updateDto: UpdateWorkflowTemplateDTO = {
        parameter_map: newMap as any, // 타입 캐스팅 필요
      };

      // ownerUserId가 없으면 임의의 admin ID(예: 1) 또는 시스템 ID로 설정
      const adminUserId = template.ownerUserId || 1; 

      await workflowService.updateTemplate(template.id, updateDto, adminUserId);
      console.log(`  -> Successfully updated template #${template.id}.`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    if (app) {
      await app.close();
    }
    process.exit();
  }
}

bootstrap();
