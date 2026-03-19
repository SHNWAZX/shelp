const { isAdmin, getGroupSettings, applyPunishment, getUserMention } = require('../utils/helpers');
const { addWarn, logEvent } = require('./moderationHandler');
const { t } = require('../utils/i18n');
const UserWarning = require('../models/UserWarning');

async function handleCommands(bot, msg) {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  const isPrivate = msg.chat.type === 'private';

  // ── /start ────────────────────────────────────────────────────
  if (text.startsWith('/start')) {
    if (isPrivate) {
      return bot.sendMessage(chatId,
        `👋 *Hello!*\n[SenpaiHelpBot](https://t.me/senpaihelppbot) is the most complete Bot to help you *manage* your groups easily and *safely*!\n\n👉 *Add me in a Supergroup* and promote me as Admin!\n\n❓ *WHICH ARE THE COMMANDS?* ❓\nPress /help to see *all the commands*!`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Add me to a Group ➕', url: `https://t.me/senpaihelppbot?startgroup=true` }],
              [{ text: '⚙️ Manage group Settings ✍️', callback_data: 'private:manage_settings' }],
              [{ text: '👥 Group', url: 'https://t.me/senpaihelppbot' }, { text: '📢 Channel', url: 'https://t.me/senpaihelppbot' }],
              [{ text: '🆘 Support', url: 'https://t.me/senpaihelppbot' }, { text: 'ℹ️ Information', callback_data: 'private:info' }],
              [{ text: '🇬🇧 Languages 🇬🇧', callback_data: 'private:lang' }]
            ]
          }
        }
      );
    }
    return;
  }

  // ── /help ─────────────────────────────────────────────────────
  if (text.startsWith('/help')) {
    const helpKeyboard = {
      inline_keyboard: [
        [{ text: '🧑‍💼 Basic commands', callback_data: 'help:basic' }, { text: 'Advanced 🧑‍💼', callback_data: 'help:advanced' }],
        [{ text: '🧑‍🔬 Experts', callback_data: 'help:experts' }, { text: 'Pro Guides 🧑‍💼', callback_data: 'help:pro' }]
      ]
    };
    return bot.sendMessage(chatId, '❤️ *Welcome to the help menu!*', { parse_mode: 'Markdown', reply_markup: helpKeyboard });
  }

  // ── /rules ────────────────────────────────────────────────────
  if (text.startsWith('/rules')) {
    const settings = await getGroupSettings(chatId);
    const lang = settings.language || 'en';
    return bot.sendMessage(chatId, `${t(lang, 'rules_title')}\n\n${settings.regulation?.message || t(lang, 'no_rules')}`, { parse_mode: 'Markdown' });
  }

  // ── /reload ───────────────────────────────────────────────────
  if (text.startsWith('/reload')) {
    if (!(await isAdmin(bot, chatId, userId))) return;
    const settings = await getGroupSettings(chatId);
    settings.chatTitle = msg.chat.title || '';
    await settings.save();
    return bot.sendMessage(chatId, '✅ Settings reloaded.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000); });
  }

  // ── /topic_default ────────────────────────────────────────────
  if (text.startsWith('/topic_default')) {
    if (!(await isAdmin(bot, chatId, userId))) return;
    const settings = await getGroupSettings(chatId);
    const topicId = msg.message_thread_id || 0;
    settings.topicId = topicId;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Default topic set to: ${topicId === 0 ? 'General' : `Topic #${topicId}`}`);
  }

  // ── /id ───────────────────────────────────────────────────────
  if (text.startsWith('/id')) {
    const target = msg.reply_to_message?.from || msg.from;
    return bot.sendMessage(chatId, `🆔 *ID:* \`${target.id}\`\n*Name:* ${target.first_name}`, { parse_mode: 'Markdown' });
  }

  // ── /info ─────────────────────────────────────────────────────
  if (text.startsWith('/info')) {
    const target = msg.reply_to_message?.from || msg.from;
    return bot.sendMessage(chatId, `ℹ️ *User Info*\n\n*Name:* ${target.first_name}${target.last_name ? ' ' + target.last_name : ''}\n*ID:* \`${target.id}\`\n*Username:* ${target.username ? '@' + target.username : 'None'}\n*Bot:* ${target.is_bot ? 'Yes' : 'No'}`, { parse_mode: 'Markdown' });
  }

  // ── /cancel ───────────────────────────────────────────────────
  if (text.startsWith('/cancel')) {
    const { clearPendingInput } = require('./settingsHandler');
    clearPendingInput(userId);
    return bot.sendMessage(chatId, '❌ Cancelled.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000); });
  }

  // ── ADMIN ONLY COMMANDS ───────────────────────────────────────
  const adminCmds = ['/warn','/unwarn','/warnlist','/ban','/unban','/kick','/mute','/unmute','/settings','/addblacklist','/removeblacklist','/pin','/unpin','/promote','/demote'];
  const isAdminCmd = adminCmds.some(c => text.startsWith(c));

  if (isAdminCmd && !(await isAdmin(bot, chatId, userId))) {
    return bot.sendMessage(chatId, '❌ Only admins can use this command.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 4000); });
  }

  const settings = isAdminCmd ? await getGroupSettings(chatId) : null;
  const lang = settings?.language || 'en';

  // ── @admin / /report ─────────────────────────────────────────
  if (text.includes('@admin') || text.startsWith('/report')) {
    const gs = await getGroupSettings(chatId);
    if (!gs.adminReport?.enabled) return;
    if (await isAdmin(bot, chatId, userId)) {
      return bot.sendMessage(chatId, t(gs.language || 'en', 'report_admin_only'), { parse_mode: 'Markdown' }).then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 4000); });
    }
    const reason = text.replace('@admin', '').replace('/report', '').trim();
    const reportedMsg = msg.reply_to_message ? `\nReported: "${msg.reply_to_message.text || '[media]'}"` : '';
    const alertText = `🆘 *Admin Report*\n\nFrom: ${getUserMention(msg.from)}\nGroup: ${msg.chat.title}${reportedMsg}${reason ? `\nReason: ${reason}` : ''}`;
    if (gs.adminReport.sendTo === 'founder') {
      const admins = await bot.getChatAdministrators(chatId).catch(() => []);
      const founder = admins.find(a => a.status === 'creator');
      if (founder) bot.sendMessage(founder.user.id, alertText, { parse_mode: 'Markdown' }).catch(() => {});
    }
    return bot.sendMessage(chatId, t(gs.language || 'en', 'report_sent')).then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 4000); });
  }

  // ── /warn ─────────────────────────────────────────────────────
  if (text.startsWith('/warn')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to warn the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot warn admins.');
    const reason = text.split(' ').slice(1).join(' ');
    await addWarn(bot, chatId, target.id, target, settings, lang, reason);
    await logEvent(bot, settings, `⚠️ Warn: ${target.first_name} (${target.id}) by ${msg.from.first_name}${reason ? ` — ${reason}` : ''}`);
    if (settings.deletingMessages?.commands) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }

  // ── /unwarn ───────────────────────────────────────────────────
  if (text.startsWith('/unwarn')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to remove a warning.');
    const target = msg.reply_to_message.from;
    let userWarn = await UserWarning.findOne({ chatId: String(chatId), userId: String(target.id) });
    if (!userWarn || userWarn.warns === 0) return bot.sendMessage(chatId, `${target.first_name} has no warnings.`);
    userWarn.warns = Math.max(0, userWarn.warns - 1);
    await userWarn.save();
    return bot.sendMessage(chatId, `✅ Removed 1 warning from ${getUserMention(target)}. Now: ${userWarn.warns}/${settings.warns.maxWarns}`, { parse_mode: 'Markdown' });
  }

  // ── /warnlist ─────────────────────────────────────────────────
  if (text.startsWith('/warnlist')) {
    const warned = await UserWarning.find({ chatId: String(chatId), warns: { $gt: 0 } });
    if (!warned.length) return bot.sendMessage(chatId, '✅ No warned users.');
    const list = warned.map(u => `• ${u.firstName || u.username || u.userId}: ${u.warns}/${settings.warns?.maxWarns || 3} warns`).join('\n');
    return bot.sendMessage(chatId, `📋 *Warned Users*\n\n${list}`, { parse_mode: 'Markdown' });
  }

  // ── /ban ──────────────────────────────────────────────────────
  if (text.startsWith('/ban') && !text.startsWith('/banlist')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to ban the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot ban admins.');
    const reason = text.split(' ').slice(1).join(' ');
    try {
      await bot.banChatMember(chatId, target.id);
      bot.sendMessage(chatId, `🚫 ${getUserMention(target)} was *banned*.${reason ? `\n📝 Reason: ${reason}` : ''}`, { parse_mode: 'Markdown' });
      await logEvent(bot, settings, `🚫 Ban: ${target.first_name} (${target.id}) by ${msg.from.first_name}${reason ? ` — ${reason}` : ''}`);
      // Notify the banned user
      try {
        await bot.sendMessage(target.id, t(lang, 'ban_access_denied'), { parse_mode: 'Markdown' });
      } catch {}
    } catch (e) { bot.sendMessage(chatId, `❌ Ban failed: ${e.message}`); }
  }

  // ── /unban ────────────────────────────────────────────────────
  if (text.startsWith('/unban')) {
    const parts = text.split(' ');
    if (!msg.reply_to_message && parts.length < 2) return bot.sendMessage(chatId, '❌ Usage: /unban @username or reply to user');
    const targetId = msg.reply_to_message ? msg.reply_to_message.from.id : parts[1];
    try {
      await bot.unbanChatMember(chatId, targetId);
      return bot.sendMessage(chatId, `✅ User unbanned.`);
    } catch (e) { return bot.sendMessage(chatId, `❌ Unban failed: ${e.message}`); }
  }

  // ── /kick ─────────────────────────────────────────────────────
  if (text.startsWith('/kick')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to kick the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot kick admins.');
    try {
      await bot.banChatMember(chatId, target.id);
      await bot.unbanChatMember(chatId, target.id);
      bot.sendMessage(chatId, `👟 ${getUserMention(target)} was *kicked*.`, { parse_mode: 'Markdown' });
      await logEvent(bot, settings, `👟 Kick: ${target.first_name} (${target.id}) by ${msg.from.first_name}`);
    } catch (e) { bot.sendMessage(chatId, `❌ Kick failed: ${e.message}`); }
  }

  // ── /mute ─────────────────────────────────────────────────────
  if (text.startsWith('/mute') && !text.startsWith('/mutelist')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to mute the user.');
    const target = msg.reply_to_message.from;
    if (await isAdmin(bot, chatId, target.id)) return bot.sendMessage(chatId, '❌ Cannot mute admins.');
    const duration = parseInt(text.split(' ')[1]) || 0;
    try {
      await applyPunishment(bot, chatId, target.id, 'mute', duration);
      bot.sendMessage(chatId, `🔇 ${getUserMention(target)} was *muted*${duration ? ` for ${duration} minutes` : ' permanently'}.`, { parse_mode: 'Markdown' });
      await logEvent(bot, settings, `🔇 Mute: ${target.first_name} (${target.id}) by ${msg.from.first_name}, duration: ${duration || 'permanent'}`);
    } catch (e) { bot.sendMessage(chatId, `❌ Mute failed: ${e.message}`); }
  }

  // ── /unmute ───────────────────────────────────────────────────
  if (text.startsWith('/unmute')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to unmute the user.');
    const target = msg.reply_to_message.from;
    try {
      await bot.restrictChatMember(chatId, target.id, {
        permissions: { can_send_messages: true, can_send_audios: true, can_send_documents: true, can_send_photos: true, can_send_videos: true, can_send_voice_notes: true, can_send_other_messages: true, can_add_web_page_previews: true, can_send_polls: true }
      });
      bot.sendMessage(chatId, `✅ ${getUserMention(target)} was *unmuted*.`, { parse_mode: 'Markdown' });
    } catch (e) { bot.sendMessage(chatId, `❌ Unmute failed: ${e.message}`); }
  }

  // ── /addblacklist ─────────────────────────────────────────────
  if (text.startsWith('/addblacklist')) {
    const word = text.split(' ').slice(1).join(' ').trim();
    if (!word) return bot.sendMessage(chatId, '❌ Usage: /addblacklist <word>');
    if (!settings.blocks.blacklist.words.includes(word)) { settings.blocks.blacklist.words.push(word); await settings.save(); }
    return bot.sendMessage(chatId, `✅ Added "${word}" to the blacklist.`);
  }

  // ── /removeblacklist ──────────────────────────────────────────
  if (text.startsWith('/removeblacklist')) {
    const word = text.split(' ').slice(1).join(' ').trim();
    if (!word) return bot.sendMessage(chatId, '❌ Usage: /removeblacklist <word>');
    settings.blocks.blacklist.words = settings.blocks.blacklist.words.filter(w => w !== word);
    await settings.save();
    return bot.sendMessage(chatId, `✅ Removed "${word}" from the blacklist.`);
  }

  // ── /pin ──────────────────────────────────────────────────────
  if (text.startsWith('/pin')) {
    if (!msg.reply_to_message) return bot.sendMessage(chatId, '❌ Reply to a message to pin it.');
    try {
      await bot.pinChatMessage(chatId, msg.reply_to_message.message_id);
      if (settings?.deletingMessages?.commands) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return bot.sendMessage(chatId, '📌 Message pinned.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000); });
    } catch (e) { return bot.sendMessage(chatId, `❌ Pin failed: ${e.message}`); }
  }

  // ── /unpin ────────────────────────────────────────────────────
  if (text.startsWith('/unpin')) {
    try {
      if (msg.reply_to_message) { await bot.unpinChatMessage(chatId, { message_id: msg.reply_to_message.message_id }); }
      else { await bot.unpinAllChatMessages(chatId); }
      return bot.sendMessage(chatId, '📌 Message(s) unpinned.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 3000); });
    } catch (e) { return bot.sendMessage(chatId, `❌ Unpin failed: ${e.message}`); }
  }

  // ── /settings ─────────────────────────────────────────────────
  if (text.startsWith('/settings')) {
    const { handleSettingsCommand } = require('./settingsHandler');
    return handleSettingsCommand(bot, msg);
  }

  // Delete command messages if enabled
  if (isAdminCmd && settings?.deletingMessages?.commands) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }
}

async function handleHelpCallback(bot, query) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;

  const edit = (text, keyboard) => bot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: keyboard });

  const backBtn = { inline_keyboard: [[{ text: '◀️ Back', callback_data: 'help:back' }]] };
  const helpMenu = { inline_keyboard: [[{ text: '🧑‍💼 Basic commands', callback_data: 'help:basic' }, { text: 'Advanced 🧑‍💼', callback_data: 'help:advanced' }], [{ text: '🧑‍🔬 Experts', callback_data: 'help:experts' }, { text: 'Pro Guides 🧑‍💼', callback_data: 'help:pro' }]] };

  if (data === 'help:back') return edit('❤️ *Welcome to the help menu!*', helpMenu);

  if (data === 'help:basic') {
    return edit(
      `🧑‍💼 *Basic Commands*\n\n` +
      `/start — Start the bot\n` +
      `/help — Show this menu\n` +
      `/rules — Show group rules\n` +
      `/id — Get user Telegram ID\n` +
      `/info — Get user info\n` +
      `/settings — Open group settings\n\n` +
      `*User Commands:*\n` +
      `@admin or /report — Report to admins`,
      backBtn
    );
  }

  if (data === 'help:advanced') {
    return edit(
      `🧑‍💼 *Advanced Commands*\n\n` +
      `*Moderation:*\n` +
      `/warn [reply] — Warn a user\n` +
      `/unwarn [reply] — Remove a warning\n` +
      `/warnlist — List warned users\n` +
      `/ban [reply] — Ban a user\n` +
      `/unban [reply/id] — Unban a user\n` +
      `/kick [reply] — Kick a user\n` +
      `/mute [reply] [mins] — Mute a user\n` +
      `/unmute [reply] — Unmute a user\n\n` +
      `*Content:*\n` +
      `/pin [reply] — Pin a message\n` +
      `/unpin — Unpin message(s)\n` +
      `/addblacklist <word> — Add to blacklist\n` +
      `/removeblacklist <word> — Remove from blacklist`,
      backBtn
    );
  }

  if (data === 'help:experts') {
    return edit(
      `🧑‍🔬 *Expert Commands*\n\n` +
      `/reload — Reload group settings cache\n` +
      `/topic_default — Set default bot topic\n\n` +
      `*Variables for messages:*\n` +
      `{user} — Mention user\n` +
      `{username} — @username\n` +
      `{group} — Group name\n` +
      `{id} — User ID\n` +
      `{name} — First name\n\n` +
      `*Anti-flood:* Triggers after X messages in Y seconds\n` +
      `*Alphabets:* Block messages in specific scripts\n` +
      `*Captcha:* Verify new members before chatting`,
      backBtn
    );
  }

  if (data === 'help:pro') {
    return edit(
      `🧑‍💼 *Pro Guides*\n\n` +
      `📋 *Setup checklist:*\n` +
      `1. Add bot to group\n` +
      `2. Promote as Admin with all permissions\n` +
      `3. Run /settings to configure\n` +
      `4. Set /rules for your group\n` +
      `5. Enable Welcome messages\n` +
      `6. Configure Anti-Spam/Flood\n` +
      `7. Set up Warns system\n` +
      `8. Add Log Channel for audit trail\n\n` +
      `🌐 *Languages:* 8 languages supported\n` +
      `(🇬🇧🇮🇹🇪🇸🇵🇹🇩🇪🇫🇷🇷🇺🇸🇦)\n\n` +
      `❓ Use /help for commands list`,
      backBtn
    );
  }
}

async function handlePrivateCallback(bot, query) {
  const data = query.data;
  if (!data.startsWith('private:')) return false;

  if (data === 'private:info') {
    await bot.answerCallbackQuery(query.id, {
      text: `SenpaiHelpBot v2.0\nA complete Telegram group management bot.\nDeveloped with Node.js & MongoDB`,
      show_alert: true
    });
    return true;
  }

  if (data === 'private:lang') {
    await bot.answerCallbackQuery(query.id, {
      text: `Supported languages:\n🇬🇧 English | 🇮🇹 Italian | 🇪🇸 Spanish\n🇵🇹 Portuguese | 🇩🇪 German | 🇫🇷 French\n🇷🇺 Russian | 🇸🇦 Arabic\n\nSet language in /settings → Lang`,
      show_alert: true
    });
    return true;
  }

  if (data === 'private:manage_settings') {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    // Show list of groups the user manages - mock for now
    await bot.editMessageText(
      `⚙️ *Manage group Settings* ✍️\n\n👉 Select the group whose settings you want to change.\n\nIf a group where you are an administrator doesn't appear:\n• Send /reload in the group\n• Send /settings in the group and press "Open in pvt"`,
      { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '◀️ Back', callback_data: 'private:back' }]] } }
    ).catch(() => {});
    return true;
  }

  if (data === 'private:back') {
    await bot.editMessageText(
      `👋 *Hello!*\n[SenpaiHelpBot](https://t.me/senpaihelppbot) is the most complete Bot to help you *manage* your groups easily and *safely*!\n\n👉 *Add me in a Supergroup* and promote me as Admin!\n\n❓ Press /help to see *all the commands*!`,
      {
        chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '➕ Add me to a Group ➕', url: `https://t.me/senpaihelppbot?startgroup=true` }],
            [{ text: '⚙️ Manage group Settings ✍️', callback_data: 'private:manage_settings' }],
            [{ text: '👥 Group', url: 'https://t.me/senpaihelppbot' }, { text: '📢 Channel', url: 'https://t.me/senpaihelppbot' }],
            [{ text: '🆘 Support', url: 'https://t.me/senpaihelppbot' }, { text: 'ℹ️ Information', callback_data: 'private:info' }],
            [{ text: '🇬🇧 Languages 🇬🇧', callback_data: 'private:lang' }]
          ]
        }
      }
    ).catch(() => {});
    return true;
  }

  return false;
}

module.exports = { handleCommands, handleHelpCallback, handlePrivateCallback };
