# 배포 가이드 (Deployment Guide)

## 🚀 로컬 개발 환경 시작

### Master 노드 시작
```bash
pm2 start ecosystem.config.cjs
```

### Slave 노드 시작
```bash
SLAVE_ID=1 PORT=3001 DEVICE_TYPE=solar MASTER_HOST=localhost MASTER_PORT=5020 UPDATE_INTERVAL=3000 node src/slave.js > /tmp/slave1.log 2>&1 &
SLAVE_ID=2 PORT=3002 DEVICE_TYPE=wind MASTER_HOST=localhost MASTER_PORT=5020 UPDATE_INTERVAL=3000 node src/slave.js > /tmp/slave2.log 2>&1 &
SLAVE_ID=3 PORT=3003 DEVICE_TYPE=bms MASTER_HOST=localhost MASTER_PORT=5020 UPDATE_INTERVAL=3000 node src/slave.js > /tmp/slave3.log 2>&1 &
```

## 🔧 문제 해결

### Slave 404 오류 해결
Slave 노드에서 assets 파일이 404를 반환하는 경우:

1. **포트 정리**
```bash
pkill -f "node src/slave.js"
fuser -k 3001/tcp 3002/tcp 3003/tcp
```

2. **Slave 재시작**
위의 Slave 노드 시작 명령어 실행

3. **확인**
```bash
curl -I http://localhost:3001/assets/css/materialize.min.css
```

### 필수 체크리스트
- ✅ Assets 디렉토리 존재: `/home/user/webapp/public/assets/`
- ✅ Slave 웹서버가 `/assets` 경로를 express.static으로 서빙
- ✅ 포트 충돌 없음 (3001, 3002, 3003)
- ✅ Slave 로그 확인: `cat /tmp/slave1.log`

## 🌐 폐쇄망 환경

### 완전한 오프라인 동작
- 모든 CDN 자산이 로컬 번들 (~1.3MB)
- `/public/assets/` 디렉토리에 모든 파일 포함
- 외부 인터넷 연결 불필요

### 로컬 자산 목록
```
public/assets/
├── css/
│   └── materialize.min.css
├── js/
│   ├── materialize.min.js
│   └── chart.min.js
└── fonts/
    ├── material-icons.css
    ├── material-icons.ttf
    ├── roboto.css
    ├── roboto-300.ttf
    ├── roboto-400.ttf
    ├── roboto-500.ttf
    └── roboto-700.ttf
```

## 📊 서비스 URL

- **Master**: http://localhost:3000
- **Slave 1 (Solar)**: http://localhost:3001
- **Slave 2 (Wind)**: http://localhost:3002
- **Slave 3 (BMS)**: http://localhost:3003

## 🔐 기본 설정

- **관리자 비밀번호**: `admin123`
- **Modbus 포트**: 5020
- **업데이트 주기**: 3000ms (3초)
