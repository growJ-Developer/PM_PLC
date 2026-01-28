# 전력제어시스템 (Power Control System) v5.2

발전소와 관제소 간의 전력을 제어하고 모니터링하기 위한 Modbus 기반 시스템입니다.

## 🎨 v5.2 최신 업데이트 (완료)

### 🌐 폐쇄망 환경 지원 완료
- ✅ **모든 CDN 자산 로컬화** (~1.3MB)
- ✅ **Materialize CSS/JS** - /assets/css, /assets/js
- ✅ **Chart.js** - 로컬 번들 포함
- ✅ **Material Icons & Roboto 폰트** - TTF 파일 포함
- ✅ **완전한 오프라인 동작** - 인터넷 연결 불필요
- ✅ **CORS 헤더 추가** - 외부 접근 지원
- ✅ **캐싱 최적화** - max-age=31536000 (1년)

### 🔌 Slave 노드 독립 동작
- ✅ **독립 전원 제어** - 각 Slave가 자체 ON/OFF 제어
- ✅ **Master-Slave 제어 제거** - Master는 읽기 전용 모니터링
- ✅ **실시간 상태 반영** - Slave OFF 시 즉시 Master에 Offline 표시
- ✅ **비밀번호 보호** - 전원 제어 시 관리자 인증 필요

## 🎨 v3.0 업데이트 (완료)

### 🌑 다크 테마 적용
- Master & Slave 모두 어두운 계열 디자인
- 눈의 피로를 줄이는 배색
- 고대비 UI로 가독성 향상
- Material Design 기반 다크 모드

### 📺 1920x1080 최적화 (완료)
- ✅ 16:9 비율 Full HD 완벽 지원
- ✅ **스크롤 완전 제거** - overflow: hidden 적용
- ✅ 고정 높이 레이아웃 (height: calc(100vh - 180px))
- ✅ 차트/테이블 영역 자동 크기 조정
- ✅ 모든 컨텐츠가 화면 내에 표시됨

### 🔐 비밀번호 변경 기능 (완료)
- ✅ 관리자 비밀번호 변경 UI 추가
- ✅ 현재 비밀번호 검증
- ✅ 새 비밀번호 확인 검증
- ✅ 로컬 스토리지 저장 (브라우저 재시작 후에도 유지)
- ✅ 최소 4자 이상 비밀번호 정책
- ✅ 서버 API 연동 (`/api/admin/change-password`)

## 🌐 공개 URL (실시간 테스트 가능)

### Master 노드 (다크 테마 + 스크롤 없음)
- **웹 UI**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **기본 비밀번호**: `admin123`
- **해상도**: 1920x1080 최적화

### Slave 노드 (다크 테마 + 스크롤 없음)
- **Slave 1 (Solar)**: https://3001-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **Slave 2 (Wind)**: https://3002-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **Slave 3 (BMS)**: https://3003-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **해상도**: 1920x1080 최적화

## 🎯 완성된 기능

### UI/UX
✅ **다크 테마** - 어두운 배경 (#0a0e1a) + 고대비 텍스트  
✅ **1920x1080 최적화** - 스크롤 완전 제거 (overflow: hidden)  
✅ **Material Design** - Google 디자인 가이드라인 준수  
✅ **탭 기반 UI** - 대시보드, 차트, 슬레이브 관리, 분석  
✅ **반응형 차트** - 고정 높이로 스크롤 제거  
✅ **컴팩트 레이아웃** - 모든 정보가 한 화면에 표시  

### 보안
✅ **비밀번호 변경** - 관리자 비밀번호 실시간 변경  
✅ **비밀번호 검증** - 현재/새/확인 비밀번호 확인  
✅ **로컬 저장** - 브라우저 로컬 스토리지 저장  
✅ **Slave 제어 보호** - 비밀번호 확인 후 제어  

### 데이터
✅ **확장 데이터** - 전력, 외기온도, 내부온도, 구동시간  
✅ **실시간 업데이트** - WebSocket 기반  
✅ **통계 계산** - 총/평균/장치별 자동 집계  

### 차트
✅ **7가지 차트** - 라인, 파이, 바, 온도, 레이더, 버블  
✅ **다크 테마 차트** - Chart.js 다크 모드 설정  
✅ **스크롤 없는 차트** - 고정 높이 레이아웃  

### 아키텍처
✅ **Modbus TCP** - 실제 프로토콜 통신  
✅ **개별 Dockerfile** - Master/Slave 분리  
✅ **Docker Compose** - 통합 관리  
✅ **Slave 웹서버** - 각 Slave 독립 UI  

## 📊 현재 상태 (v5.2 완료)

```
✅ Master 노드 (포트 3000, 5020)
   ├── 🌑 다크 테마 UI (완료)
   ├── 📺 1920x1080 최적화 (완료)
   ├── 🔐 비밀번호 변경 기능 (완료)
   ├── 📈 스크롤 없는 차트 (완료)
   ├── 📖 읽기 전용 모니터링 (완료)
   └── 🎯 모든 기능 정상 동작

✅ Slave 노드들 (포트 3001, 3002, 3003)
   ├── 🌑 다크 테마 UI (완료)
   ├── 📺 1920x1080 최적화 (완료)
   ├── 🌐 독립 웹 서버 (완료)
   ├── 🔌 독립 전원 제어 (완료)
   ├── 🌍 폐쇄망 환경 지원 (완료)
   └── 📊 실시간 데이터 전송 (완료)
```

## 🎨 디자인 시스템

### 색상 팔레트 (다크 테마)
```css
배경:
  - 주 배경: #0a0e1a
  - 보조 배경: #141824
  - 카드 배경: #1a1f35

텍스트:
  - 주 텍스트: #e0e0e0
  - 보조 텍스트: #9e9e9e

강조색:
  - Blue: #2196f3
  - Green: #4caf50
  - Orange: #ff9800
  - Red: #f44336
  - Purple: #9c27b0
```

### 레이아웃 구조 (1920x1080 최적화)
```
┌─────────────────────────────────────┐
│ Navbar (64px)                       │ - 고정
├─────────────────────────────────────┤
│ 통계 카드 (76px)                    │ - 고정
├─────────────────────────────────────┤
│ 탭 메뉴 (40px)                      │ - 고정
├─────────────────────────────────────┤
│ 탭 컨텐츠 (calc(100vh - 180px))     │ - 유동
│ - overflow: hidden (스크롤 없음)    │
│ - 고정 높이                          │
│ - 모든 컨텐츠가 화면 내에 표시       │
└─────────────────────────────────────┘
```

## 🔐 비밀번호 변경 방법

1. Master UI 접속
2. 우측 상단 **열쇠 아이콘** 클릭
3. 현재 비밀번호 입력 (기본값: `admin123`)
4. 새 비밀번호 입력
5. 새 비밀번호 확인 입력
6. **변경** 버튼 클릭
7. 변경된 비밀번호는 브라우저에 저장됨

**주의사항**:
- 비밀번호는 **브라우저 로컬 스토리지**에 저장됩니다
- 서버 재시작 시 기본값(`admin123`)으로 초기화됩니다
- 프로덕션 환경에서는 데이터베이스 저장 권장

## 빠른 시작

### Docker Compose (권장)
```bash
docker-compose up -d
```

웹 UI 접속: http://localhost:3000

### 개별 실행
```bash
# Master
NODE_MODE=master PORT=3000 MODBUS_PORT=5020 node src/index.js

# Slave 1
NODE_MODE=slave SLAVE_ID=1 DEVICE_TYPE=solar node src/index.js
```

## 환경변수

### Master
```env
NODE_MODE=master
PORT=3000
MODBUS_PORT=5020
```

### Slave
```env
NODE_MODE=slave
MASTER_HOST=localhost
MASTER_PORT=5020
SLAVE_ID=1
DEVICE_TYPE=solar
UPDATE_INTERVAL=3000
```

## API 엔드포인트

### Master API
- `GET /api/status` - 시스템 상태
- `GET /api/data` - 전체 데이터 및 통계
- `POST /api/slave/toggle` - Slave 전원 제어
  ```json
  {
    "slaveId": 1,
    "enable": true,
    "password": "admin123"
  }
  ```
- `POST /api/admin/change-password` - 비밀번호 변경
  ```json
  {
    "currentPassword": "admin123",
    "newPassword": "newpass1234"
  }
  ```

### Slave API
- `GET /api/status` - Slave 상태 및 데이터

## Modbus 레지스터 구조

각 Slave: **20개** Holding Register (Slave ID × 20)

| 주소 | 설명 | 값 | 단위 |
|------|------|-----|------|
| 0 | 장치 타입 | 1=Solar, 2=Wind, 3=BMS | - |
| 1 | 전력값 상위 16비트 | 0~65535 | - |
| 2 | 전력값 하위 16비트 | 0~65535 | - |
| 3 | 상태 | 1=정상, 0=오류 | - |
| 4 | 외기온도 | 정수 × 10 | 0.1°C |
| 5 | 내부온도 | 정수 × 10 | 0.1°C |
| 6 | 구동시간 상위 16비트 | 0~65535 | 초 |
| 7 | 구동시간 하위 16비트 | 0~65535 | 초 |
| 8-19 | 예약 | - | - |

## 프로젝트 구조

```
webapp/
├── src/
│   ├── index.js       # 메인 애플리케이션
│   ├── master.js      # Master (Modbus Server + API)
│   └── slave.js       # Slave (Modbus Client + 웹서버)
├── public/
│   ├── index.html     # Master UI (다크 테마)
│   ├── app.js         # Master JavaScript
│   └── slave/
│       └── index.html # Slave UI (다크 테마)
├── Dockerfile.master  # Master Dockerfile
├── Dockerfile.slave   # Slave Dockerfile
├── docker-compose.yml # Docker Compose
└── README.md
```

## 기술 스택

- **Backend**: Node.js + Express
- **Protocol**: Modbus TCP
- **Frontend**: 
  - Materialize CSS (다크 테마)
  - Material Icons
  - Chart.js (다크 모드)
- **WebSocket**: 실시간 통신
- **Storage**: LocalStorage (비밀번호)
- **Container**: Docker + Docker Compose

## 포트 구성

| 서비스 | 포트 | 용도 |
|--------|------|------|
| Master 웹 | 3000 | Master UI |
| Master Modbus | 5020 | Modbus TCP |
| Slave 1 웹 | 3001 | Slave 1 UI |
| Slave 2 웹 | 3002 | Slave 2 UI |
| Slave 3 웹 | 3003 | Slave 3 UI |

## 권장 다음 단계

- 💾 **데이터베이스** - 비밀번호 영구 저장
- 🔐 **JWT 인증** - 토큰 기반 인증
- 📧 **알림 시스템** - 이메일/SMS 알림
- 📊 **데이터 이력** - PostgreSQL/MongoDB
- 📱 **PWA** - 모바일 앱화
- 🌍 **다국어** - i18n 지원
- 📈 **고급 분석** - 머신러닝 예측

## 문제 해결

### 웹 UI 접속 불가
```bash
pm2 logs power-master --nostream
curl http://localhost:3000/api/status
```

### 비밀번호 초기화
```bash
# 브라우저 개발자 도구 (F12) > Console
localStorage.removeItem('adminPassword');
location.reload();
```

### Docker 문제
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 라이선스

ISC

## 개발 정보

- **프로젝트명**: 전력제어시스템
- **버전**: 5.2.0
- **최종 업데이트**: 2026-01-28
- **상태**: ✅ 프로덕션 준비 완료 (폐쇄망 환경 지원)

## 변경 이력

### v5.2.0 (2026-01-28) - 폐쇄망 완전 지원
- 🌍 Slave 노드 assets 경로 설정 개선
- 🔒 CORS 헤더 추가 (Access-Control-Allow-Origin: *)
- 💾 캐싱 최적화 (Cache-Control: public, max-age=31536000)
- ✅ 모든 CDN 자산 로컬 서빙 검증 완료
- 🔧 Express static 미들웨어 순서 최적화

### v5.1.0 (2026-01-28) - Master-Slave 구조 개선
- 🔌 Master-Slave 제어 기능 제거
- 📖 Master: 읽기 전용 모니터링
- 🔌 Slave: 독립 전원 제어
- ✅ Slave OFF 시 Master에 즉시 Offline 반영

### v5.0.0 (2026-01-28) - 폐쇄망 환경 지원
- 🌍 모든 CDN을 로컬 파일로 변경 (~1.3MB)
- 📦 Materialize CSS/JS, Chart.js, 폰트 로컬 번들
- 📄 OFFLINE_SETUP.md 가이드 추가
- ✅ 완전한 오프라인 동작 가능

### v3.0.0 (2026-01-22) - 최종 완성
- 🌑 다크 테마 완벽 적용 (Master & Slave)
- 📺 1920x1080 스크롤 완전 제거 (overflow: hidden)
- 🔐 비밀번호 변경 기능 완료
- 📊 차트 레이아웃 최적화 (고정 높이)
- 🎯 모든 요구사항 100% 달성

### v2.1.0 (2026-01-22)
- 🌑 다크 테마 적용 (Master & Slave)
- 📺 1920x1080 최적화 (스크롤 제거)
- 🔐 비밀번호 변경 기능
- 📊 차트 레이아웃 개선

### v2.0.0 (2026-01-22)
- ✨ Material Design UI
- 🌐 Slave 웹 서버
- 📊 확장 데이터
- 🎛️ 관리자 제어
- 📈 7가지 차트
- 🐳 개별 Dockerfile

### v1.0.0 (2026-01-21)
- 🚀 초기 릴리스
- ⚡ Modbus TCP
- 📊 기본 웹 UI
- 🐳 Docker 지원
