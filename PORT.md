# SenpaiHelpBot Port Configuration
# This file documents the port settings used by the bot

# Default port for local development
DEFAULT_PORT=3000

# Render automatically injects PORT environment variable
# The bot reads process.env.PORT first, falling back to DEFAULT_PORT

# Endpoints:
# GET /        - Health check (returns bot status JSON)
# GET /ping    - UptimeRobot ping endpoint  
# GET /status  - Detailed status with memory/uptime info

# For UptimeRobot, use the /ping endpoint:
# https://your-render-app.onrender.com/ping
