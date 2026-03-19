# 🤖 SenpaiHelpBot

A complete Telegram group management bot — mirrors all Group Help bot features from the screenshots, built for deployment on Render with MongoDB Atlas.

---

## ✨ Features

### Settings Menu (matches screenshots exactly)
| Setting | Description |
|---------|-------------|
| 📋 Regulation | Set group rules shown via `/rules` |
| 📩 Anti-Spam | Block Telegram links, forwards, quotes, all links |
| 👋 Welcome | Custom welcome messages with `{user}` / `{group}` vars |
| 🌧 Anti-Flood | Punish users sending too many messages too fast |
| 👋 Goodbye | Custom goodbye messages when users leave |
| 🕉 Alphabets | Block Arabic / Cyrillic / Chinese / Latin alphabets |
| 🧠 Captcha | Verify new members before they can send messages |
| 🔍 Checks | Obligation checks and name blocks |
| 🆘 @Admin | Report system — users can report via @admin or /report |
| 🔒 Blocks | Blacklist, Bot block, Join block, Leave block, etc. |
| 🎬 Media | Block any media type with custom punishment |
| ❗ Warns | Warning system with configurable max warns & punishment |
| 🌙 Night | Night mode — silence or delete media at night |
| 🔐 Approval | Auto-approve join requests |
| 🗑 Deleting | Control what messages the bot auto-deletes |

### Commands
| Command | Who | Description |
|---------|-----|-------------|
| `/start` | All | Start the bot |
| `/help` | All | Show all commands |
| `/rules` | All | Show group rules |
| `/id` | All | Show Telegram ID |
| `/info` | All | Show user info |
| `/settings` | Admins | Open settings panel |
| `/warn` | Admins | Warn a user (reply) |
| `/unwarn` | Admins | Remove a warning (reply) |
| `/warnlist` | Admins | List warned users |
| `/ban` | Admins | Ban a user (reply) |
| `/unban` | Admins | Unban a user |
| `/kick` | Admins | Kick a user (reply) |
| `/mute [mins]` | Admins | Mute a user (reply) |
| `/unmute` | Admins | Unmute a user (reply) |
| `/addblacklist` | Admins | Add word to blacklist |
| `/removeblacklist` | Admins | Remove from blacklist |
| `/pin` | Admins | Pin a message (reply) |
| `/unpin` | Admins | Unpin message |
| `@admin` / `/report` | Users | Report to admins |

---

## 🚀 Deployment

### Step 1 — Get a Bot Token
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Name: `Senpai Help Bot`
4. Username: `senpaihelppbot`
5. Copy the token

### Step 2 — Set Up MongoDB Atlas
See [MONGODB.md](./MONGODB.md) for full instructions.

### Step 3 — Deploy to Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`
5. Add environment variables:
   - `BOT_TOKEN` = your bot token
   - `MONGODB_URI` = your MongoDB connection string
6. Click **Deploy**

### Step 4 — Keep Alive with UptimeRobot
See [UPTIME_ROBOT.md](./UPTIME_ROBOT.md) for full instructions.

Ping URL: `https://your-app.onrender.com/ping`

---

## 🔧 Local Development

```bash
# Clone and install
git clone https://github.com/yourname/senpaihelppbot
cd senpaihelppbot
npm install

# Configure
cp .env.example .env
# Edit .env with your BOT_TOKEN and MONGODB_URI

# Run
npm run dev
```

---

## 📁 Project Structure

```
senpaihelppbot/
├── src/
│   ├── index.js                    # Main entry point
│   ├── handlers/
│   │   ├── settingsHandler.js      # /settings + all inline keyboards
│   │   ├── moderationHandler.js    # Auto-moderation (flood, spam, media)
│   │   └── commandHandler.js       # /warn /ban /kick etc.
│   ├── models/
│   │   ├── GroupSettings.js        # MongoDB schema for all settings
│   │   ├── UserWarning.js          # Warning records
│   │   ├── FloodTracker.js         # In-memory flood detection
│   │   └── CaptchaTracker.js       # In-memory captcha pending
│   └── utils/
│       ├── helpers.js              # Shared utilities
│       ├── keyboards.js            # All inline keyboard builders
│       ├── database.js             # MongoDB connection
│       └── server.js               # Express health-check server
├── render.yaml                     # Render deployment config
├── PORT.md                         # Port documentation
├── MONGODB.md                      # MongoDB setup guide
├── UPTIME_ROBOT.md                 # UptimeRobot setup guide
├── .env.example                    # Environment variable template
├── .gitignore
└── package.json
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | ✅ | Telegram bot token from @BotFather |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `PORT` | Auto | Set by Render automatically (default: 3000) |
| `ADMIN_ID` | Optional | Your Telegram ID for bot owner features |

---

## 🛡️ Bot Permissions Required

When adding to a group, promote the bot as admin with:
- ✅ Delete messages
- ✅ Ban users
- ✅ Restrict members
- ✅ Pin messages
- ✅ Invite users via link (for approval mode)

---

## 📄 License
MIT
