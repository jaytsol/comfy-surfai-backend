import { getMimeType } from './mime-type.util';

// describe: 여러 관련 테스트를 그룹화하는 역할입니다.
describe('getMimeType Function', () => {
  // it (또는 test): 개별 테스트 케이스 하나를 의미합니다. "이것은 ~해야 한다(it should...)" 라고 읽습니다.
  it('should return the correct MIME type for a PNG file', () => {
    // 1. 준비 (Arrange): 테스트에 필요한 변수나 상태를 준비합니다.
    const filename = 'my_image.png';

    // 2. 실행 (Act): 테스트하려는 함수를 실행합니다.
    const result = getMimeType(filename);

    // 3. 단언 (Assert): 실행 결과가 우리가 기대하는 값과 일치하는지 확인합니다.
    expect(result).toBe('image/png');
  });

  it('should return the correct MIME type for a MP4 file', () => {
    const filename = 'my_video.mp4';
    const result = getMimeType(filename);
    expect(result).toBe('video/mp4');
  });

  it('should return application/octet-stream for an unknown extension', () => {
    const filename = 'my_document.docx';
    const result = getMimeType(filename);
    expect(result).toBe('application/octet-stream');
  });

  it('should handle uppercase extensions', () => {
    const filename = 'MY_PHOTO.JPG';
    const result = getMimeType(filename);
    expect(result).toBe('image/jpeg');
  });
});
