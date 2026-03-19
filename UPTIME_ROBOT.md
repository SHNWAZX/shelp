# UptimeRobot Configuration for SenpaiHelpBot

## Setup Instructions

### 1. Deploy to Render
- Push repo to GitHub
- Connect to Render.com
- Create "Web Service" from your repo
- Add environment variables: BOT_TOKEN, MONGODB_URI
- Deploy

### 2. Get your Render URL
After deployment, your app URL will be:
```
https://senpaihelppbot.onrender.com
```
(Replace with your actual Render app name)

### 3. Configure UptimeRobot
1. Go to https://uptimerobot.com and create a free account
2. Click "Add New Monitor"
3. Settings:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** SenpaiHelpBot
   - **URL:** `https://your-app-name.onrender.com/ping`
   - **Monitoring Interval:** Every 5 minutes
4. Click "Create Monitor"

### Why this is needed
Render's free tier spins down services after 15 minutes of inactivity.
UptimeRobot pings your bot every 5 minutes to keep it alive 24/7.

### Ping Endpoint Response
```json
{
  "status": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Health Check Response (GET /)
```json
{
  "status": "online",
  "bot": "SenpaiHelpBot",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## Alternative: Self-ping (built-in)
If you have a paid Render plan or use Railway/Fly.io, 
the bot will stay alive without UptimeRobot.
