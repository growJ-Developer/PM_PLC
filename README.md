# 전력제어시스템 (Power Control System) v2.0

발전소와 관제소 간의 전력을 제어하고 모니터링하기 위한 Modbus 기반 시스템입니다.

## 🎨 v2.0 주요 업데이트

### ✨ Material Design UI
- Google Material Design 스타일 적용
- 직관적이고 현대적인 인터페이스
- 반응형 디자인 (모바일/태블릿/데스크톱)
- Materialize CSS 프레임워크 사용

### 🌐 Slave 웹 서비스
- 각 Slave 노드가 독립적인 웹 서버 운영
- 개별 포트로 접근 가능 (3001, 3002, 3003...)
- 실시간 상태 모니터링 페이지 제공

### 📊 확장된 데이터 필드
- **전력량**: 발전량 / 배터리량
- **외기온도**: 20-40°C 범위
- **내부온도**: 25-60°C 범위
- **구동시간**: 시작 이후 누적 시간

### 🎛️ 관리자 제어 기능
- 비밀번호 보호 (기본값: `admin123`)
- Slave 노드 전원 ON/OFF 제어
- 실시간 상태 반영

### 📈 다양한 차트
- **실시간 전력 라인 차트**
- **파이 차트** (장치별 분포)
- **바 차트** (장치별 전력량)
- **온도 차트** (외기/내부)
- **구동시간 추이 차트**
- **레이더 차트** (성능 지표)
- **버블 차트** (효율성 분석)

### 🐳 개별 Dockerfile
- `Dockerfile.master` - Master 노드 전용
- `Dockerfile.slave` - Slave 노드 전용
- Docker Compose로 통합 관리

## 🌐 공개 URL

### Master 노드
- **웹 UI**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **API 데이터**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai/api/data

### Slave 노드
- **Slave 1 (Solar)**: https://3001-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **Slave 2 (Wind)**: https://3002-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **Slave 3 (BMS)**: https://3003-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai

## 📊 현재 동작 중인 시스템

```
Master 노드 (포트 3000, 5020)
├── 📊 Material Design 대시보드
├── 📈 7개 종류의 차트
├── 🎛️ 관리자 제어 패널
└── 🔌 Modbus TCP 서버

Slave 노드들
├── Slave 1 (Solar) - 포트 3001
│   ├── 전력: 0~1000 kW
│   └── 🌐 독립 웹 서버
├── Slave 2 (Wind) - 포트 3002
│   ├── 전력: 0~2000 kW
│   └── 🌐 독립 웹 서버
└── Slave 3 (BMS) - 포트 3003
    ├── 배터리: 0~100 %
    └── 🌐 독립 웹 서버
```

## 🎯 완성된 기능

✅ **Material Design UI** - 현대적이고 직관적인 인터페이스  
✅ **Master-Slave Modbus TCP 통신** - 완전히 구현됨  
✅ **Slave 웹 서버** - 각 Slave가 독립적인 웹 UI 제공  
✅ **확장 데이터** - 전력, 외기온도, 내부온도, 구동시간  
✅ **관리자 제어** - 비밀번호 보호 + Slave 전원 제어  
✅ **7가지 차트** - 라인, 파이, 바, 온도, 구동시간, 레이더, 버블  
✅ **개별 Dockerfile** - Master/Slave 분리  
✅ **실시간 WebSocket 통신** - 즉각적인 데이터 업데이트  
✅ **탭 기반 UI** - 대시보드, 차트, 슬레이브 관리, 분석  

## 빠른 시작

### Docker Compose 사용 (권장)

```bash
# 전체 시스템 시작 (Master + 3개 Slave)
docker-compose up -d

# 로그 확인
docker-compose logs -f master
docker-compose logs -f slave1

# 시스템 중지
docker-compose down
```

### 개별 실행

#### Master 노드
```bash
cd /home/user/webapp
npm install
NODE_MODE=master PORT=3000 MODBUS_PORT=5020 node src/index.js
```

#### Slave 노드
```bash
# Slave 1 (Solar)
NODE_MODE=slave MASTER_HOST=localhost MASTER_PORT=5020 SLAVE_ID=1 DEVICE_TYPE=solar node src/index.js

# Slave 2 (Wind)
NODE_MODE=slave MASTER_HOST=localhost MASTER_PORT=5020 SLAVE_ID=2 DEVICE_TYPE=wind node src/index.js

# Slave 3 (BMS)
NODE_MODE=slave MASTER_HOST=localhost MASTER_PORT=5020 SLAVE_ID=3 DEVICE_TYPE=bms node src/index.js
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

## Modbus 레지스터 구조 (업데이트)

각 Slave는 **20개**의 Holding Register를 사용합니다 (Slave ID × 20):

| 주소 | 설명 | 값 | 단위 |
|------|------|-----|------|
| 0 | 장치 타입 | 1=Solar, 2=Wind, 3=BMS | - |
| 1 | 전력값 상위 16비트 | 0~65535 | - |
| 2 | 전력값 하위 16비트 | 0~65535 | - |
| 3 | 상태 | 1=정상, 0=오류 | - |
| 4 | 외기온도 | 정수 × 10 (253 = 25.3°C) | 0.1°C |
| 5 | 내부온도 | 정수 × 10 | 0.1°C |
| 6 | 구동시간 상위 16비트 | 0~65535 | 초 |
| 7 | 구동시간 하위 16비트 | 0~65535 | 초 |
| 8-19 | 예약 | - | - |

## 관리자 기능 사용법

1. Master UI에서 설정 아이콘 클릭
2. 비밀번호 입력 (기본값: `admin123`)
3. Slave 노드 ON/OFF 스위치 토글
4. 실시간으로 상태 반영

## 프로젝트 구조

```
webapp/
├── src/
│   ├── index.js       # 메인 애플리케이션
│   ├── master.js      # Master 노드 (Modbus Server + API)
│   └── slave.js       # Slave 노드 (Modbus Client + 웹서버)
├── public/
│   ├── index.html     # Master 웹 UI (Material Design)
│   ├── app.js         # Master 프론트엔드 JavaScript
│   └── slave/
│       └── index.html # Slave 웹 UI
├── Dockerfile.master  # Master 전용 Dockerfile
├── Dockerfile.slave   # Slave 전용 Dockerfile
├── docker-compose.yml # Docker Compose 설정
├── ecosystem.config.cjs # PM2 설정
├── package.json       # 의존성 관리
└── README.md          # 프로젝트 문서
```

## 기술 스택

- **Backend**: Node.js + Express
- **Protocol**: Modbus TCP (순수 net 모듈 + modbus-serial)
- **Frontend**: 
  - Master: Materialize CSS + Material Icons
  - Slave: Materialize CSS
- **Charts**: Chart.js (7가지 타입)
- **WebSocket**: 실시간 데이터 전송
- **Container**: Docker + Docker Compose

## API 엔드포인트

### Master API
- `GET /api/status` - 시스템 상태
- `GET /api/data` - 전체 슬레이브 데이터 및 통계
- `POST /api/slave/toggle` - Slave 전원 제어

### Slave API
- `GET /api/status` - Slave 상태 및 데이터

## 차트 종류

1. **실시간 전력 차트** (Line) - 각 Slave별 전력 추이
2. **파이 차트** (Doughnut) - 장치별 전력 분포
3. **바 차트** (Bar) - 장치별 전력량 비교
4. **온도 차트** (Line) - 외기/내부 온도 추이
5. **구동시간 차트** (Line) - 각 Slave 구동시간
6. **레이더 차트** (Radar) - 성능 지표 종합
7. **버블 차트** (Bubble) - 온도-전력-구동시간 상관관계

## 포트 구성

| 서비스 | 포트 | 용도 |
|--------|------|------|
| Master 웹 | 3000 | Master UI |
| Master Modbus | 5020 | Modbus TCP 서버 |
| Slave 1 웹 | 3001 | Slave 1 UI |
| Slave 2 웹 | 3002 | Slave 2 UI |
| Slave 3 웹 | 3003 | Slave 3 UI |

## 권장 다음 단계

- 🔒 JWT 기반 인증 시스템
- 💾 PostgreSQL/MongoDB 데이터 이력 저장
- 📧 이메일/SMS 알림 시스템
- 📱 Progressive Web App (PWA)
- 🌍 다국어 지원 (i18n)
- 📊 Excel/PDF 리포트 내보내기
- 🔐 역할 기반 접근 제어 (RBAC)

## 문제 해결

### 웹 UI 접속 불가
```bash
# 포트 확인
ss -tlnp | grep ":3000"

# 프로세스 확인
pm2 list
pm2 logs power-master --nostream
```

### Modbus 연결 실패
```bash
# Master 로그 확인
pm2 logs power-master --nostream | grep Modbus

# Slave 로그 확인
cat /tmp/slave1.log | tail -20
```

### Docker 문제
```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f

# 전체 재구축
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 라이선스

ISC

## 개발 정보

- **프로젝트명**: 전력제어시스템
- **버전**: 2.0.0
- **최종 업데이트**: 2026-01-22
- **상태**: ✅ 프로덕션 준비 완료

## 변경 이력

### v2.0.0 (2026-01-22)
- ✨ Material Design UI 적용
- 🌐 Slave 노드 웹 서버 추가
- 📊 확장 데이터 (외기온도, 내부온도, 구동시간)
- 🎛️ 관리자 제어 기능
- 📈 7가지 차트 추가
- 🐳 개별 Dockerfile 분리

### v1.0.0 (2026-01-21)
- 🚀 초기 릴리스
- ⚡ Modbus TCP 통신
- 📊 기본 웹 UI
- 🐳 Docker 지원
