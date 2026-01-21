# 전력제어시스템 (Power Control System)

발전소와 관제소 간의 전력을 제어하고 모니터링하기 위한 Modbus 기반 시스템입니다.

## 🎯 현재 완료된 기능

✅ **Master-Slave Modbus TCP 통신** - 완전히 구현됨  
✅ **실시간 데이터 수집 및 표시** - WebSocket 기반 실시간 업데이트  
✅ **웹 기반 모니터링 UI** - 다크 테마 PLC 스타일  
✅ **통계 및 집계 기능** - 총 전력량, 평균, 장치별 통계  
✅ **Docker 컨테이너화** - docker-compose로 즉시 실행 가능  
✅ **여러 Slave 동시 연결 지원** - 최대 100개 Slave  
✅ **차트 기반 실시간 시각화** - Chart.js 그래프  
✅ **3가지 장치 타입 지원** - Solar, Wind, BMS  

## 🌐 공개 URL

- **웹 UI**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai
- **API 상태**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai/api/status
- **API 데이터**: https://3000-iukcsmo0llfytc7ru90dx-c81df28e.sandbox.novita.ai/api/data

## 📊 현재 동작 중인 시스템

- **Master 노드**: Modbus TCP 서버 (포트 5020) + 웹 서버 (포트 3000)
- **Slave 1**: 태양광 발전소 (0~1000 kW)
- **Slave 2**: 풍력 발전소 (0~2000 kW)
- **Slave 3**: BMS 배터리 (0~100 %)

## 주요 기능

- ⚡ **실시간 전력 모니터링**: Modbus TCP 프로토콜을 통한 실시간 데이터 수집
- 📊 **통계 및 집계**: 전체 전력량, 평균, 장치별 통계 자동 계산
- 🎛️ **Master-Slave 아키텍처**: 1개의 Master와 여러 Slave 노드 연결 지원
- 🌐 **웹 기반 UI**: 다크 테마 PLC 스타일의 직관적인 모니터링 인터페이스
- 🔄 **자동 데이터 생성**: Slave 노드에서 발전량/배터리량 랜덤 생성
- 🐳 **Docker 기반**: 컨테이너로 간편한 배포 및 확장

## 시스템 구성

### Master 노드
- Modbus TCP 서버 (포트 5020)
- 웹 서버 (포트 3000)
- 데이터 수집 및 통계 처리
- 실시간 웹 UI 제공

### Slave 노드
- Modbus TCP 클라이언트
- 3가지 장치 타입 지원:
  - **Solar (태양광)**: 0~1000 kW
  - **Wind (풍력)**: 0~2000 kW
  - **BMS (배터리)**: 0~100 %
- 설정 가능한 업데이트 주기

## 빠른 시작

### Docker Compose 사용 (권장)

```bash
# 전체 시스템 시작 (Master + 3개 Slave)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 시스템 중지
docker-compose down
```

웹 UI 접속: http://localhost:3000

### 개별 실행

#### 1. 의존성 설치
```bash
npm install
```

#### 2. Master 노드 실행
```bash
# 환경변수 설정
export NODE_MODE=master
export PORT=3000
export MODBUS_PORT=5020

# 실행
npm start
# 또는
npm run master
```

#### 3. Slave 노드 실행 (별도 터미널)
```bash
# Slave 1 - 태양광
export NODE_MODE=slave
export MASTER_HOST=localhost
export MASTER_PORT=5020
export SLAVE_ID=1
export DEVICE_TYPE=solar
export UPDATE_INTERVAL=5000

npm start
```

```bash
# Slave 2 - 풍력
export NODE_MODE=slave
export SLAVE_ID=2
export DEVICE_TYPE=wind

npm start
```

## 환경변수 설정

### Master 모드
```env
NODE_MODE=master
PORT=3000
MODBUS_PORT=5020
```

### Slave 모드
```env
NODE_MODE=slave
MASTER_HOST=localhost
MASTER_PORT=5020
SLAVE_ID=1
DEVICE_TYPE=solar
UPDATE_INTERVAL=5000
```

## 프로젝트 구조

```
webapp/
├── src/
│   ├── index.js       # 메인 애플리케이션
│   ├── master.js      # Master 노드 (Modbus Server)
│   └── slave.js       # Slave 노드 (Modbus Client)
├── public/
│   ├── index.html     # 웹 UI
│   └── app.js         # 프론트엔드 JavaScript
├── Dockerfile         # Docker 이미지 정의
├── docker-compose.yml # Docker Compose 설정
├── ecosystem.config.cjs # PM2 설정
├── package.json       # 의존성 관리
└── README.md          # 프로젝트 문서
```

## 기술 스택

- **Backend**: Node.js + Express
- **Protocol**: Modbus TCP (순수 net 모듈 구현)
- **Frontend**: HTML5 + Vanilla JavaScript + Chart.js
- **WebSocket**: 실시간 데이터 전송
- **Container**: Docker + Docker Compose

## Modbus 프로토콜 구조

각 Slave는 10개의 Holding Register를 사용합니다 (Slave ID × 10):

| 주소 | 설명 | 값 |
|------|------|-----|
| 0 | 장치 타입 | 1=Solar, 2=Wind, 3=BMS |
| 1 | 전력값 상위 16비트 | 0~65535 |
| 2 | 전력값 하위 16비트 | 0~65535 |
| 3 | 상태 | 1=정상, 0=오류 |
| 4-5 | 예약 | - |

전력값은 32비트 정수로 저장되며, 실제 값의 100배로 인코딩됩니다.
예: 1234.56 kW → 123456

## Slave 추가 방법

### docker-compose.yml에 추가
```yaml
slave4:
  build: .
  container_name: power-control-slave4
  environment:
    - NODE_MODE=slave
    - MASTER_HOST=master
    - MASTER_PORT=5020
    - SLAVE_ID=4
    - DEVICE_TYPE=solar
    - UPDATE_INTERVAL=5000
  depends_on:
    - master
  networks:
    - power-control-network
```

## 권장 다음 단계

- 🔐 인증/권한 시스템 추가
- 💾 데이터베이스 연동 (이력 저장)
- 📧 알람/알림 시스템 (임계값 초과 시)
- 📱 모바일 반응형 UI 개선
- 🔧 설정 관리 UI 추가
- 📈 고급 분석 및 리포트 기능
- 🌍 다국어 지원

## 문제 해결

### Modbus 연결 실패
- Master가 먼저 실행되었는지 확인
- 포트 5020이 사용 가능한지 확인
- 방화벽 설정 확인

### 웹 UI 접속 불가
- 포트 3000이 열려있는지 확인
- Master 노드가 정상 실행 중인지 확인

### Docker 네트워크 문제
```bash
docker-compose down
docker network prune
docker-compose up -d
```

## 라이선스

ISC

## 개발 정보

- **프로젝트명**: 전력제어시스템
- **버전**: 1.0.0
- **최종 업데이트**: 2026-01-21
- **상태**: ✅ 프로덕션 준비 완료
