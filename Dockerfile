FROM node:18-alpine

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install --production

# 소스 코드 복사
COPY src ./src
COPY public ./public

# 포트 노출
EXPOSE 3000
EXPOSE 502

# 애플리케이션 실행
CMD ["node", "src/index.js"]
