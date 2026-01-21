const ModbusRTU = require('modbus-serial');

class MasterNode {
  constructor(broadcastCallback) {
    this.broadcastCallback = broadcastCallback;
    this.modbusPort = process.env.MODBUS_PORT || 502;
    this.server = new ModbusRTU.ServerTCP(null, { host: '0.0.0.0', port: this.modbusPort });
    
    // 슬레이브 데이터 저장소 (슬레이브 ID별)
    this.slaveData = {};
    
    // Modbus 레지스터 (최대 100개 슬레이브 지원, 각 슬레이브당 10개 레지스터)
    this.holdingRegisters = new Array(1000).fill(0);
    
    this.setupModbusServer();
  }

  setupModbusServer() {
    const self = this;
    
    // Holding Register 읽기 처리
    this.server.on('readHoldingRegisters', (addr, length, unitID) => {
      console.log(`[Modbus] Read request from Slave ${unitID}: addr=${addr}, length=${length}`);
      return this.holdingRegisters.slice(addr, addr + length);
    });

    // Holding Register 쓰기 처리
    this.server.on('writeRegisters', (addr, values, unitID) => {
      console.log(`[Modbus] Write request from Slave ${unitID}: addr=${addr}, values=${values}`);
      
      // 레지스터에 저장
      for (let i = 0; i < values.length; i++) {
        this.holdingRegisters[addr + i] = values[i];
      }

      // 슬레이브 데이터 파싱 및 저장
      this.parseSlaveData(unitID, addr, values);
    });

    // Single Register 쓰기 처리
    this.server.on('writeSingleRegister', (addr, value, unitID) => {
      console.log(`[Modbus] Write single register from Slave ${unitID}: addr=${addr}, value=${value}`);
      this.holdingRegisters[addr] = value;
      this.parseSlaveData(unitID, addr, [value]);
    });
  }

  parseSlaveData(unitID, startAddr, values) {
    // 슬레이브가 보낸 데이터 파싱
    // 레지스터 구조:
    // 0: 장치 타입 (1=Solar, 2=Wind, 3=BMS)
    // 1: 발전량/배터리량 (상위 16비트)
    // 2: 발전량/배터리량 (하위 16비트)
    // 3: 상태 (1=정상, 0=오류)
    // 4: 타임스탬프 (상위)
    // 5: 타임스탬프 (하위)

    const baseAddr = unitID * 10; // 각 슬레이브는 10개 레지스터 사용
    
    if (startAddr >= baseAddr && startAddr < baseAddr + 10) {
      const deviceType = this.holdingRegisters[baseAddr] || 0;
      const powerHigh = this.holdingRegisters[baseAddr + 1] || 0;
      const powerLow = this.holdingRegisters[baseAddr + 2] || 0;
      const status = this.holdingRegisters[baseAddr + 3] || 0;
      
      // 32비트 값 복원
      const power = (powerHigh << 16) | powerLow;
      
      const deviceTypeMap = {
        1: 'Solar',
        2: 'Wind',
        3: 'BMS'
      };

      this.slaveData[unitID] = {
        slaveId: unitID,
        deviceType: deviceTypeMap[deviceType] || 'Unknown',
        power: power / 100, // 소수점 2자리 복원
        status: status === 1 ? 'Online' : 'Offline',
        lastUpdate: new Date().toISOString()
      };

      console.log(`[Data] Slave ${unitID} 업데이트:`, this.slaveData[unitID]);

      // 웹소켓으로 실시간 브로드캐스트
      this.broadcastData();
    }
  }

  broadcastData() {
    const data = {
      type: 'update',
      slaves: Object.values(this.slaveData),
      statistics: this.calculateStatistics(),
      timestamp: new Date().toISOString()
    };

    this.broadcastCallback(data);
  }

  calculateStatistics() {
    const slaves = Object.values(this.slaveData);
    
    const totalPower = slaves.reduce((sum, slave) => sum + slave.power, 0);
    const onlineCount = slaves.filter(s => s.status === 'Online').length;
    const offlineCount = slaves.filter(s => s.status === 'Offline').length;
    
    const byType = {};
    slaves.forEach(slave => {
      if (!byType[slave.deviceType]) {
        byType[slave.deviceType] = { count: 0, totalPower: 0 };
      }
      byType[slave.deviceType].count++;
      byType[slave.deviceType].totalPower += slave.power;
    });

    return {
      totalSlaves: slaves.length,
      onlineSlaves: onlineCount,
      offlineSlaves: offlineCount,
      totalPower: totalPower.toFixed(2),
      averagePower: slaves.length > 0 ? (totalPower / slaves.length).toFixed(2) : 0,
      byType
    };
  }

  getData() {
    return {
      slaves: Object.values(this.slaveData),
      statistics: this.calculateStatistics()
    };
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server.on('socketError', (err) => {
        console.error('[Modbus] Socket 에러:', err);
      });

      console.log(`[Master] Modbus TCP 서버 시작: 포트 ${this.modbusPort}`);
      console.log('[Master] 슬레이브 연결 대기 중...\n');
      
      // 주기적으로 통계 업데이트
      this.statsInterval = setInterval(() => {
        if (Object.keys(this.slaveData).length > 0) {
          this.broadcastData();
        }
      }, 1000);

      resolve();
    });
  }

  async stop() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    console.log('[Master] 종료됨');
  }
}

module.exports = MasterNode;
