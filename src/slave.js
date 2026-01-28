const ModbusRTU = require('modbus-serial');
const express = require('express');
const path = require('path');

class SlaveNode {
  constructor() {
    this.masterHost = process.env.MASTER_HOST || 'localhost';
    this.masterPort = parseInt(process.env.MASTER_PORT) || 502;
    this.slaveId = parseInt(process.env.SLAVE_ID) || 1;
    this.deviceType = process.env.DEVICE_TYPE || 'solar';
    this.updateInterval = parseInt(process.env.UPDATE_INTERVAL) || 5000;
    this.webPort = 3000 + this.slaveId; // 각 Slave는 고유한 웹 포트
    
    this.client = new ModbusRTU();
    this.client.setID(this.slaveId);
    this.client.setTimeout(5000);
    
    this.isConnected = false;
    this.intervalId = null;
    this.isPoweredOn = true; // 전원 상태
    this.adminPassword = 'admin123'; // 관리자 비밀번호
    
    // 추가 데이터
    this.startTime = Date.now();
    this.currentData = {
      power: 0,
      ambientTemp: 20 + Math.random() * 15, // 20-35°C
      internalTemp: 25 + Math.random() * 20, // 25-45°C
      runtime: 0
    };
    
    // Express 웹 서버
    this.app = express();
    this.setupWebServer();
  }

  setupWebServer() {
    // assets 디렉토리를 먼저 서빙 (우선순위 높음) - 절대 경로 사용
    const fs = require('fs');
    const assetsPath = path.resolve(__dirname, '../public/assets');
    const slavePath = path.resolve(__dirname, '../public/slave');
    
    console.log(`[Slave ${this.slaveId}] __dirname: ${__dirname}`);
    console.log(`[Slave ${this.slaveId}] Assets path: ${assetsPath}`);
    console.log(`[Slave ${this.slaveId}] Assets exists: ${fs.existsSync(assetsPath)}`);
    console.log(`[Slave ${this.slaveId}] Slave path: ${slavePath}`);
    console.log(`[Slave ${this.slaveId}] Slave exists: ${fs.existsSync(slavePath)}`);
    
    // JSON 파싱 미들웨어 (먼저 등록)
    this.app.use(express.json());
    
    // Assets 디렉토리 서빙 (최우선 - setHeaders로 CORS/캐싱 설정)
    this.app.use('/assets', express.static(assetsPath, {
      setHeaders: (res, filePath) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=31536000');
      }
    }));
    
    // Slave 전용 파일 서빙 (나중에 등록하여 /assets 우선순위 보장)
    this.app.use(express.static(slavePath));
    
    // API 엔드포인트 - 상태 조회
    this.app.get('/api/status', (req, res) => {
      res.json({
        slaveId: this.slaveId,
        deviceType: this.deviceType,
        connected: this.isConnected,
        powered: this.isPoweredOn,
        masterHost: this.masterHost,
        masterPort: this.masterPort,
        data: this.currentData,
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        timestamp: new Date().toISOString()
      });
    });
    
    // 전원 제어 API
    this.app.post('/api/power/toggle', (req, res) => {
      const { enable, password } = req.body;
      
      // 비밀번호 확인
      if (password !== this.adminPassword) {
        return res.json({ success: false, error: '비밀번호가 올바르지 않습니다.' });
      }
      
      this.isPoweredOn = enable;
      console.log(`[Slave ${this.slaveId}] 전원 ${enable ? 'ON' : 'OFF'}`);
      
      res.json({ success: true, message: `전원 ${enable ? '활성화' : '비활성화'} 완료` });
    });
    
    // 비밀번호 변경 API
    this.app.post('/api/admin/change-password', (req, res) => {
      const { currentPassword, newPassword } = req.body;
      
      // 현재 비밀번호 확인
      if (currentPassword !== this.adminPassword) {
        return res.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' });
      }
      
      // 새 비밀번호 검증
      if (!newPassword || newPassword.length < 4) {
        return res.json({ success: false, error: '비밀번호는 최소 4자 이상이어야 합니다.' });
      }
      
      // 비밀번호 변경
      this.adminPassword = newPassword;
      console.log(`[Slave ${this.slaveId}] 비밀번호가 변경되었습니다.`);
      
      res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    });
  }

  getDeviceTypeCode() {
    const typeMap = {
      'solar': 1,
      'wind': 2,
      'bms': 3
    };
    return typeMap[this.deviceType.toLowerCase()] || 1;
  }

  generateRandomPower() {
    let power;
    switch (this.deviceType.toLowerCase()) {
      case 'solar':
        power = Math.random() * 1000; // 0 ~ 1000 kW
        break;
      case 'wind':
        power = Math.random() * 2000; // 0 ~ 2000 kW
        break;
      case 'bms':
        power = Math.random() * 100; // 0 ~ 100 %
        break;
      default:
        power = Math.random() * 1000;
    }
    return power;
  }

  generateAdditionalData() {
    // 외기온도: 천천히 변화 (±0.5°C)
    this.currentData.ambientTemp += (Math.random() - 0.5);
    this.currentData.ambientTemp = Math.max(15, Math.min(40, this.currentData.ambientTemp));
    
    // 내부온도: 외기온도보다 높고 전력량에 영향 (±1°C)
    this.currentData.internalTemp += (Math.random() - 0.5) * 2;
    this.currentData.internalTemp = Math.max(20, Math.min(60, this.currentData.internalTemp));
    
    // 구동시간 (초)
    this.currentData.runtime = Math.floor((Date.now() - this.startTime) / 1000);
  }

  async connectToMaster() {
    try {
      await this.client.connectTCP(this.masterHost, { port: this.masterPort });
      this.isConnected = true;
      console.log(`[Slave ${this.slaveId}] Master에 연결됨: ${this.masterHost}:${this.masterPort}`);
      console.log(`[Slave ${this.slaveId}] 장치 타입: ${this.deviceType.toUpperCase()}`);
      console.log(`[Slave ${this.slaveId}] 업데이트 주기: ${this.updateInterval}ms`);
      console.log(`[Slave ${this.slaveId}] 웹 서버: http://localhost:${this.webPort}\n`);
    } catch (error) {
      console.error(`[Slave ${this.slaveId}] Master 연결 실패:`, error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async sendData() {
    if (!this.isConnected) {
      console.log(`[Slave ${this.slaveId}] Master에 연결되지 않음`);
      return;
    }

    try {
      // 전원이 OFF이면 0으로 전송
      const power = this.isPoweredOn ? this.generateRandomPower() : 0;
      this.currentData.power = power;
      
      // 추가 데이터 생성
      if (this.isPoweredOn) {
        this.generateAdditionalData();
      }
      
      const deviceTypeCode = this.getDeviceTypeCode();
      
      // 전력값을 정수로 변환 (소수점 2자리 유지: 1234.56 -> 123456)
      const powerInt = Math.round(power * 100);
      const powerHigh = (powerInt >> 16) & 0xFFFF;
      const powerLow = powerInt & 0xFFFF;
      
      // 온도값 (소수점 1자리: 25.3 -> 253)
      const ambientTempInt = Math.round(this.currentData.ambientTemp * 10);
      const internalTempInt = Math.round(this.currentData.internalTemp * 10);
      
      // 구동시간 (32비트) - 전원 OFF이면 0
      const runtime = this.isPoweredOn ? this.currentData.runtime : 0;
      const runtimeHigh = (runtime >> 16) & 0xFFFF;
      const runtimeLow = runtime & 0xFFFF;
      
      // 레지스터 주소 계산 (각 슬레이브는 20개 레지스터 사용)
      const baseAddr = this.slaveId * 20;
      
      // 데이터 배열
      const data = [
        deviceTypeCode,     // 0: 장치 타입
        powerHigh,          // 1: 전력 상위 16비트
        powerLow,           // 2: 전력 하위 16비트
        this.isPoweredOn ? 1 : 0,  // 3: 상태 (1=정상, 0=오프라인)
        ambientTempInt,     // 4: 외기온도
        internalTempInt,    // 5: 내부온도
        runtimeHigh,        // 6: 구동시간 상위
        runtimeLow,         // 7: 구동시간 하위
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0  // 8-19: 예약
      ];

      // Multiple Registers 쓰기
      await this.client.writeRegisters(baseAddr, data);
      
      const unit = this.deviceType.toLowerCase() === 'bms' ? '%' : 'kW';
      const status = this.isPoweredOn ? 'ON' : 'OFF';
      console.log(`[Slave ${this.slaveId}] 데이터 전송 [${status}]: ${power.toFixed(2)} ${unit}, 외기: ${this.currentData.ambientTemp.toFixed(1)}°C, 내부: ${this.currentData.internalTemp.toFixed(1)}°C`);
      
    } catch (error) {
      console.error(`[Slave ${this.slaveId}] 데이터 전송 실패:`, error.message);
      this.isConnected = false;
      
      // 재연결 시도
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async reconnect() {
    console.log(`[Slave ${this.slaveId}] 재연결 시도 중...`);
    try {
      this.client.close(() => {});
      this.client = new ModbusRTU();
      this.client.setID(this.slaveId);
      this.client.setTimeout(5000);
      await this.connectToMaster();
    } catch (error) {
      console.error(`[Slave ${this.slaveId}] 재연결 실패:`, error.message);
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async start() {
    // 웹 서버 시작
    this.app.listen(this.webPort, '0.0.0.0', () => {
      console.log(`[Slave ${this.slaveId}] 웹 서버 시작: http://localhost:${this.webPort}`);
    });
    
    // Master에 연결
    await this.connectToMaster();
    
    // 주기적으로 데이터 전송
    this.intervalId = setInterval(() => {
      this.sendData();
    }, this.updateInterval);
    
    // 첫 데이터 즉시 전송
    setTimeout(() => this.sendData(), 1000);
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.client && this.isConnected) {
      this.client.close(() => {
        console.log(`[Slave ${this.slaveId}] 연결 종료됨`);
      });
    }
  }
}

module.exports = SlaveNode;

// 메인 실행 코드
if (require.main === module) {
  const slave = new SlaveNode();
  slave.start().catch(error => {
    console.error('Slave 시작 실패:', error);
    process.exit(1);
  });
  
  // 종료 시그널 처리
  process.on('SIGINT', async () => {
    console.log('\n[Slave] 종료 중...');
    await slave.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n[Slave] 종료 중...');
    await slave.stop();
    process.exit(0);
  });
}
