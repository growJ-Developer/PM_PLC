require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const MasterNode = require('./master');
const SlaveNode = require('./slave');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 정적 파일 제공
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

const NODE_MODE = process.env.NODE_MODE || 'master';
const PORT = process.env.PORT || 3000;

let node;

// WebSocket 연결 관리
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('WebSocket 클라이언트 연결됨');
  clients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket 클라이언트 연결 해제됨');
    clients.delete(ws);
  });
});

// 모든 클라이언트에게 데이터 브로드캐스트
function broadcastData(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API 엔드포인트
app.get('/api/status', (req, res) => {
  res.json({
    mode: NODE_MODE,
    status: node ? 'running' : 'stopped',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/data', (req, res) => {
  if (node && node.getData) {
    res.json(node.getData());
  } else {
    res.json({ error: 'No data available' });
  }
});

// 노드 시작
async function startNode() {
  try {
    if (NODE_MODE === 'master') {
      console.log('🎯 Master 모드로 시작합니다...');
      node = new MasterNode(broadcastData);
      await node.start();
    } else if (NODE_MODE === 'slave') {
      console.log('📡 Slave 모드로 시작합니다...');
      node = new SlaveNode();
      await node.start();
    } else {
      throw new Error('Invalid NODE_MODE. Use "master" or "slave"');
    }
  } catch (error) {
    console.error('노드 시작 실패:', error);
    process.exit(1);
  }
}

// Slave 모드에서는 웹 서버 불필요
if (NODE_MODE === 'slave') {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📡 전력제어시스템 [SLAVE] 시작`);
  console.log(`${'='.repeat(50)}\n`);
  
  startNode();
  
  // 종료 처리
  process.on('SIGINT', async () => {
    console.log('\n시스템 종료 중...');
    if (node && node.stop) {
      await node.stop();
    }
    process.exit(0);
  });
} else {
  // Master 모드: 웹 서버 시작
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🚀 전력제어시스템 [${NODE_MODE.toUpperCase()}] 시작`);
    console.log(`📍 포트: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`${'='.repeat(50)}\n`);
    
    startNode();
  });

  // 종료 처리
  process.on('SIGINT', async () => {
    console.log('\n시스템 종료 중...');
    if (node && node.stop) {
      await node.stop();
    }
    server.close(() => {
      console.log('서버 종료됨');
      process.exit(0);
    });
  });
}
