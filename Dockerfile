# 1단계: 빌드 환경 (Builder)
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./

# ✨ devDependencies를 포함한 모든 의존성을 설치합니다. (@nestjs/cli 포함)
RUN npm install

COPY . .

# TypeScript 코드를 JavaScript로 빌드합니다.
RUN npm run build

# ✨ 프로덕션용 node_modules를 새로 생성하여 최종 이미지 크기를 최적화합니다.
RUN npm prune --production

# 2단계: 실행 환경 (Runner)
FROM node:22-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production

# 빌드 환경에서 생성된 최적화된 파일들만 복사합니다.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD [ "node", "dist/main" ]
