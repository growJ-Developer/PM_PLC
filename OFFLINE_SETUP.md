# 폐쇄망 환경 설치 가이드

본 프로젝트는 외부 네트워크 없이 완전히 오프라인 환경에서 동작할 수 있도록 설계되었습니다.

## 📦 포함된 로컬 자산

모든 외부 CDN 의존성이 로컬 파일로 포함되어 있습니다:

### CSS 라이브러리
- `public/assets/css/materialize.min.css` (139KB) - Material Design CSS 프레임워크

### JavaScript 라이브러리
- `public/assets/js/materialize.min.js` (177KB) - Materialize 컴포넌트
- `public/assets/js/chart.min.js` (201KB) - Chart.js 차트 라이브러리

### 폰트 파일
- `public/assets/fonts/roboto-300.ttf` (111KB) - Roboto Light
- `public/assets/fonts/roboto-400.ttf` (111KB) - Roboto Regular
- `public/assets/fonts/roboto-500.ttf` (111KB) - Roboto Medium
- `public/assets/fonts/roboto-700.ttf` (111KB) - Roboto Bold
- `public/assets/fonts/material-icons.ttf` (349KB) - Material Icons
- `public/assets/fonts/roboto.css` - Roboto 폰트 정의
- `public/assets/fonts/material-icons.css` - Material Icons 정의

**총 용량**: 약 1.3MB

## 🚀 폐쇄망 환경 설치 절차

### 1. 프로젝트 파일 전송
```bash
# USB 또는 다른 매체를 통해 전체 프로젝트 디렉토리를 폐쇄망 서버로 전송
scp -r webapp/ user@closed-network-server:/path/to/destination/
```

### 2. Node.js 설치 (사전 준비 필요)
폐쇄망 환경에서는 Node.js를 미리 설치해야 합니다.

**권장 버전**: Node.js v18.x 이상

오프라인 설치 방법:
- 외부 네트워크가 있는 환경에서 Node.js 바이너리를 다운로드
- USB로 폐쇄망 서버로 전송
- 설치 진행

### 3. npm 의존성 설치

#### 방법 A: 온라인 환경에서 준비 (권장)
```bash
# 온라인 환경에서 node_modules 패키징
cd webapp
npm install
tar -czf node_modules.tar.gz node_modules/

# USB로 전송 후 폐쇄망 환경에서 압축 해제
tar -xzf node_modules.tar.gz
```

#### 방법 B: npm 캐시 활용
```bash
# 온라인 환경에서
cd webapp
npm install
npm cache clean --force
npm cache verify

# ~/.npm 디렉토리를 패키징하여 전송
tar -czf npm-cache.tar.gz ~/.npm

# 폐쇄망 환경에서
tar -xzf npm-cache.tar.gz -C ~/
cd webapp
npm install --offline
```

### 4. 애플리케이션 실행

#### Master 노드 실행
```bash
cd webapp
npm run dev:master
# 또는
NODE_MODE=master node src/index.js
```

#### Slave 노드 실행
```bash
# Slave 1 (Solar)
NODE_MODE=slave SLAVE_ID=1 DEVICE_TYPE=solar MASTER_HOST=<master_ip> MASTER_PORT=5020 node src/index.js

# Slave 2 (Wind)
NODE_MODE=slave SLAVE_ID=2 DEVICE_TYPE=wind MASTER_HOST=<master_ip> MASTER_PORT=5020 node src/index.js

# Slave 3 (BMS)
NODE_MODE=slave SLAVE_ID=3 DEVICE_TYPE=bms MASTER_HOST=<master_ip> MASTER_PORT=5020 node src/index.js
```

#### PM2로 백그라운드 실행 (권장)
```bash
# PM2 설치 (온라인 환경에서 미리 패키징 필요)
npm install -g pm2

# Master 실행
pm2 start ecosystem.config.cjs

# Slave 실행
pm2 start src/index.js --name slave1 -- NODE_MODE=slave SLAVE_ID=1 DEVICE_TYPE=solar
pm2 start src/index.js --name slave2 -- NODE_MODE=slave SLAVE_ID=2 DEVICE_TYPE=wind
pm2 start src/index.js --name slave3 -- NODE_MODE=slave SLAVE_ID=3 DEVICE_TYPE=bms
```

## 🌐 접속 방법

### Master UI
```
http://<master_ip>:3000
```

### Slave UI
```
http://<slave_ip>:3001  # Slave 1
http://<slave_ip>:3002  # Slave 2
http://<slave_ip>:3003  # Slave 3
```

## 🔧 네트워크 설정

### 포트 요구사항
- **Master HTTP**: 3000 (Web UI)
- **Master Modbus**: 5020 (Slave 통신)
- **Slave HTTP**: 3001-3003 (각 Slave Web UI)

### 방화벽 설정
```bash
# Master 서버
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --add-port=5020/tcp --permanent
firewall-cmd --reload

# Slave 서버
firewall-cmd --add-port=3001-3003/tcp --permanent
firewall-cmd --reload
```

## ✅ 오프라인 동작 확인

### 1. 브라우저 개발자 도구 확인
1. Master UI 접속 (http://master_ip:3000)
2. F12 → Network 탭 열기
3. 페이지 새로고침
4. **외부 요청 없음 확인** (모든 리소스가 로컬에서 로드)

### 2. 로컬 리소스 로드 확인
다음 리소스들이 모두 로컬에서 로드되어야 합니다:
- `/assets/css/materialize.min.css`
- `/assets/js/materialize.min.js`
- `/assets/js/chart.min.js`
- `/assets/fonts/roboto.css`
- `/assets/fonts/material-icons.css`
- `/app.js`

### 3. 기능 테스트
- ✅ Master UI에서 6개 차트 표시
- ✅ 실시간 데이터 업데이트
- ✅ Slave UI 접속 및 차트 표시
- ✅ Slave 전원 제어 기능
- ✅ 비밀번호 변경 기능

## 📋 필요한 npm 패키지

폐쇄망 환경에서 필요한 패키지 목록:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "modbus-serial": "^8.0.13",
    "ws": "^8.14.2"
  }
}
```

**총 용량**: 약 10MB (node_modules 포함)

## 🚨 트러블슈팅

### 문제: 폰트가 표시되지 않음
**해결**: 브라우저 캐시를 삭제하고 페이지 새로고침 (Ctrl+F5)

### 문제: 차트가 표시되지 않음
**해결**:
1. 브라우저 개발자 도구 → Console 탭 확인
2. `/assets/js/chart.min.js` 로드 확인
3. JavaScript 에러 확인

### 문제: Material Icons가 표시되지 않음
**해결**:
1. `/assets/fonts/material-icons.ttf` 파일 존재 확인
2. `/assets/fonts/material-icons.css` 로드 확인
3. 브라우저에서 폰트 차단 설정 확인

### 문제: Slave가 Master에 연결되지 않음
**해결**:
1. 네트워크 연결 확인: `ping <master_ip>`
2. 방화벽 포트 5020 확인
3. Master 로그 확인: `pm2 logs power-master`
4. Slave 로그 확인: `tail -f /tmp/slave1.log`

## 📝 시스템 요구사항

### 최소 사양
- **CPU**: 1 Core
- **RAM**: 512MB
- **Disk**: 100MB
- **OS**: Linux, Windows, macOS

### 권장 사양
- **CPU**: 2 Core 이상
- **RAM**: 1GB 이상
- **Disk**: 500MB 이상
- **네트워크**: 100Mbps 이상

## 🔐 보안 권장사항

1. **기본 비밀번호 변경**: 최초 로그인 후 `admin123`을 변경하세요
2. **방화벽 설정**: 필요한 포트만 개방
3. **HTTPS 적용**: 프로덕션 환경에서는 리버스 프록시(Nginx) + SSL 인증서 사용 권장

## 📚 추가 문서

- `README.md` - 프로젝트 개요 및 기능 설명
- `package.json` - 의존성 및 스크립트
- `ecosystem.config.cjs` - PM2 설정

## 💡 도움말

문제가 발생하면 다음을 확인하세요:
1. Node.js 버전: `node --version` (v18.x 이상)
2. npm 버전: `npm --version` (v9.x 이상)
3. 포트 사용 확인: `netstat -tuln | grep -E '3000|5020'`
4. 프로세스 확인: `pm2 list`
5. 로그 확인: `pm2 logs`

---

**Last Updated**: 2026-01-22
**Version**: 5.1 (Offline Support)
