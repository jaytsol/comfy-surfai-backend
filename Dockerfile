# 1단계: 빌드 환경 (Builder)
# Node.js 버전을 22.x LTS 버전으로 변경합니다. 'alpine'은 경량화된 리눅스 버전입니다.
FROM node:22-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 의존성 설치를 위해 package.json 파일들을 먼저 복사합니다.
COPY package*.json ./

# 프로덕션 의존성만 설치하여 빌드 시간을 단축합니다.
RUN npm ci --only=production

# 소스 코드 전체를 복사합니다.
COPY . .

# TypeScript 코드를 JavaScript로 빌드합니다.
RUN npm run build

# 2단계: 실행 환경 (Runner)
# 빌드 환경과 동일한 버전의 Node.js를 사용하여 일관성을 유지합니다.
FROM node:22-alpine

WORKDIR /usr/src/app

# NestJS 앱은 프로덕션 모드에서 실행하는 것이 좋습니다.
ENV NODE_ENV=production

# 빌드 환경에서 생성된 node_modules와 최적화된 dist 폴더만 복사합니다.
# 이렇게 하면 최종 이미지의 용량이 매우 작아집니다.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# 3000번 포트를 외부에 노출시킵니다.
EXPOSE 3000

# 컨테이너가 시작될 때 실행될 명령어
CMD [ "node", "dist/main" ]
