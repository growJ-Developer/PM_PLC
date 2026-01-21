// WebSocket 연결
let ws;
let chart;
let chartData = {
    labels: [],
    datasets: []
};
let slaveColors = {};

// 색상 팔레트 (각 슬레이브별)
const colorPalette = [
    '#00ff41', '#1e90ff', '#ffc107', '#ff4444', '#9c27b0',
    '#00bcd4', '#ff9800', '#4caf50', '#e91e63', '#03a9f4'
];

// WebSocket 연결 설정
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket 연결됨');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
                updateUI(data);
            }
        } catch (error) {
            console.error('데이터 파싱 에러:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket 에러:', error);
        updateConnectionStatus(false);
    };

    ws.onclose = () => {
        console.log('WebSocket 연결 끊김. 5초 후 재연결...');
        updateConnectionStatus(false);
        setTimeout(connectWebSocket, 5000);
    };
}

// 연결 상태 업데이트
function updateConnectionStatus(connected) {
    const statusEl = document.getElementById('connectionStatus');
    const textEl = document.getElementById('connectionText');
    
    if (connected) {
        statusEl.classList.remove('disconnected');
        textEl.textContent = '🟢 서버 연결됨';
    } else {
        statusEl.classList.add('disconnected');
        textEl.textContent = '🔴 서버 연결 끊김';
    }
}

// UI 업데이트
function updateUI(data) {
    const { slaves, statistics } = data;
    
    // 통계 업데이트
    updateStatistics(statistics);
    
    // 슬레이브 테이블 업데이트
    updateSlavesTable(slaves);
    
    // 차트 업데이트
    updateChart(slaves);
}

// 통계 업데이트
function updateStatistics(stats) {
    document.getElementById('totalSlaves').textContent = stats.totalSlaves || 0;
    document.getElementById('onlineSlaves').textContent = stats.onlineSlaves || 0;
    document.getElementById('offlineSlaves').textContent = stats.offlineSlaves || 0;
    document.getElementById('totalPower').textContent = stats.totalPower || '0.00';
    document.getElementById('averagePower').textContent = stats.averagePower || '0.00';
}

// 슬레이브 테이블 업데이트
function updateSlavesTable(slaves) {
    const container = document.getElementById('slavesTableContainer');
    
    if (!slaves || slaves.length === 0) {
        container.innerHTML = '<div class="no-data">슬레이브 데이터를 기다리는 중...</div>';
        return;
    }

    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>슬레이브 ID</th>
                    <th>장치 타입</th>
                    <th>발전량/배터리량</th>
                    <th>상태</th>
                    <th>마지막 업데이트</th>
                </tr>
            </thead>
            <tbody>
    `;

    slaves.forEach(slave => {
        const deviceClass = slave.deviceType.toLowerCase();
        const statusClass = slave.status.toLowerCase();
        const unit = slave.deviceType === 'BMS' ? '%' : 'kW';
        const updateTime = new Date(slave.lastUpdate).toLocaleTimeString('ko-KR');
        
        tableHTML += `
            <tr>
                <td><strong>Slave ${slave.slaveId}</strong></td>
                <td><span class="device-type ${deviceClass}">${slave.deviceType}</span></td>
                <td><span class="power-value">${slave.power.toFixed(2)} ${unit}</span></td>
                <td><span class="status-badge ${statusClass}">${slave.status}</span></td>
                <td>${updateTime}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// 차트 초기화
function initChart() {
    const ctx = document.getElementById('powerChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: {
                duration: 750
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '시간',
                        color: '#888'
                    },
                    ticks: {
                        color: '#888',
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: '전력 (kW / %)',
                        color: '#888'
                    },
                    ticks: {
                        color: '#888'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#888',
                        font: {
                            family: 'Consolas',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(15, 20, 33, 0.9)',
                    titleColor: '#1e90ff',
                    bodyColor: '#00ff41',
                    borderColor: '#1e90ff',
                    borderWidth: 1
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 차트 업데이트
function updateChart(slaves) {
    if (!chart) return;

    const now = new Date().toLocaleTimeString('ko-KR');
    
    // 라벨 추가 (최대 20개 유지)
    chartData.labels.push(now);
    if (chartData.labels.length > 20) {
        chartData.labels.shift();
    }

    // 각 슬레이브별 데이터셋 업데이트
    slaves.forEach(slave => {
        const slaveKey = `Slave ${slave.slaveId} (${slave.deviceType})`;
        let dataset = chartData.datasets.find(ds => ds.label === slaveKey);
        
        // 새로운 슬레이브면 데이터셋 생성
        if (!dataset) {
            const colorIndex = chartData.datasets.length % colorPalette.length;
            const color = colorPalette[colorIndex];
            slaveColors[slaveKey] = color;
            
            dataset = {
                label: slaveKey,
                data: [],
                borderColor: color,
                backgroundColor: color + '33',
                borderWidth: 2,
                tension: 0.4,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 5
            };
            chartData.datasets.push(dataset);
        }
        
        // 데이터 추가
        dataset.data.push(slave.power);
        if (dataset.data.length > 20) {
            dataset.data.shift();
        }
    });

    chart.update('none');
}

// 시계 업데이트
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR');
    document.getElementById('currentTime').textContent = timeString;
}

// 초기화
function init() {
    // 시계 시작
    updateClock();
    setInterval(updateClock, 1000);
    
    // 차트 초기화
    initChart();
    
    // WebSocket 연결
    connectWebSocket();
    
    console.log('전력제어시스템 UI 초기화 완료');
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
