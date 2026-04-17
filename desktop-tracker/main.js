const { app, BrowserWindow, powerMonitor, Tray, Menu } = require('electron');
const activeWin = require('active-win');
const axios = require('axios');
const path = require('path');

let tray = null;
let mainWindow = null;
let stats = {
    totalActiveTime: 0,
    apps: {},
    date: new Date().toISOString().split('T')[0]
};

const API_URL = 'http://localhost:5000/api/screentime';

async function trackActivity() {
    // 1. Check for idle
    const idleTime = powerMonitor.getSystemIdleTime();
    if (idleTime > 60) {
        // More than 1 minute idle
        return;
    }

    // 2. Detect active window
    const window = await activeWin();
    if (window) {
        const appName = window.owner.name;
        stats.totalActiveTime += 1;
        stats.apps[appName] = (stats.apps[appName] || 0) + 1;
    }
}

async function syncWithBackend() {
    try {
        await axios.post(API_URL, {
            totalTime: stats.totalActiveTime,
            activeApps: Object.entries(stats.apps).map(([name, time]) => ({ name, time })),
            date: stats.date
        });
        console.log('[Desktop] Activity synced to backend');
    } catch (error) {
        console.error('[Desktop] Backend sync failed:', error.message);
    }
}

app.on('ready', () => {
    // Create hidden window
    mainWindow = new BrowserWindow({ show: false });

    // Set up Tray icon
    tray = new Tray(path.join(__dirname, 'icon.png')); // Ensure you have an icon.png
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Tracking Active...', enabled: false },
        { label: 'Sync Now', click: syncWithBackend },
        { type: 'separator' },
        { label: 'Quit', click: () => { app.quit(); } }
    ]);
    tray.setToolTip('Burnout System Tracker');
    tray.setContextMenu(contextMenu);

    // Track every second
    setInterval(trackActivity, 1000);

    // Sync every 30 seconds
    setInterval(syncWithBackend, 30000);
});

// Avoid app quitting when windows close
app.on('window-all-closed', (e) => {
    e.preventDefault();
});
