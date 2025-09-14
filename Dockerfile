# 1단계: 빌드 환경 (Builder)
FROM node:22-alpine AS builder
WORKDIR /usr/src/app

# --- Start of Locale/Encoding Fix ---
# Install libc6-compat for glibc compatibility (if needed by some Node.js modules)
# Remove locales package and locale-gen command as they are not standard in Alpine
RUN apk add --no-cache libc6-compat \
    && rm -rf /var/cache/apk/*

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
# --- End of Locale/Encoding Fix ---

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

# --- Start of Locale/Encoding Fix for Runner ---
# Ensure locale settings are also applied to the runner image
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8
# --- End of Locale/Encoding Fix for Runner ---

# 빌드 환경에서 생성된 최적화된 파일들만 복사합니다.
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000
CMD [ "node", "dist/main" ]
