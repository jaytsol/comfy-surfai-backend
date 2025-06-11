// src/common/utils/mime-type.util.ts

import * as path from 'path';

/**
 * 파일 이름(확장자 포함)을 기반으로 적절한 MIME 타입을 반환합니다.
 * @param filename 파일의 전체 이름 (예: 'image_001.png')
 * @returns 해당하는 MIME 타입 문자열 (예: 'image/png'). 모르는 타입은 'application/octet-stream'.
 */
export function getMimeType(filename: string): string {
  // path.extname으로 확장자만 추출하고, 소문자로 변환하여 비교합니다.
  const extension = path.extname(filename).toLowerCase();

  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.mp4':
      return 'video/mp4';
    // 향후 다른 비디오/이미지 타입을 지원하려면 여기에 case를 추가하면 됩니다.
    default:
      // 알 수 없는 타입은 일반적인 이진 데이터 스트림으로 처리
      return 'application/octet-stream';
  }
}
