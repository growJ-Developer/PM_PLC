const ModbusRTU = require('modbus-serial');

class SlaveNode {
  constructor() {
    this.masterHost = process.env.MASTER_HOST || 'localhost';
    this.masterPort = parseInt(process.env.MASTER_PORT) || 502;
    this.slaveId = parseInt(process.env.SLAVE_ID) || 1;
    this.deviceType = process.env.DEVICE_TYPE || 'solar';
    this.updateInterval = parseInt(process.env.UPDATE_INTERVAL) || 5000;
    
    this.client = new ModbusRTU();
    this.client.setID(this.slaveId);
    this.client.setTimeout(5000);
    
    this.isConnected = false;
    this.intervalId = null;
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
    // 장치 타입에 따라 랜덤 데이터 생성
    let power;
    switch (this.deviceType.toLowerCase()) {
      case 'solar':
        // 태양광: 0 ~ 1000 kW
        power = Math.random() * 1000;
        break;
      case 'wind':
        // 풍력: 0 ~ 2000 kW
        power = Math.random() * 2000;
        break;
      case 'bms':
        // BMS 배터리: 0 ~ 100 %
        power = Math.random() * 100;
        break;
      default:
        power = Math.random() * 1000;
    }
    return power;
  }

  async connectToMaster() {
    try {
      await this.client.connectTCP(this.masterHost, { port: this.masterPort });
      this.isConnected = true;
      console.log(`[Slave ${this.slaveId}] Master에 연결됨: ${this.masterHost}:${this.masterPort}`);
      console.log(`[Slave ${this.slaveId}] 장치 타입: ${this.deviceType.toUpperCase()}`);
      console.log(`[Slave ${this.slaveId}] 업데이트 주기: ${this.updateInterval}ms\n`);
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
      const power = this.generateRandomPower();
      const deviceTypeCode = this.getDeviceTypeCode();
      
      // 전력값을 정수로 변환 (소수점 2자리 유지: 1234.56 -> 123456)
      const powerInt = Math.round(power * 100);
      
      // 32비트 값을 16비트 2개로 분할
      const powerHigh = (powerInt >> 16) & 0xFFFF;
      const powerLow = powerInt & 0xFFFF;
      
      // 레지스터 주소 계산 (각 슬레이브는 10개 레지스터 사용)
      const baseAddr = this.slaveId * 10;
      
      // 데이터 배열
      const data = [
        deviceTypeCode,  // 장치 타입
        powerHigh,       // 전력 상위 16비트
        powerLow,        // 전력 하위 16비트
        1,               // 상태 (1=정상)
        0,               // 타임스탬프 상위 (예약)
        0                // 타임스탬프 하위 (예약)
      ];

      // Multiple Registers 쓰기
      await this.client.writeRegisters(baseAddr, data);
      
      const unit = this.deviceType.toLowerCase() === 'bms' ? '%' : 'kW';
      console.log(`[Slave ${this.slaveId}] 데이터 전송: ${power.toFixed(2)} ${unit} (Type: ${this.deviceType})`);
      
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
