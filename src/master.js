const net = require('net');

class MasterNode {
  constructor(broadcastCallback) {
    this.broadcastCallback = broadcastCallback;
    this.modbusPort = process.env.MODBUS_PORT || 502;
    
    // 슬레이브 데이터 저장소 (슬레이브 ID별)
    this.slaveData = {};
    
    // 슬레이브 전원 상태 (ID별)
    this.slavePowerStatus = {};
    
    // Modbus 레지스터 (최대 100개 슬레이브 지원, 각 슬레이브당 20개 레지스터)
    this.holdingRegisters = new Array(2000).fill(0);
    
    // TCP 서버
    this.tcpServer = null;
  }

  // Modbus TCP 패킷 파싱
  parseModbusRequest(buffer) {
    if (buffer.length < 8) return null;

    const transactionId = buffer.readUInt16BE(0);
    const protocolId = buffer.readUInt16BE(2);
    const length = buffer.readUInt16BE(4);
    const unitId = buffer.readUInt8(6);
    const functionCode = buffer.readUInt8(7);

    return {
      transactionId,
      protocolId,
      length,
      unitId,
      functionCode,
      data: buffer.slice(8)
    };
  }

  // Modbus TCP 응답 생성
  createModbusResponse(transactionId, unitId, functionCode, data) {
    const length = data.length + 2; // unit ID + function code + data
    const buffer = Buffer.alloc(6 + length);

    buffer.writeUInt16BE(transactionId, 0);
    buffer.writeUInt16BE(0, 2); // Protocol ID
    buffer.writeUInt16BE(length, 4);
    buffer.writeUInt8(unitId, 6);
    buffer.writeUInt8(functionCode, 7);
    data.copy(buffer, 8);

    return buffer;
  }

  // Function Code 03: Read Holding Registers
  handleReadHoldingRegisters(request) {
    const startAddr = request.data.readUInt16BE(0);
    const quantity = request.data.readUInt16BE(2);

    console.log(`[Modbus] Read Holding Registers from Slave ${request.unitId}: addr=${startAddr}, count=${quantity}`);

    const byteCount = quantity * 2;
    const responseData = Buffer.alloc(1 + byteCount);
    responseData.writeUInt8(byteCount, 0);

    for (let i = 0; i < quantity; i++) {
      const value = this.holdingRegisters[startAddr + i] || 0;
      responseData.writeUInt16BE(value, 1 + i * 2);
    }

    return this.createModbusResponse(request.transactionId, request.unitId, 0x03, responseData);
  }

  // Function Code 16: Write Multiple Registers
  handleWriteMultipleRegisters(request) {
    const startAddr = request.data.readUInt16BE(0);
    const quantity = request.data.readUInt16BE(2);
    const byteCount = request.data.readUInt8(4);

    const values = [];
    for (let i = 0; i < quantity; i++) {
      const value = request.data.readUInt16BE(5 + i * 2);
      this.holdingRegisters[startAddr + i] = value;
      values.push(value);
    }

    console.log(`[Modbus] Write Multiple Registers from Slave ${request.unitId}: addr=${startAddr}, values=[${values.join(', ')}]`);

    // 슬레이브 데이터 파싱
    this.parseSlaveData(request.unitId, startAddr, values);

    const responseData = Buffer.alloc(4);
    responseData.writeUInt16BE(startAddr, 0);
    responseData.writeUInt16BE(quantity, 2);

    return this.createModbusResponse(request.transactionId, request.unitId, 0x10, responseData);
  }

  // Function Code 06: Write Single Register
  handleWriteSingleRegister(request) {
    const addr = request.data.readUInt16BE(0);
    const value = request.data.readUInt16BE(2);

    this.holdingRegisters[addr] = value;

    console.log(`[Modbus] Write Single Register from Slave ${request.unitId}: addr=${addr}, value=${value}`);

    // 슬레이브 데이터 파싱
    this.parseSlaveData(request.unitId, addr, [value]);

    return this.createModbusResponse(request.transactionId, request.unitId, 0x06, request.data);
  }

  parseSlaveData(unitID, startAddr, values) {
    const baseAddr = unitID * 20; // 각 슬레이브는 20개 레지스터 사용
    
    if (startAddr >= baseAddr && startAddr < baseAddr + 20) {
      const deviceType = this.holdingRegisters[baseAddr] || 0;
      const powerHigh = this.holdingRegisters[baseAddr + 1] || 0;
      const powerLow = this.holdingRegisters[baseAddr + 2] || 0;
      const status = this.holdingRegisters[baseAddr + 3] || 0;
      const ambientTemp = this.holdingRegisters[baseAddr + 4] || 0;
      const internalTemp = this.holdingRegisters[baseAddr + 5] || 0;
      const runtimeHigh = this.holdingRegisters[baseAddr + 6] || 0;
      const runtimeLow = this.holdingRegisters[baseAddr + 7] || 0;
      
      // 32비트 값 복원
      const power = (powerHigh << 16) | powerLow;
      const runtime = (runtimeHigh << 16) | runtimeLow;
      
      const deviceTypeMap = {
        1: 'Solar',
        2: 'Wind',
        3: 'BMS'
      };

      // status 레지스터 값에 따라 상태 결정 (1=Online, 0=Offline)
      this.slaveData[unitID] = {
        slaveId: unitID,
        deviceType: deviceTypeMap[deviceType] || 'Unknown',
        power: power / 100, // 소수점 2자리 복원
        status: status === 1 ? 'Online' : 'Offline',
        ambientTemp: ambientTemp / 10, // 소수점 1자리
        internalTemp: internalTemp / 10,
        runtime: runtime, // 초 단위
        lastUpdate: new Date().toISOString()
      };

      console.log(`[Data] Slave ${unitID} 업데이트:`, this.slaveData[unitID]);
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

  // Slave 전원 제어
  toggleSlavePower(slaveId, enable) {
    this.slavePowerStatus[slaveId] = enable;
    
    // Slave 데이터 업데이트
    if (this.slaveData[slaveId]) {
      this.slaveData[slaveId].status = enable ? 'Online' : 'Offline';
      this.broadcastData();
    }
    
    console.log(`[Master] Slave ${slaveId} 전원 ${enable ? 'ON' : 'OFF'}`);
    return true;
  }

  // Slave 상태 확인
  getSlavePowerStatus(slaveId) {
    return this.slavePowerStatus[slaveId] !== false;
  }

  async start() {
    const self = this;
    
    return new Promise((resolve, reject) => {
      try {
        this.tcpServer = net.createServer((socket) => {
          console.log(`[Modbus] 새로운 연결: ${socket.remoteAddress}:${socket.remotePort}`);

          socket.on('data', (data) => {
            try {
              const request = self.parseModbusRequest(data);
              if (!request) return;

              let response;
              switch (request.functionCode) {
                case 0x03: // Read Holding Registers
                  response = self.handleReadHoldingRegisters(request);
                  break;
                case 0x06: // Write Single Register
                  response = self.handleWriteSingleRegister(request);
                  break;
                case 0x10: // Write Multiple Registers
                  response = self.handleWriteMultipleRegisters(request);
                  break;
                default:
                  console.log(`[Modbus] Unsupported function code: ${request.functionCode}`);
                  return;
              }

              if (response) {
                socket.write(response);
              }
            } catch (error) {
              console.error('[Modbus] 패킷 처리 에러:', error);
            }
          });

          socket.on('error', (err) => {
            console.error('[Modbus] Socket 에러:', err.message);
          });

          socket.on('close', () => {
            console.log('[Modbus] 연결 종료');
          });
        });

        this.tcpServer.on('error', (err) => {
          console.error('[Modbus] TCP 서버 에러:', err);
          reject(err);
        });

        this.tcpServer.listen(this.modbusPort, '0.0.0.0', () => {
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
      } catch (error) {
        console.error('[Master] 시작 실패:', error);
        reject(error);
      }
    });
  }

  async stop() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.tcpServer) {
      this.tcpServer.close();
    }
    console.log('[Master] 종료됨');
  }
}

module.exports = MasterNode;
