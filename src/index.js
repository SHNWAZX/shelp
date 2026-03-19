require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('./utils/database');
const { startServer } = require('./utils/server');
const { startScheduler } = require('./utils/scheduler');
const { handleSettingsCommand, handleCallback: handleSettingsCallback, handlePendingInput } = require('./handlers/settingsHandler');
const { handleGroupMessage, handleNewMember, handleLeftMember, handleChatJoinRequest } = require('./handlers/moderationHandler');
const { handleCommands, handleHelpCallback, handlePrivateCallback } = require('./handlers/commandHandler');
const { resolveCaptcha } = require('./models/CaptchaTracker');
const { getGroupSettings, isAdmin, formatMessage } = require('./utils/helpers');
const { t } = require('./utils/i18n');

if (!process.env.BOT_TOKEN) { console.error('❌ BOT_TOKEN required'); process.exit(1); }
if (!process.env.MONGODB_URI) { console.error('❌ MONGODB_URI required'); process.exit(1); }

async function main() {
  await connectDB();

  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

  startServer();
  startScheduler(bot);

  const me = await bot.getMe();
  console.log(`🤖 @${me.username} started (ID: ${me.id})`);

  // ── MESSAGE HANDLER ───────────────────────────────────────────
  bot.on('message', async (msg) => {
    try {
      if (!msg?.from) return;

      // Handle pending input (multi-step settings input)
      if (msg.chat.type !== 'private' || msg.text) {
        const handled = await handlePendingInput(bot, msg);
        if (handled) return;
      }

      // Welcome media upload
      if (msg.chat.type !== 'private' && (msg.photo || msg.video || msg.animation) && await isAdmin(bot, msg.chat.id, msg.from.id)) {
        const { getPendingInput, clearPendingInput } = require('./handlers/settingsHandler');
        const state = getPendingInput(msg.from.id);
        if (state?.action === 'set_welcome_media') {
          clearPendingInput(msg.from.id);
          const settings = await getGroupSettings(msg.chat.id);
          if (msg.photo) { settings.welcome.mediaFileId = msg.photo[msg.photo.length - 1].file_id; settings.welcome.mediaType = 'photo'; }
          else if (msg.video) { settings.welcome.mediaFileId = msg.video.file_id; settings.welcome.mediaType = 'video'; }
          else if (msg.animation) { settings.welcome.mediaFileId = msg.animation.file_id; settings.welcome.mediaType = 'animation'; }
          await settings.save();
          return bot.sendMessage(msg.chat.id, '✅ Welcome media saved!');
        }
      }

      // New/left members
      if (msg.new_chat_members) { await handleNewMember(bot, msg); return; }
      if (msg.left_chat_member) { await handleLeftMember(bot, msg); return; }

      // Commands
      if (msg.text?.startsWith('/') || msg.text?.includes('@admin') || msg.text?.includes('@admins')) {
        await handleCommands(bot, msg);
        return;
      }

      // Group message moderation
      if (msg.chat.type !== 'private') {
        await handleGroupMessage(bot, msg);
      }

    } catch (err) {
      console.error('Message error:', err.message);
    }
  });

  // ── CALLBACK QUERY HANDLER ────────────────────────────────────
  bot.on('callback_query', async (query) => {
    try {
      const data = query.data;
      const chatId = query.message.chat.id;
      const messageId = query.message.message_id;

      // ── Captcha verification ──────────────────────────────────
      if (data.startsWith('captcha_verify:')) {
        const targetUserId = parseInt(data.split(':')[1]);
        const callerId = query.from.id;

        if (callerId !== targetUserId) {
          return bot.answerCallbackQuery(query.id, { text: '❌ This captcha is not for you!', show_alert: true });
        }

        const captchaData = resolveCaptcha(chatId, targetUserId);
        if (!captchaData) {
          return bot.answerCallbackQuery(query.id, { text: '⏱ Captcha expired!', show_alert: true });
        }

        // Restore full permissions
        try {
          await bot.restrictChatMember(chatId, targetUserId, {
            permissions: {
              can_send_messages: true, can_send_audios: true, can_send_documents: true,
              can_send_photos: true, can_send_videos: true, can_send_voice_notes: true,
              can_send_other_messages: true, can_add_web_page_previews: true, can_send_polls: true
            }
          });
        } catch {}

        bot.deleteMessage(chatId, messageId).catch(() => {});
        await bot.answerCallbackQuery(query.id, { text: '✅ Verified! Welcome!' });

        const settings = await getGroupSettings(chatId);
        const lang = settings.language || 'en';
        const successText = t(lang, 'captcha_success', { name: query.from.first_name });
        const sentMsg = await bot.sendMessage(chatId, successText, { parse_mode: 'Markdown' });

        // Send welcome message after captcha
        if (settings.welcome?.enabled) {
          const welcomeText = formatMessage(settings.welcome.text || t(lang, 'welcome_default'), query.from, query.message.chat);
          bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
        }

        setTimeout(() => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}), 5000);
        return;
      }

      // ── Help callbacks ────────────────────────────────────────
      if (data.startsWith('help:')) {
        return handleHelpCallback(bot, query);
      }

      // ── Private callbacks ─────────────────────────────────────
      if (data.startsWith('private:')) {
        const handled = await handlePrivateCallback(bot, query);
        if (handled) return;
      }

      // ── Settings callbacks ────────────────────────────────────
      await handleSettingsCallback(bot, query);

    } catch (err) {
      console.error('Callback error:', err.message);
      bot.answerCallbackQuery(query.id, { text: '❌ An error occurred.' }).catch(() => {});
    }
  });

  // ── CHAT JOIN REQUEST (Auto-approval) ─────────────────────────
  bot.on('chat_join_request', async (joinRequest) => {
    try {
      await handleChatJoinRequest(bot, joinRequest);
    } catch (err) {
      console.error('Join request error:', err.message);
    }
  });

  // ── MY CHAT MEMBER (detect when bot added/removed or user banned) ─
  bot.on('my_chat_member', async (update) => {
    try {
      const chatId = update.chat.id;
      const newStatus = update.new_chat_member.status;

      if (newStatus === 'member' || newStatus === 'administrator') {
        // Bot was added to group
        if (newStatus === 'administrator') {
          const settings = await getGroupSettings(chatId);
          settings.chatTitle = update.chat.title || '';
          await settings.save();
          bot.sendMessage(chatId,
            `👋 Hello! I'm *SenpaiHelpBot*!\n\nI'm now active in this group.\nUse /settings to configure me, and /help to see all commands.\n\n📋 Don't forget to set up /rules for your group!`,
            { parse_mode: 'Markdown' }
          ).catch(() => {});
        }
      }
    } catch (err) {
      console.error('my_chat_member error:', err.message);
    }
  });

  // ── CHAT MEMBER (detect bans to notify) ──────────────────────
  bot.on('chat_member', async (update) => {
    try {
      const newStatus = update.new_chat_member.status;
      const oldStatus = update.old_chat_member.status;
      const bannedUser = update.new_chat_member.user;

      // Someone just got banned
      if (newStatus === 'kicked' && oldStatus !== 'kicked' && update.by) {
        const settings = await getGroupSettings(update.chat.id);
        const lang = settings.language || 'en';
        // Try to DM the banned user
        try {
          await bot.sendMessage(bannedUser.id, t(lang, 'ban_access_denied'), { parse_mode: 'Markdown' });
        } catch {} // User may have blocked the bot
      }
    } catch {}
  });

  // ── ERROR HANDLERS ────────────────────────────────────────────
  bot.on('polling_error', (err) => console.error('Polling error:', err.message));
  bot.on('error', (err) => console.error('Bot error:', err.message));

  process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason?.message || reason));
  process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); bot.stopPolling(); process.exit(0); });
  process.on('SIGTERM', () => { console.log('\n🛑 Terminating...'); bot.stopPolling(); process.exit(0); });

  console.log('✅ SenpaiHelpBot fully running!');
  console.log('📋 /start /help /settings /rules /warn /ban /kick /mute and more');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
