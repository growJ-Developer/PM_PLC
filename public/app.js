// WebSocket 연결
let ws;
let charts = {};
const ADMIN_PASSWORD = 'admin123';

// 차트 색상
const chartColors = {
    solar: '#ff9800',
    wind: '#2196f3',
    bms: '#4caf50',
    temperature: '#f44336',
    runtime: '#9c27b0'
};

// Materialize 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 모달 초기화
    M.Modal.init(document.querySelectorAll('.modal'));
    
    // 탭 초기화
    M.Tabs.init(document.querySelectorAll('.tabs'));
    
    // 초기화
    init();
});

// WebSocket 연결
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
    
    if (connected) {
        statusEl.className = 'chip green white-text';
        statusEl.innerHTML = '<i class="material-icons left">wifi</i>연결됨';
    } else {
        statusEl.className = 'chip red white-text';
        statusEl.innerHTML = '<i class="material-icons left">wifi_off</i>연결 끊김';
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
    updateAllCharts(slaves, statistics);
    
    // 관리자 패널 업데이트
    updateAdminPanel(slaves);
}

// 통계 업데이트
function updateStatistics(stats) {
    document.getElementById('totalSlaves').textContent = stats.totalSlaves || 0;
    document.getElementById('onlineSlaves').textContent = stats.onlineSlaves || 0;
    document.getElementById('totalPower').textContent = stats.totalPower || '0.00';
    document.getElementById('averagePower').textContent = stats.averagePower || '0.00';
}

// 슬레이브 테이블 업데이트
function updateSlavesTable(slaves) {
    const tbody = document.getElementById('slavesTableBody');
    
    if (!slaves || slaves.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="center-align">
                    <div class="progress"><div class="indeterminate"></div></div>
                    <p>슬레이브 데이터를 기다리는 중...</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    slaves.forEach(slave => {
        const deviceClass = slave.deviceType.toLowerCase();
        const unit = slave.deviceType === 'BMS' ? '%' : 'kW';
        
        html += `
            <tr>
                <td><strong>Slave ${slave.slaveId}</strong></td>
                <td><span class="device-badge ${deviceClass}">${slave.deviceType}</span></td>
                <td><strong>${slave.power.toFixed(2)} ${unit}</strong></td>
                <td>${slave.ambientTemp || 'N/A'}°C</td>
                <td>${slave.internalTemp || 'N/A'}°C</td>
                <td>${formatRuntime(slave.runtime || 0)}</td>
                <td><span class="status-badge ${slave.status.toLowerCase()}">${slave.status}</span></td>
                <td>
                    <a href="http://localhost:${3000 + slave.slaveId}" target="_blank" class="btn-small blue">
                        <i class="material-icons left">open_in_new</i>보기
                    </a>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 구동시간 포맷
function formatRuntime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// 차트 초기화
function initCharts() {
    // 실시간 전력 차트 (라인)
    const powerCtx = document.getElementById('powerChart').getContext('2d');
    charts.power = new Chart(powerCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: '전력 (kW)' } }
            }
        }
    });

    // 파이 차트 (장치별 분포)
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Solar', 'Wind', 'BMS'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [chartColors.solar, chartColors.wind, chartColors.bms]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // 바 차트 (장치별 전력량)
    const barCtx = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '전력량 (kW)',
                data: [],
                backgroundColor: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // 온도 차트
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    charts.temperature = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: '외기온도',
                    data: [],
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true
                },
                {
                    label: '내부온도',
                    data: [],
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { title: { display: true, text: '온도 (°C)' } }
            }
        }
    });

    // 구동시간 차트
    const runtimeCtx = document.getElementById('runtimeChart').getContext('2d');
    charts.runtime = new Chart(runtimeCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: { title: { display: true, text: '구동시간 (시간)' } }
            }
        }
    });

    // 레이더 차트
    const radarCtx = document.getElementById('radarChart').getContext('2d');
    charts.radar = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: [],
            datasets: [{
                label: '성능 지표',
                data: [],
                backgroundColor: 'rgba(33, 150, 243, 0.2)',
                borderColor: '#2196f3',
                pointBackgroundColor: '#2196f3'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true
        }
    });

    // 버블 차트
    const bubbleCtx = document.getElementById('bubbleChart').getContext('2d');
    charts.bubble = new Chart(bubbleCtx, {
        type: 'bubble',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { title: { display: true, text: '온도 (°C)' } },
                y: { title: { display: true, text: '전력 (kW)' } }
            }
        }
    });
}

// 모든 차트 업데이트
function updateAllCharts(slaves, statistics) {
    if (!slaves || slaves.length === 0) return;

    const now = new Date().toLocaleTimeString('ko-KR');

    // 실시간 전력 차트 업데이트
    updatePowerChart(slaves, now);
    
    // 파이 차트 업데이트
    updatePieChart(statistics);
    
    // 바 차트 업데이트
    updateBarChart(slaves);
    
    // 온도 차트 업데이트
    updateTemperatureChart(slaves, now);
    
    // 구동시간 차트 업데이트
    updateRuntimeChart(slaves, now);
    
    // 레이더 차트 업데이트
    updateRadarChart(slaves);
    
    // 버블 차트 업데이트
    updateBubbleChart(slaves);
}

// 실시간 전력 차트 업데이트
function updatePowerChart(slaves, now) {
    const maxPoints = 20;
    
    if (charts.power.data.labels.length >= maxPoints) {
        charts.power.data.labels.shift();
    }
    charts.power.data.labels.push(now);

    slaves.forEach(slave => {
        const label = `Slave ${slave.slaveId} (${slave.deviceType})`;
        let dataset = charts.power.data.datasets.find(ds => ds.label === label);
        
        if (!dataset) {
            const color = chartColors[slave.deviceType.toLowerCase()] || '#757575';
            dataset = {
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: color + '33',
                tension: 0.4
            };
            charts.power.data.datasets.push(dataset);
        }
        
        dataset.data.push(slave.power);
        if (dataset.data.length > maxPoints) {
            dataset.data.shift();
        }
    });

    charts.power.update('none');
}

// 파이 차트 업데이트
function updatePieChart(statistics) {
    const byType = statistics.byType || {};
    charts.pie.data.datasets[0].data = [
        byType.Solar?.totalPower || 0,
        byType.Wind?.totalPower || 0,
        byType.BMS?.totalPower || 0
    ];
    charts.pie.update('none');
}

// 바 차트 업데이트
function updateBarChart(slaves) {
    charts.bar.data.labels = slaves.map(s => `Slave ${s.slaveId}`);
    charts.bar.data.datasets[0].data = slaves.map(s => s.power);
    charts.bar.data.datasets[0].backgroundColor = slaves.map(s => 
        chartColors[s.deviceType.toLowerCase()] || '#757575'
    );
    charts.bar.update('none');
}

// 온도 차트 업데이트
function updateTemperatureChart(slaves, now) {
    const maxPoints = 20;
    
    if (charts.temperature.data.labels.length >= maxPoints) {
        charts.temperature.data.labels.shift();
        charts.temperature.data.datasets[0].data.shift();
        charts.temperature.data.datasets[1].data.shift();
    }
    
    charts.temperature.data.labels.push(now);
    
    const avgAmbient = slaves.reduce((sum, s) => sum + (s.ambientTemp || 20), 0) / slaves.length;
    const avgInternal = slaves.reduce((sum, s) => sum + (s.internalTemp || 25), 0) / slaves.length;
    
    charts.temperature.data.datasets[0].data.push(avgAmbient);
    charts.temperature.data.datasets[1].data.push(avgInternal);
    
    charts.temperature.update('none');
}

// 구동시간 차트 업데이트
function updateRuntimeChart(slaves, now) {
    const maxPoints = 20;
    
    if (charts.runtime.data.labels.length >= maxPoints) {
        charts.runtime.data.labels.shift();
    }
    charts.runtime.data.labels.push(now);

    slaves.forEach(slave => {
        const label = `Slave ${slave.slaveId}`;
        let dataset = charts.runtime.data.datasets.find(ds => ds.label === label);
        
        if (!dataset) {
            const color = chartColors[slave.deviceType.toLowerCase()] || '#757575';
            dataset = {
                label: label,
                data: [],
                borderColor: color,
                backgroundColor: color + '33'
            };
            charts.runtime.data.datasets.push(dataset);
        }
        
        dataset.data.push((slave.runtime || 0) / 3600); // 시간 단위
        if (dataset.data.length > maxPoints) {
            dataset.data.shift();
        }
    });

    charts.runtime.update('none');
}

// 레이더 차트 업데이트
function updateRadarChart(slaves) {
    if (slaves.length === 0) return;
    
    charts.radar.data.labels = slaves.map(s => `Slave ${s.slaveId}`);
    charts.radar.data.datasets[0].data = slaves.map(s => s.power);
    charts.radar.update('none');
}

// 버블 차트 업데이트
function updateBubbleChart(slaves) {
    charts.bubble.data.datasets = slaves.map(slave => ({
        label: `Slave ${slave.slaveId} (${slave.deviceType})`,
        data: [{
            x: slave.internalTemp || 25,
            y: slave.power,
            r: (slave.runtime || 100) / 100
        }],
        backgroundColor: chartColors[slave.deviceType.toLowerCase()] + '80'
    }));
    charts.bubble.update('none');
}

// 관리자 패널 업데이트
function updateAdminPanel(slaves) {
    const container = document.getElementById('slave-controls');
    
    let html = '';
    slaves.forEach(slave => {
        const deviceClass = slave.deviceType.toLowerCase();
        const isOnline = slave.status === 'Online';
        
        html += `
            <div class="slave-control-item">
                <div class="slave-info">
                    <div class="slave-icon ${deviceClass}">
                        <i class="material-icons">${getDeviceIcon(slave.deviceType)}</i>
                    </div>
                    <div>
                        <strong>Slave ${slave.slaveId}</strong>
                        <br>
                        <span class="grey-text">${slave.deviceType}</span>
                    </div>
                </div>
                <div class="switch">
                    <label>
                        OFF
                        <input type="checkbox" ${isOnline ? 'checked' : ''} onchange="toggleSlave(${slave.slaveId}, this.checked)">
                        <span class="lever"></span>
                        ON
                    </label>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// 장치 아이콘 가져오기
function getDeviceIcon(deviceType) {
    const icons = {
        'Solar': 'wb_sunny',
        'Wind': 'air',
        'BMS': 'battery_charging_full'
    };
    return icons[deviceType] || 'device_unknown';
}

// Slave 전원 토글
function toggleSlave(slaveId, enable) {
    const password = document.getElementById('admin-password').value;
    
    if (password !== ADMIN_PASSWORD) {
        M.toast({html: '비밀번호가 올바르지 않습니다!', classes: 'red'});
        // 스위치 되돌리기
        setTimeout(() => {
            const checkbox = event.target;
            checkbox.checked = !enable;
        }, 100);
        return;
    }

    fetch('/api/slave/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slaveId, enable, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            M.toast({html: `Slave ${slaveId} ${enable ? '활성화' : '비활성화'} 완료`, classes: 'green'});
        } else {
            M.toast({html: data.error || '오류 발생', classes: 'red'});
        }
    })
    .catch(err => {
        M.toast({html: '서버 오류', classes: 'red'});
        console.error(err);
    });
}

// 초기화
function init() {
    // 차트 초기화
    initCharts();
    
    // WebSocket 연결
    connectWebSocket();
    
    console.log('전력제어시스템 UI 초기화 완료');
}
