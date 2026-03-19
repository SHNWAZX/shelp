const mongoose = require('mongoose');

const groupSettingsSchema = new mongoose.Schema({
  chatId: { type: String, required: true, unique: true },
  chatTitle: { type: String, default: '' },
  language: { type: String, default: 'en' },

  regulation: {
    message: { type: String, default: 'No rules set yet.' },
    commandPermissions: { type: String, default: 'all' }
  },

  welcome: {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: 'Welcome {user} to {group}! 👋' },
    mediaFileId: { type: String, default: '' },
    mediaType: { type: String, default: '' },
    urlButtons: [{ text: String, url: String }],
    deleteLastMessage: { type: Boolean, default: false },
    topicId: { type: Number, default: 0 }
  },

  goodbye: {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: 'Goodbye {user}! 👋' },
    sendPrivate: { type: Boolean, default: false },
    deleteLastMessage: { type: Boolean, default: false }
  },

  antispam: {
    telegramLinks: { type: Boolean, default: false },
    forwarding: { type: Boolean, default: false },
    quotes: { type: Boolean, default: false },
    totalLinksBlock: { type: Boolean, default: false }
  },

  antiflood: {
    enabled: { type: Boolean, default: false },
    messages: { type: Number, default: 5 },
    timeSeconds: { type: Number, default: 3 },
    punishment: { type: String, default: 'deletion' },
    deleteMessages: { type: Boolean, default: true }
  },

  alphabets: {
    arabic:   { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    cyrillic: { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    chinese:  { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } },
    latin:    { enabled: { type: Boolean, default: false }, punishment: { type: String, default: 'deletion' } }
  },

  captcha: {
    enabled: { type: Boolean, default: false },
    punishment: { type: String, default: 'kick' },
    timeoutSeconds: { type: Number, default: 60 },
    deleteServiceMessage: { type: Boolean, default: false }
  },

  checks: {
    obligations: {
      surname: { type: Boolean, default: false },
      username: { type: Boolean, default: false },
      profilePicture: { type: Boolean, default: false },
      channelObligation: { type: Boolean, default: false },
      obligationToAdd: { type: Boolean, default: false }
    },
    nameBlocks: {
      arabic: { type: Boolean, default: false },
      chinese: { type: Boolean, default: false },
      russian: { type: Boolean, default: false },
      spam: { type: Boolean, default: false }
    },
    checkAtJoin: { type: Boolean, default: true },
    deleteMessages: { type: Boolean, default: false }
  },

  adminReport: {
    enabled: { type: Boolean, default: true },
    sendTo: { type: String, default: 'founder' },
    tagFounder: { type: Boolean, default: false },
    tagAdmins: { type: Boolean, default: false }
  },

  blocks: {
    blacklist: {
      words: [String],
      punishment: { type: String, default: 'deletion' },
      deleteMessages: { type: Boolean, default: true }
    },
    botBlock: { type: Boolean, default: false },
    joinBlock: { type: Boolean, default: false },
    leaveBlock: { type: Boolean, default: false },
    joinLeaveBlock: { type: Boolean, default: false },
    multipleJoinsBlock: { type: Boolean, default: false }
  },

  bannedWords: {
    penalty: { type: String, default: 'off' },
    deletion: { type: Boolean, default: true },
    words: [String],
    words2: [String]
  },

  media: {
    story: { type: String, default: 'off' },
    photo: { type: String, default: 'off' },
    video: { type: String, default: 'off' },
    album: { type: String, default: 'off' },
    gif: { type: String, default: 'off' },
    voice: { type: String, default: 'off' },
    audio: { type: String, default: 'off' },
    sticker: { type: String, default: 'off' },
    animatedStickers: { type: String, default: 'off' },
    animatedGames: { type: String, default: 'off' },
    animatedEmoji: { type: String, default: 'off' },
    premiumEmoji: { type: String, default: 'off' },
    file: { type: String, default: 'off' }
  },

  warns: {
    maxWarns: { type: Number, default: 3 },
    punishment: { type: String, default: 'mute' },
    muteDuration: { type: Number, default: 0 }
  },

  nightMode: {
    enabled: { type: Boolean, default: false },
    deleteMedias: { type: Boolean, default: false },
    globalSilence: { type: Boolean, default: false }
  },

  porn: { enabled: { type: Boolean, default: false } },
  tag: { enabled: { type: Boolean, default: false }, message: { type: String, default: '' } },
  link: { enabled: { type: Boolean, default: false } },
  approvalMode: { autoApproval: { type: Boolean, default: false } },

  deletingMessages: {
    commands: { type: Boolean, default: false },
    globalSilence: { type: Boolean, default: false },
    editChecks: { type: Boolean, default: false },
    serviceMessages: { type: Boolean, default: false },
    scheduledDeletion: { type: Boolean, default: false },
    blockCancellation: { type: Boolean, default: false }
  },

  topicId: { type: Number, default: 0 },

  recurringMessages: [{
    id: String,
    text: String,
    intervalMinutes: { type: Number, default: 60 },
    enabled: { type: Boolean, default: true },
    lastSent: { type: Date, default: null }
  }],

  maskedUsers: {
    enabled: { type: Boolean, default: false },
    deleteMessages: { type: Boolean, default: false }
  },

  messageLength: {
    penalty: { type: String, default: 'off' },
    deletion: { type: Boolean, default: false },
    minLength: { type: Number, default: 0 },
    maxLength: { type: Number, default: 2000 }
  },

  personalCommands: [{ command: String, response: String, enabled: { type: Boolean, default: true } }],
  personalReplies: [{ trigger: String, response: String, enabled: { type: Boolean, default: true } }],
  commandAliases: [{ alias: String, target: String }],

  logChannelId: { type: String, default: '' },
  supportGroupLink: { type: String, default: '' },
  channelLink: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

groupSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GroupSettings', groupSettingsSchema);
