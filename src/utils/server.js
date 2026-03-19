const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'online', bot: 'SenpaiHelpBot', uptime: process.uptime() }));
app.get('/ping', (req, res) => res.json({ status: 'pong', timestamp: new Date().toISOString() }));
app.get('/status', (req, res) => res.json({ status: 'running', bot: '@senpaihelppbot', node: process.version, memory: process.memoryUsage(), uptime: Math.floor(process.uptime()) }));

function startServer(port = process.env.PORT || 3000) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🌐 Web server on port ${port} | Ping: http://localhost:${port}/ping`);
  });
}

module.exports = { startServer, app };
