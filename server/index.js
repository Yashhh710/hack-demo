const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data for MVP
let screenTimeData = [];

// GET screen time data
app.get('/api/screentime', (req, res) => {
    res.json(screenTimeData);
});

// POST screen time data
app.post('/api/screentime', (req, res) => {
    const { totalTime, activeApps, date } = req.body;
    
    // Check if we already have data for this date
    const existingIndex = screenTimeData.findIndex(d => d.date === date);
    
    if (existingIndex !== -1) {
        screenTimeData[existingIndex] = { totalTime, activeApps, date };
    } else {
        screenTimeData.push({ totalTime, activeApps, date });
    }
    
    console.log(`[Server] Received data for ${date}: ${totalTime}s`);
    res.status(200).send({ message: "Data received successfully" });
});

app.listen(PORT, () => {
    console.log(`[Server] Technical backend running at http://localhost:${PORT}`);
});
