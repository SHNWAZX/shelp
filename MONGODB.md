# MongoDB Setup for SenpaiHelpBot

## Free MongoDB Atlas Setup

### 1. Create Account
1. Go to https://mongodb.com/atlas
2. Sign up for a free account

### 2. Create a Cluster
1. Click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select a cloud provider and region (choose closest to your Render region)
4. Click "Create"

### 3. Create Database User
1. Go to "Database Access" in the left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username: `senpaibot`
5. Set a strong password (save it!)
6. Select "Read and write to any database"
7. Click "Add User"

### 4. Whitelist All IPs (for Render)
1. Go to "Network Access" in the left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 5. Get Connection String
1. Go to "Database" in the left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

### 6. Format the Connection String
Replace `<password>` with your actual password:
```
mongodb+srv://senpaibot:<password>@cluster0.xxxxx.mongodb.net/senpaihelppbot?retryWrites=true&w=majority
```

### 7. Add to Environment Variables
In Render dashboard or your .env file:
```
MONGODB_URI=mongodb+srv://senpaibot:yourpassword@cluster0.xxxxx.mongodb.net/senpaihelppbot
```

## Database Collections (Auto-created)
- `groupsettings` - All group configuration
- `userwarnings` - User warning records

## Indexes (Auto-created by Mongoose)
- `groupsettings.chatId` - Unique index
- `userwarnings.chatId + userId` - Unique compound index
