// WebSocket 연결
let ws;
let charts = {};
let currentPassword = 'admin123'; // 로컬 저장소에서 로드

// 차트 색상 (다크 테마)
const chartColors = {
    solar: '#ffa726',
    wind: '#42a5f5',
    bms: '#66bb6a',
    temperature: '#ef5350',
    runtime: '#ab47bc'
};

// Chart.js 기본 설정 (다크 테마)
Chart.defaults.color = '#9e9e9e';
Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

// 페이지 로드 시
document.addEventListener('DOMContentLoaded', function() {
    // 로컬 저장소에서 비밀번호 로드
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        currentPassword = savedPassword;
    }
    
    // 모달 초기화
    M.Modal.init(document.querySelectorAll('.modal'));
    
    // 탭 초기화 (수동)
    initTabs();
    
    // 초기화
    init();
});

// 탭 수동 초기화
function initTabs() {
    const tabs = document.querySelectorAll('.tabs .tab a');
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // 모든 탭 비활성화
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            tabs.forEach(t => t.classList.remove('active'));
            
            // 선택된 탭 활성화
            document.getElementById(targetId).classList.add('active');
            this.classList.add('active');
        });
    });
}

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
        statusEl.innerHTML = '<i class="material-icons left" style="font-size: 16px;">wifi</i>연결됨';
    } else {
        statusEl.className = 'chip red white-text';
        statusEl.innerHTML = '<i class="material-icons left" style="font-size: 16px;">wifi_off</i>연결 끊김';
    }
}

// UI 업데이트
function updateUI(data) {
    const { slaves, statistics } = data;
    
    updateStatistics(statistics);
    updateSlavesTable(slaves);
    updateAllCharts(slaves, statistics);
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
                <td colspan="8" style="text-align: center; padding: 40px !important;">
                    <div class="progress"><div class="indeterminate"></div></div>
                    <p style="margin-top: 10px;">슬레이브 데이터를 기다리는 중...</p>
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
                <td>${slave.ambientTemp ? slave.ambientTemp.toFixed(1) : 'N/A'}°C</td>
                <td>${slave.internalTemp ? slave.internalTemp.toFixed(1) : 'N/A'}°C</td>
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
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'top',
                labels: { color: '#9e9e9e' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#9e9e9e' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                ticks: { color: '#9e9e9e' },
                grid: { color: 'rgba(255,255,255,0.05)' }
            }
        }
    };

    // 실시간 전력 차트
    const powerCtx = document.getElementById('powerChart').getContext('2d');
    charts.power = new Chart(powerCtx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: chartOptions
    });

    // 파이 차트
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: ['Solar', 'Wind', 'BMS'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [chartColors.solar, chartColors.wind, chartColors.bms],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'right',
                    labels: { color: '#9e9e9e' }
                }
            }
        }
    });

    // 바 차트
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
        options: chartOptions
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
                    borderColor: '#42a5f5',
                    backgroundColor: 'rgba(66, 165, 245, 0.1)',
                    fill: true
                },
                {
                    label: '내부온도',
                    data: [],
                    borderColor: '#ef5350',
                    backgroundColor: 'rgba(239, 83, 80, 0.1)',
                    fill: true
                }
            ]
        },
        options: chartOptions
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
                backgroundColor: 'rgba(66, 165, 245, 0.2)',
                borderColor: '#42a5f5',
                pointBackgroundColor: '#42a5f5'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    ticks: { color: '#9e9e9e', backdropColor: 'transparent' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#9e9e9e' }
                }
            }
        }
    });

    // 버블 차트
    const bubbleCtx = document.getElementById('bubbleChart').getContext('2d');
    charts.bubble = new Chart(bubbleCtx, {
        type: 'bubble',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { 
                    title: { display: true, text: '온도 (°C)', color: '#9e9e9e' },
                    ticks: { color: '#9e9e9e' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: { 
                    title: { display: true, text: '전력 (kW)', color: '#9e9e9e' },
                    ticks: { color: '#9e9e9e' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

// 모든 차트 업데이트
function updateAllCharts(slaves, statistics) {
    if (!slaves || slaves.length === 0) return;

    const now = new Date().toLocaleTimeString('ko-KR');

    updatePowerChart(slaves, now);
    updatePieChart(statistics);
    updateBarChart(slaves);
    updateTemperatureChart(slaves, now);
    updateRadarChart(slaves);
    updateBubbleChart(slaves);
}

// 개별 차트 업데이트 함수들
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

function updatePieChart(statistics) {
    const byType = statistics.byType || {};
    charts.pie.data.datasets[0].data = [
        byType.Solar?.totalPower || 0,
        byType.Wind?.totalPower || 0,
        byType.BMS?.totalPower || 0
    ];
    charts.pie.update('none');
}

function updateBarChart(slaves) {
    charts.bar.data.labels = slaves.map(s => `Slave ${s.slaveId}`);
    charts.bar.data.datasets[0].data = slaves.map(s => s.power);
    charts.bar.data.datasets[0].backgroundColor = slaves.map(s => 
        chartColors[s.deviceType.toLowerCase()] || '#757575'
    );
    charts.bar.update('none');
}

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

function updateRadarChart(slaves) {
    if (slaves.length === 0) return;
    
    charts.radar.data.labels = slaves.map(s => `Slave ${s.slaveId}`);
    charts.radar.data.datasets[0].data = slaves.map(s => s.power);
    charts.radar.update('none');
}

function updateBubbleChart(slaves) {
    charts.bubble.data.datasets = slaves.map(slave => ({
        label: `Slave ${slave.slaveId} (${slave.deviceType})`,
        data: [{
            x: slave.internalTemp || 25,
            y: slave.power,
            r: Math.min((slave.runtime || 100) / 100, 20)
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
                        <strong style="color: #e0e0e0;">Slave ${slave.slaveId}</strong>
                        <br>
                        <span style="color: #9e9e9e;">${slave.deviceType}</span>
                    </div>
                </div>
                <div class="switch">
                    <label style="color: #9e9e9e;">
                        OFF
                        <input type="checkbox" ${isOnline ? 'checked' : ''} onchange="toggleSlave(${slave.slaveId}, this.checked, event)">
                        <span class="lever"></span>
                        ON
                    </label>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getDeviceIcon(deviceType) {
    const icons = {
        'Solar': 'wb_sunny',
        'Wind': 'air',
        'BMS': 'battery_charging_full'
    };
    return icons[deviceType] || 'device_unknown';
}

// Slave 전원 토글
function toggleSlave(slaveId, enable, event) {
    const password = document.getElementById('admin-password').value;
    
    if (password !== currentPassword) {
        M.toast({html: '비밀번호가 올바르지 않습니다!', classes: 'red'});
        event.target.checked = !enable;
        return;
    }

    fetch('/api/slave/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slaveId, enable, password: currentPassword })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            M.toast({html: `Slave ${slaveId} ${enable ? '활성화' : '비활성화'} 완료`, classes: 'green'});
        } else {
            M.toast({html: data.error || '오류 발생', classes: 'red'});
            event.target.checked = !enable;
        }
    })
    .catch(err => {
        M.toast({html: '서버 오류', classes: 'red'});
        console.error(err);
        event.target.checked = !enable;
    });
}

// 비밀번호 변경
function changePassword() {
    const currentPw = document.getElementById('current-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('confirm-password').value;
    
    if (!currentPw || !newPw || !confirmPw) {
        M.toast({html: '모든 필드를 입력해주세요', classes: 'orange'});
        return;
    }
    
    if (currentPw !== currentPassword) {
        M.toast({html: '현재 비밀번호가 올바르지 않습니다', classes: 'red'});
        return;
    }
    
    if (newPw !== confirmPw) {
        M.toast({html: '새 비밀번호가 일치하지 않습니다', classes: 'red'});
        return;
    }
    
    if (newPw.length < 4) {
        M.toast({html: '비밀번호는 최소 4자 이상이어야 합니다', classes: 'orange'});
        return;
    }
    
    // 서버에 비밀번호 변경 요청
    fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentPassword = newPw;
            localStorage.setItem('adminPassword', newPw);
            M.toast({html: '비밀번호가 변경되었습니다', classes: 'green'});
            
            // 입력 필드 초기화
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
            // 모달 닫기
            const modal = M.Modal.getInstance(document.getElementById('password-modal'));
            modal.close();
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
    initCharts();
    connectWebSocket();
    console.log('전력제어시스템 UI 초기화 완료');
}
