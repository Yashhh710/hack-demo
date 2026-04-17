// --- Technical Mock Data ---
let mockData = [
    { day: '04.11', score: 25.42, sleep: 8.0, energy: 8, mood: 5, screen: 4.2 },
    { day: '04.12', score: 32.18, sleep: 7.5, energy: 7, mood: 4, screen: 6.1 },
    { day: '04.13', score: 45.67, sleep: 6.0, energy: 5, mood: 3, screen: 8.4 },
    { day: '04.14', score: 38.90, sleep: 7.0, energy: 6, mood: 4, screen: 5.5 },
    { day: '04.15', score: 55.31, sleep: 5.5, energy: 4, mood: 2, screen: 10.2 },
    { day: '04.16', score: 48.12, sleep: 9.0, energy: 6, mood: 4, screen: 4.0 },
    { day: '04.17', score: 40.05, sleep: 8.0, energy: 7, mood: 5, screen: 3.5 }
];

// --- HUD Config ---
const accentColors = {
    cyan: '#06b6d4',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e'
};

const BACKEND_URL = 'http://localhost:5000/api/screentime';

// --- DOM Elements ---
const scoreEl = document.getElementById('burnout-score');
const statusEl = document.getElementById('status-txt');
const characterImg = document.getElementById('mood-character');
const insightsList = document.getElementById('insights-list');
const suggestionsList = document.getElementById('suggestions-list');
const checkinForm = document.getElementById('checkin-form');
const timeEl = document.getElementById('current-time');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const latest = mockData[mockData.length - 1];
    // Immediate sync to prevent jumpy layout
    scoreEl.textContent = latest.score.toFixed(2);
    updateHUD(latest);
    initChart();
    setupFormListeners();
    startClock();
    fetchDesktopStats(); // Initial fetch
    setInterval(fetchDesktopStats, 5000); // Poll every 5 seconds
});

async function fetchDesktopStats() {
    try {
        const response = await fetch(BACKEND_URL);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const latestDesktop = data[data.length - 1];
            const hours = latestDesktop.totalTime / 3600;
            
            // Inject into HUD
            const screenTimeStat = document.getElementById('stat-screen-txt');
            if (screenTimeStat) {
                screenTimeStat.textContent = hours.toFixed(2).padStart(5, '0');
            }
            
            // Recalculate burnout with real data
            const latest = mockData[mockData.length - 1];
            const liveScore = calculateBurnout(hours, latest.sleep, latest.energy);
            
            // Smoothly update if changed
            if (Math.abs(parseFloat(scoreEl.innerText) - liveScore) > 0.01) {
                animateValue(scoreEl, parseFloat(scoreEl.innerText), liveScore, 800, true);
            }
        }
    } catch (err) {
        console.warn('Local desktop tracker not reachable. Using simulated data.');
    }
}

function startClock() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });
        const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '.');
        timeEl.textContent = `${timeStr} // ${dateStr}`;
    }, 1000);
}

// --- Burnout Calculation ---
function calculateBurnout(screen, sleep, energy) {
    const normScreen = Math.min((screen / 12) * 100, 100);
    const normSleep = Math.max((1 - (sleep / 9)) * 100, 0); 
    const normEnergy = Math.max((1 - (energy / 10)) * 100, 0);

    const score = (normScreen * 0.4) + (normSleep * 0.3) + (normEnergy * 0.3);
    return score; // Keep decimal for tech look
}

// --- HUD UI Functions ---
function updateHUD(data) {
    const score = data.score;
    
    // Value animations
    animateValue(scoreEl, parseFloat(scoreEl.innerText) || 0, score, 1000, true);
    
    // Status Logic
    let statusText, colorClass, imgPath;
    if (score <= 40) {
        statusText = 'OPTIMAL';
        colorClass = 'cyan-text';
        imgPath = 'models/1.png';
    } else if (score <= 70) {
        statusText = 'CAUTION';
        colorClass = 'amber-text';
        imgPath = 'models/2.png';
    } else {
        statusText = 'CRITICAL';
        colorClass = 'rose-text';
        imgPath = 'models/3.png';
    }
    
    statusEl.textContent = statusText;
    statusEl.className = `status-label ${colorClass}`;
    characterImg.src = imgPath;
    
    // Tech Stats Text
    document.getElementById('stat-sleep-txt').textContent = data.sleep.toFixed(2).padStart(5, '0');
    document.getElementById('stat-energy-txt').textContent = `${data.energy}.0/10`;
    document.getElementById('stat-mood-txt').textContent = `0${data.mood}.00`;
    
    // Progress Bars
    createSegmentedProgress('sleep-progress', (data.sleep / 12) * 100);
    createSegmentedProgress('energy-progress', data.energy * 10);
    createSegmentedProgress('mood-progress', data.mood * 20);

    updateInsights(mockData);
    updateSuggestions(score);
}

function createSegmentedProgress(containerId, percent) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const segmentCount = 20;
    const activeSegments = Math.round((percent / 100) * segmentCount);
    
    for (let i = 0; i < segmentCount; i++) {
        const seg = document.createElement('div');
        seg.className = `progress-segment ${i < activeSegments ? 'active' : ''}`;
        container.appendChild(seg);
    }
}

function updateInsights(data) {
    const list = document.getElementById('insights-list');
    list.innerHTML = '';
    const latest = data[data.length - 1];
    
    const messages = [
        `> ANALYZING BIOMETRIC HASH: VALID`,
        `> SLEEP_EFFICIENCY: ${(latest.sleep/9*100).toFixed(1)}%`,
        `> NEURAL_LOAD: ${latest.score > 50 ? 'HIGH' : 'STABLE'}`,
        `> CORE_TEMPERATURE: 36.6°C`,
        `> STRESS_VECTORS: ${latest.score > 60 ? 'DETECTED' : 'MINIMAL'}`
    ];

    messages.forEach(msg => {
        const li = document.createElement('li');
        li.textContent = msg;
        list.appendChild(li);
    });
}

function updateSuggestions(score) {
    const container = document.getElementById('suggestions-list');
    container.innerHTML = '';
    
    let suggestions = [];
    if (score > 70) {
        suggestions = ["[!] INITIATE BLACKOUT PROTOCOL", "[!] EMERGENCY REST PERIOD REQUIRED", "[!] TERMINATE ALL SCREEN INTERFACES"];
    } else if (score > 40) {
        suggestions = ["> REDUCE COGNITIVE OVERLOAD", "> OPTIMIZE HYDRATION LEVEL", "> ACTIVATE LOW-POWER MODE"];
    } else {
        suggestions = ["> PARAMETERS WITHIN NORMAL RANGE", "> MAINTAIN CURRENT BIO-RHYTHM"];
    }
    
    suggestions.forEach(s => {
        const p = document.createElement('p');
        p.textContent = s;
        p.style.marginBottom = '5px';
        container.appendChild(p);
    });
}

// --- Chart setup ---
let burnoutChart;
function initChart() {
    const ctx = document.getElementById('burnoutChart').getContext('2d');
    
    burnoutChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mockData.map(d => d.day),
            datasets: [{
                data: mockData.map(d => d.score),
                borderColor: '#06b6d4',
                borderWidth: 2,
                tension: 0, // Hard angles for tech look
                pointBackgroundColor: '#06b6d4',
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: 'rgba(6, 182, 212, 0.05)' },
                    ticks: { color: '#475569', font: { size: 10 } }
                },
                x: {
                    grid: { color: 'rgba(6, 182, 212, 0.05)' },
                    ticks: { color: '#475569', font: { size: 10 } }
                }
            }
        }
    });
}

// --- Form & Utils ---
function setupFormListeners() {
    ['sleep', 'energy'].forEach(id => {
        const input = document.getElementById(`${id}-range`);
        const value = document.getElementById(`${id}-val`);
        input.addEventListener('input', () => value.textContent = input.value);
    });

    let selectedMood = 3;
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.emoji-btn').forEach(b => b.style.borderColor = 'rgba(6, 182, 212, 0.2)');
            btn.style.borderColor = '#06b6d4';
            selectedMood = parseInt(btn.dataset.mood);
        });
    });

    checkinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const sleep = parseFloat(document.getElementById('sleep-range').value);
        const energy = parseInt(document.getElementById('energy-range').value);
        const newScore = calculateBurnout(4, sleep, energy); // Default screen time for example
        
        const newData = { day: 'NOW', score: newScore, sleep, energy, mood: selectedMood };
        mockData.push(newData);
        if (mockData.length > 10) mockData.shift();
        
        updateHUD(newData);
        
        // Simulate System Re-Scan
        const scanLine = document.querySelector('.scan-line');
        if (scanLine) {
            scanLine.style.animation = 'none';
            void scanLine.offsetWidth; // trigger reflow
            scanLine.style.animation = 'scan-move 1.5s linear 2';
        }
        
        document.querySelectorAll('.data-node').forEach(node => {
            node.style.boxShadow = '0 0 20px #fff';
            setTimeout(() => node.style.boxShadow = '', 2000);
        });

        burnoutChart.data.labels = mockData.map(d => d.day);
        burnoutChart.data.datasets[0].data = mockData.map(d => d.score);
        burnoutChart.update();
    });
}

function animateValue(obj, start, end, duration, decimals = false) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = progress * (end - start) + start;
        obj.innerHTML = decimals ? val.toFixed(2).padStart(5, '0') : Math.floor(val);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// --- System Monitor Background Tasks ---
trackScreenTime();
