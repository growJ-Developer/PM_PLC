# Docker 재빌드 가이드

## ⚠️ 중요: 리소스 404 해결을 위한 Docker 재빌드 필수

Dockerfile.slave가 수정되어 `public/assets/` 디렉토리가 이제 포함됩니다.
**반드시 Docker 이미지를 재빌드**해야 합니다.

## 🔄 Docker 재빌드 방법

### 1. 기존 컨테이너 중지 및 제거
```bash
cd /home/user/webapp
docker-compose down
```

### 2. 이미지 재빌드 (캐시 사용 안 함)
```bash
docker-compose build --no-cache
```

### 3. 서비스 시작
```bash
docker-compose up -d
```

### 4. 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# Slave 1 로그만
docker-compose logs -f slave1
```

### 5. 동작 확인
```bash
# Slave 1 assets 확인
curl -I http://localhost:3001/assets/css/materialize.min.css

# 200 OK가 반환되어야 함
```

## 🐛 문제 해결

### 여전히 404가 발생하는 경우

1. **컨테이너 내부 확인**
```bash
docker exec -it power-control-slave1 ls -la /app/public/assets/
```

예상 출력:
```
drwxr-xr-x    5 root     root          4096 Jan 28 08:00 .
drwxr-xr-x    3 root     root          4096 Jan 28 08:00 ..
drwxr-xr-x    2 root     root          4096 Jan 28 08:00 css
drwxr-xr-x    2 root     root          4096 Jan 28 08:00 fonts
drwxr-xr-x    2 root     root          4096 Jan 28 08:00 js
```

2. **이미지 완전 삭제 후 재빌드**
```bash
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

3. **볼륨 및 네트워크 완전 정리**
```bash
docker-compose down -v
docker system prune -af
docker-compose build --no-cache
docker-compose up -d
```

## 📝 변경 내역

### Dockerfile.slave 수정사항
```dockerfile
# 이전 (assets 디렉토리 누락)
COPY src ./src
COPY public/slave ./public/slave

# 수정 후 (assets 디렉토리 포함)
COPY src ./src
COPY public/slave ./public/slave
COPY public/assets ./public/assets  # ✅ 추가됨
```

### docker-compose.yml 수정사항
```yaml
# 각 Slave 서비스에 PORT 환경변수 추가
environment:
  - PORT=3001  # slave1
  - PORT=3002  # slave2
  - PORT=3003  # slave3
```

## ✅ 최종 확인

모든 assets가 정상적으로 로드되는지 확인:
```bash
curl -I http://localhost:3001/assets/fonts/material-icons.css
curl -I http://localhost:3001/assets/fonts/roboto.css
curl -I http://localhost:3001/assets/css/materialize.min.css
curl -I http://localhost:3001/assets/js/materialize.min.js
curl -I http://localhost:3001/assets/js/chart.min.js
```

모두 `HTTP/1.1 200 OK`를 반환해야 합니다.
