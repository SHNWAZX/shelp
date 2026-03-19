const { getGroupSettings, isAdmin, formatOnOff } = require('../utils/helpers');
const kb = require('../utils/keyboards');
const { t, LANG_FLAGS } = require('../utils/i18n');

// Pending state store for multi-step inputs
const pendingInput = new Map();

function setPendingInput(userId, state) { pendingInput.set(String(userId), state); }
function getPendingInput(userId) { return pendingInput.get(String(userId)); }
function clearPendingInput(userId) { pendingInput.delete(String(userId)); }

async function handleSettingsCommand(bot, msg) {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (msg.chat.type === 'private') return bot.sendMessage(chatId, '⚙️ Add me to a group and use /settings there!');
  if (!(await isAdmin(bot, chatId, userId))) return bot.sendMessage(chatId, '❌ Only admins can access settings.');
  const settings = await getGroupSettings(chatId);
  settings.chatTitle = msg.chat.title || '';
  await settings.save();
  return bot.sendMessage(chatId,
    `⚙️ *SETTINGS*\n*Group:* ${msg.chat.title || 'Group'}\n\n_Select one of the settings that you want to change._`,
    { parse_mode: 'Markdown', reply_markup: kb.mainSettingsKeyboard() }
  );
}

async function handlePendingInput(bot, msg) {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const state = getPendingInput(userId);
  if (!state) return false;
  clearPendingInput(userId);
  const settings = await getGroupSettings(state.chatId || chatId);
  const text = msg.text || '';

  if (state.action === 'set_rules') {
    settings.regulation.message = text;
    await settings.save();
    return bot.sendMessage(chatId, '✅ Rules updated!');
  }
  if (state.action === 'flood_messages') {
    const n = parseInt(text);
    if (isNaN(n) || n < 2) return bot.sendMessage(chatId, '❌ Enter a number >= 2');
    settings.antiflood.messages = n;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Flood limit set to ${n} messages.`);
  }
  if (state.action === 'flood_time') {
    const n = parseInt(text);
    if (isNaN(n) || n < 1) return bot.sendMessage(chatId, '❌ Enter a number >= 1');
    settings.antiflood.timeSeconds = n;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Flood time set to ${n} seconds.`);
  }
  if (state.action === 'set_welcome_text') {
    settings.welcome.text = text;
    await settings.save();
    return bot.sendMessage(chatId, '✅ Welcome text updated! Use {user} {group} {username} {id} as variables.');
  }
  if (state.action === 'set_goodbye_text') {
    settings.goodbye.message = text;
    await settings.save();
    return bot.sendMessage(chatId, '✅ Goodbye message updated!');
  }
  if (state.action === 'add_banned_word') {
    const word = text.trim().toLowerCase();
    if (!settings.bannedWords.words.includes(word)) {
      settings.bannedWords.words.push(word);
      await settings.save();
    }
    return bot.sendMessage(chatId, `✅ Added "${word}" to banned words.`);
  }
  if (state.action === 'remove_banned_word') {
    const word = text.trim().toLowerCase();
    settings.bannedWords.words = settings.bannedWords.words.filter(w => w !== word);
    await settings.save();
    return bot.sendMessage(chatId, `✅ Removed "${word}" from banned words.`);
  }
  if (state.action === 'add_recurring') {
    const parts = text.split('|');
    const msgText = parts[0].trim();
    const interval = parseInt(parts[1]) || 60;
    settings.recurringMessages.push({ id: Date.now().toString(), text: msgText, intervalMinutes: interval, enabled: true, lastSent: null });
    await settings.save();
    return bot.sendMessage(chatId, `✅ Recurring message added! It will be sent every ${interval} minutes.`);
  }
  if (state.action === 'set_msglen_min') {
    const n = parseInt(text);
    if (isNaN(n) || n < 0) return bot.sendMessage(chatId, '❌ Enter a valid number >= 0');
    settings.messageLength.minLength = n;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Minimum message length set to ${n} characters.`);
  }
  if (state.action === 'set_msglen_max') {
    const n = parseInt(text);
    if (isNaN(n) || n < 1) return bot.sendMessage(chatId, '❌ Enter a valid number >= 1');
    settings.messageLength.maxLength = n;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Maximum message length set to ${n} characters.`);
  }
  if (state.action === 'set_support_link') {
    settings.supportGroupLink = text.trim();
    await settings.save();
    return bot.sendMessage(chatId, '✅ Support group link updated!');
  }
  if (state.action === 'set_channel_link') {
    settings.channelLink = text.trim();
    await settings.save();
    return bot.sendMessage(chatId, '✅ Channel link updated!');
  }
  if (state.action === 'set_log_channel') {
    settings.logChannelId = text.trim();
    await settings.save();
    return bot.sendMessage(chatId, '✅ Log channel set!');
  }
  if (state.action === 'add_personal_command') {
    const parts = text.split('\n');
    if (parts.length < 2) return bot.sendMessage(chatId, '❌ Format:\n/commandname\nresponse text');
    const cmd = parts[0].replace(/^\//, '').trim();
    const response = parts.slice(1).join('\n').trim();
    settings.personalCommands.push({ command: cmd, response, enabled: true });
    await settings.save();
    return bot.sendMessage(chatId, `✅ Personal command /${cmd} added!`);
  }
  if (state.action === 'add_personal_reply') {
    const parts = text.split('\n');
    if (parts.length < 2) return bot.sendMessage(chatId, '❌ Format:\ntrigger phrase\nresponse text');
    const trigger = parts[0].trim();
    const response = parts.slice(1).join('\n').trim();
    settings.personalReplies.push({ trigger, response, enabled: true });
    await settings.save();
    return bot.sendMessage(chatId, `✅ Personal reply added for trigger: "${trigger}"`);
  }
  if (state.action === 'warn_mute_duration') {
    const n = parseInt(text);
    if (isNaN(n) || n < 0) return bot.sendMessage(chatId, '❌ Enter minutes (0 = permanent)');
    settings.warns.muteDuration = n;
    await settings.save();
    return bot.sendMessage(chatId, `✅ Mute duration set to ${n === 0 ? 'permanent' : n + ' minutes'}.`);
  }
  return false;
}

async function handleCallback(bot, query) {
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  const userId = query.from.id;
  const data = query.data;

  if (!(await isAdmin(bot, chatId, userId))) {
    return bot.answerCallbackQuery(query.id, { text: '❌ Only admins!', show_alert: true });
  }

  const settings = await getGroupSettings(chatId);
  const groupName = query.message.chat.title || 'Group';
  const lang = settings.language || 'en';

  const edit = (text, keyboard) => bot.editMessageText(text, {
    chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: keyboard
  }).catch(() => {});

  const answer = (text, alert = false) => bot.answerCallbackQuery(query.id, { text, show_alert: alert });

  // ── NAVIGATION ────────────────────────────────────────────────
  if (data === 'settings:back_main') {
    return edit(`⚙️ *SETTINGS*\n*Group:* ${groupName}\n\n_Select one of the settings that you want to change._`, kb.mainSettingsKeyboard());
  }
  if (data === 'settings:close') { await bot.deleteMessage(chatId, messageId).catch(() => {}); return answer(''); }
  if (data === 'settings:other') return edit(`⚙️ *Other Settings*\n*Group:* ${groupName}`, kb.otherSettingsKeyboard());
  if (data === 'settings:back_other') return edit(`⚙️ *Other Settings*\n*Group:* ${groupName}`, kb.otherSettingsKeyboard());

  // ── LANGUAGE ──────────────────────────────────────────────────
  if (data === 'settings:lang') {
    return edit(`🌐 *Language Settings*\n\nCurrent: ${LANG_FLAGS[lang] || '🇬🇧 English'}\n\nSelect a language:`, kb.langKeyboard(lang));
  }
  if (data.startsWith('lang:set:')) {
    const newLang = data.split(':')[2];
    settings.language = newLang;
    await settings.save();
    await answer(`Language set to: ${LANG_FLAGS[newLang] || newLang}`);
    return edit(`🌐 *Language Settings*\n\nCurrent: ${LANG_FLAGS[newLang]}\n\nSelect a language:`, kb.langKeyboard(newLang));
  }

  // ── REGULATION ────────────────────────────────────────────────
  if (data === 'settings:regulation') {
    return edit(`📋 *Group's regulations*\nFrom this menu you can manage the group's regulations, shown with /rules.\n\n_To edit who can use /rules, go to "Commands permissions"._`, kb.regulationKeyboard());
  }
  if (data === 'reg:customize') {
    await answer('');
    setPendingInput(userId, { action: 'set_rules', chatId });
    return bot.sendMessage(chatId, '✍️ Send the new rules for this group (or /cancel to abort):', { reply_markup: { force_reply: true } });
  }
  if (data === 'reg:permissions') return edit('🚨 *Commands Permissions*\n\nYou can restrict who uses /rules via group admin settings.', kb.backKeyboard('settings:regulation'));

  // ── ANTI-SPAM ─────────────────────────────────────────────────
  if (data === 'settings:antispam') {
    const s = settings.antispam;
    return edit(`📩 *Anti-Spam*\nProtect your group from unnecessary links, forwards, and quotes.\n\n• Telegram links: ${formatOnOff(s.telegramLinks)}\n• Forwarding: ${formatOnOff(s.forwarding)}\n• Quote: ${formatOnOff(s.quotes)}\n• Total links block: ${formatOnOff(s.totalLinksBlock)}`, kb.antispamKeyboard(s));
  }
  if (data.startsWith('antispam:')) {
    const map = { 'telegram_links': 'telegramLinks', 'forwarding': 'forwarding', 'quote': 'quotes', 'total_links': 'totalLinksBlock' };
    const field = map[data.split(':')[1]];
    if (field) { settings.antispam[field] = !settings.antispam[field]; await settings.save(); await answer(`${field}: ${settings.antispam[field] ? 'ON' : 'OFF'}`); }
    const s = settings.antispam;
    return edit(`📩 *Anti-Spam*\n• Telegram links: ${formatOnOff(s.telegramLinks)}\n• Forwarding: ${formatOnOff(s.forwarding)}\n• Quote: ${formatOnOff(s.quotes)}\n• Total links block: ${formatOnOff(s.totalLinksBlock)}`, kb.antispamKeyboard(s));
  }

  // ── ANTI-FLOOD ────────────────────────────────────────────────
  if (data === 'settings:antiflood') {
    const s = settings.antiflood;
    return edit(`🌧 *Antiflood*\nSet punishment for those who send too many messages quickly.\n\nTriggers when *${s.messages} messages* sent in *${s.timeSeconds} seconds*.\n\n*Punishment:* ${s.punishment}`, kb.antifloodKeyboard(s));
  }
  if (data.startsWith('flood:')) {
    const action = data.split(':')[1];
    const punishments = ['off','warn','kick','mute','ban','deletion'];
    if (punishments.includes(action)) { settings.antiflood.punishment = action; settings.antiflood.enabled = action !== 'off'; await settings.save(); await answer(`Punishment: ${action}`); }
    else if (action === 'delete_messages') { settings.antiflood.deleteMessages = !settings.antiflood.deleteMessages; await settings.save(); await answer(`Delete messages: ${settings.antiflood.deleteMessages ? 'ON' : 'OFF'}`); }
    else if (action === 'messages') { await answer(''); setPendingInput(userId, { action: 'flood_messages', chatId }); return bot.sendMessage(chatId, '📄 Send the number of messages to trigger antiflood (e.g. 5):'); }
    else if (action === 'time') { await answer(''); setPendingInput(userId, { action: 'flood_time', chatId }); return bot.sendMessage(chatId, '⏰ Send the time window in seconds (e.g. 3):'); }
    const s = settings.antiflood;
    return edit(`🌧 *Antiflood*\nTriggers when *${s.messages} messages* in *${s.timeSeconds} seconds*.\n*Punishment:* ${s.punishment}`, kb.antifloodKeyboard(s));
  }

  // ── WELCOME ───────────────────────────────────────────────────
  if (data === 'settings:welcome') {
    const s = settings.welcome;
    return edit(`💬 *Welcome Message*\n\n📄 Text ${s.text ? '✅' : '❌'}\n🎬 Media ${s.mediaFileId ? '✅' : '❌'}\n🔘 Url Buttons ${s.urlButtons?.length > 0 ? '✅' : '❌'}\n\n👉 Use buttons below to configure:\n*Status:* ${formatOnOff(s.enabled)}`, kb.welcomeKeyboard(s));
  }
  if (data.startsWith('welcome:')) {
    const action = data.split(':')[1];
    const s = settings.welcome;
    if (action === 'on') { settings.welcome.enabled = true; await settings.save(); await answer('Welcome: ON'); }
    else if (action === 'off') { settings.welcome.enabled = false; await settings.save(); await answer('Welcome: OFF'); }
    else if (action === 'delete_last') { settings.welcome.deleteLastMessage = !settings.welcome.deleteLastMessage; await settings.save(); await answer(''); }
    else if (action === 'set_text') { await answer(''); setPendingInput(userId, { action: 'set_welcome_text', chatId }); return bot.sendMessage(chatId, '✍️ Send the new welcome text.\n\nVariables: {user} {username} {group} {id}'); }
    else if (action === 'see_text') return edit(`📄 *Welcome Text*\n\n${settings.welcome.text || 'Not set'}`, kb.backKeyboard('settings:welcome'));
    else if (action === 'see_media') return edit(`🎬 *Welcome Media*\n\n${settings.welcome.mediaFileId ? `File ID: \`${settings.welcome.mediaFileId}\`` : 'Not set'}`, kb.backKeyboard('settings:welcome'));
    else if (action === 'see_buttons') {
      const btns = settings.welcome.urlButtons;
      return edit(`🔘 *URL Buttons*\n\n${btns?.length > 0 ? btns.map(b => `• ${b.text}: ${b.url}`).join('\n') : 'No buttons set'}`, kb.backKeyboard('settings:welcome'));
    }
    else if (action === 'preview') {
      const wMsg = settings.welcome.text || 'Welcome {user} to {group}!';
      const previewText = wMsg.replace('{user}', `[${query.from.first_name}](tg://user?id=${query.from.id})`).replace('{group}', groupName).replace('{username}', query.from.username ? `@${query.from.username}` : query.from.first_name).replace('{id}', query.from.id).replace('{name}', query.from.first_name);
      await answer('');
      return bot.sendMessage(chatId, `👁 *Preview:*\n\n${previewText}`, { parse_mode: 'Markdown' });
    }
    else if (action === 'topic') return edit('📁 *Select a Topic*\nGo to the topic in your group and send `/topic_default` to set it as the default topic for bot messages.', kb.backKeyboard('settings:welcome'));
    else if (action === 'set_media') { await answer(''); return bot.sendMessage(chatId, '🎬 Send a photo or video to set as welcome media:'); }
    else if (action === 'set_buttons') { await answer(''); return bot.sendMessage(chatId, '🔘 Send buttons in format:\nText1 | URL1\nText2 | URL2'); }
    return edit(`💬 *Welcome Message*\n*Status:* ${formatOnOff(settings.welcome.enabled)}`, kb.welcomeKeyboard(settings.welcome));
  }

  // ── GOODBYE ───────────────────────────────────────────────────
  if (data === 'settings:goodbye') {
    const s = settings.goodbye;
    return edit(`👋 *Goodbye*\nSend a goodbye message when someone leaves.\n\n*Status:* ${formatOnOff(s.enabled)}`, kb.goodbyeKeyboard(s));
  }
  if (data.startsWith('goodbye:')) {
    const action = data.split(':')[1];
    if (action === 'on') { settings.goodbye.enabled = true; await settings.save(); await answer('Goodbye: ON'); }
    else if (action === 'off') { settings.goodbye.enabled = false; await settings.save(); await answer('Goodbye: OFF'); }
    else if (action === 'private') { settings.goodbye.sendPrivate = !settings.goodbye.sendPrivate; await settings.save(); await answer(''); }
    else if (action === 'delete_last') { settings.goodbye.deleteLastMessage = !settings.goodbye.deleteLastMessage; await settings.save(); await answer(''); }
    else if (action === 'customize') { await answer(''); setPendingInput(userId, { action: 'set_goodbye_text', chatId }); return bot.sendMessage(chatId, '✍️ Send the new goodbye message.\n\nVariables: {user} {username} {group}'); }
    return edit(`👋 *Goodbye*\n*Status:* ${formatOnOff(settings.goodbye.enabled)}`, kb.goodbyeKeyboard(settings.goodbye));
  }

  // ── ALPHABETS ─────────────────────────────────────────────────
  if (data === 'settings:alphabets') {
    const s = settings.alphabets;
    return edit(`🕉 *Alphabets*\nPunish users sending messages in certain alphabets.\n\n🕌 Arabic: ${formatOnOff(s.arabic.enabled)}\n🇷🇺 Cyrillic: ${formatOnOff(s.cyrillic.enabled)}\n🇨🇳 Chinese: ${formatOnOff(s.chinese.enabled)}\n🔤 Latin: ${formatOnOff(s.latin.enabled)}`, kb.alphabetsKeyboard(s));
  }
  if (data.startsWith('alpha:')) {
    const type = data.split(':')[1];
    const s = settings.alphabets[type];
    return edit(`🕉 *Alphabets - ${type.charAt(0).toUpperCase()+type.slice(1)}*\n\n*Status:* ${formatOnOff(s?.enabled)}\n*Punishment:* ${s?.punishment || 'deletion'}`, kb.alphabetSubKeyboard(type, s));
  }
  if (data.startsWith('alpha_sub:')) {
    const [, type, action] = data.split(':');
    if (action === 'on') settings.alphabets[type].enabled = true;
    else if (action === 'off') settings.alphabets[type].enabled = false;
    else settings.alphabets[type].punishment = action;
    await settings.save(); await answer('');
    return edit(`🕉 *Alphabets - ${type.charAt(0).toUpperCase()+type.slice(1)}*\n\n*Status:* ${formatOnOff(settings.alphabets[type].enabled)}\n*Punishment:* ${settings.alphabets[type].punishment}`, kb.alphabetSubKeyboard(type, settings.alphabets[type]));
  }

  // ── CAPTCHA ───────────────────────────────────────────────────
  if (data === 'settings:captcha') {
    const s = settings.captcha;
    return edit(`🧠 *Captcha*\nUsers must verify they are human before sending messages.\n\n*Status:* ${formatOnOff(s.enabled)}\n*Timeout:* ${s.timeoutSeconds}s\n*Punishment:* ${s.punishment}`, s.enabled ? kb.captchaActiveKeyboard(s) : kb.captchaKeyboard());
  }
  if (data === 'captcha:activate') { settings.captcha.enabled = true; await settings.save(); await answer('Captcha: ON'); return edit(`🧠 *Captcha*\n*Status:* ✅ On`, kb.captchaActiveKeyboard(settings.captcha)); }
  if (data === 'captcha:deactivate') { settings.captcha.enabled = false; await settings.save(); await answer('Captcha: OFF'); return edit(`🧠 *Captcha*\n*Status:* ❌ Off`, kb.captchaKeyboard()); }
  if (data === 'captcha:delete_service') { settings.captcha.deleteServiceMessage = !settings.captcha.deleteServiceMessage; await settings.save(); await answer(''); return edit(`🧠 *Captcha*\n*Status:* ${formatOnOff(settings.captcha.enabled)}`, kb.captchaActiveKeyboard(settings.captcha)); }
  if (data === 'captcha:timeout') { await answer(''); setPendingInput(userId, { action: 'captcha_timeout', chatId }); return bot.sendMessage(chatId, '⏱ Send captcha timeout in seconds (e.g. 60):'); }
  if (data === 'captcha:punishment') return edit('🛡 *Captcha Punishment*\nSet what happens when captcha fails.', { inline_keyboard: [['kick','ban','mute'].map(p => ({ text: `${p === settings.captcha.punishment ? '✓ ' : ''}${p}`, callback_data: `captcha_pun:${p}` })), [{ text: '◀️ Back', callback_data: 'settings:captcha' }]] });
  if (data.startsWith('captcha_pun:')) { settings.captcha.punishment = data.split(':')[1]; await settings.save(); await answer(`Punishment: ${settings.captcha.punishment}`); return edit(`🧠 *Captcha*\n*Punishment:* ${settings.captcha.punishment}`, kb.captchaActiveKeyboard(settings.captcha)); }

  // ── CHECKS ────────────────────────────────────────────────────
  if (data === 'settings:checks') {
    const s = settings.checks;
    return edit(`🔍 *Checks*\n\n*OBLIGATIONS:*\n• Surname: ${formatOnOff(s.obligations.surname)}\n• Username: ${formatOnOff(s.obligations.username)}\n• Profile pic: ${formatOnOff(s.obligations.profilePicture)}\n\n*NAME BLOCKS:*\n• Arabic: ${formatOnOff(s.nameBlocks.arabic)}\n• Chinese: ${formatOnOff(s.nameBlocks.chinese)}\n• Russian: ${formatOnOff(s.nameBlocks.russian)}\n• Spam: ${formatOnOff(s.nameBlocks.spam)}\n\n*Check at join:* ${formatOnOff(s.checkAtJoin)}\n*Delete msgs:* ${formatOnOff(s.deleteMessages)}`, kb.checksKeyboard(s));
  }
  if (data === 'checks:check_join') { settings.checks.checkAtJoin = !settings.checks.checkAtJoin; await settings.save(); await answer(''); return edit(`🔍 *Checks*\nCheck at join: ${formatOnOff(settings.checks.checkAtJoin)}`, kb.checksKeyboard(settings.checks)); }
  if (data === 'checks:delete_messages') { settings.checks.deleteMessages = !settings.checks.deleteMessages; await settings.save(); await answer(''); return edit(`🔍 *Checks*\nDelete messages: ${formatOnOff(settings.checks.deleteMessages)}`, kb.checksKeyboard(settings.checks)); }
  if (data === 'checks:obligations') return edit('📋 *Obligations*\nRequire users to have surname, username, profile picture, etc.', kb.backKeyboard('settings:checks'));
  if (data === 'checks:name_blocks') return edit('🚫 *Name Blocks*\nBlock users with Arabic/Chinese/Russian/spam names.', kb.backKeyboard('settings:checks'));

  // ── ADMIN REPORT ──────────────────────────────────────────────
  if (data === 'settings:admin') {
    const s = settings.adminReport;
    return edit(`🆘 *@Admin command*\n@admin or /report lets users alert staff.\n\n⚠️ DOES NOT work for admins.\n\n*Status:* ${formatOnOff(s.enabled)}\n*Send to:* ${s.sendTo === 'founder' ? '👑 Founder' : '❌ Nobody'}\n*Tag Founder:* ${formatOnOff(s.tagFounder)}\n*Tag Admins:* ${formatOnOff(s.tagAdmins)}`, kb.adminReportKeyboard(s));
  }
  if (data === 'admin:nobody') { settings.adminReport.sendTo = 'nobody'; settings.adminReport.enabled = false; await settings.save(); await answer(''); return edit(`🆘 *@Admin*\nSend to: Nobody`, kb.adminReportKeyboard(settings.adminReport)); }
  if (data === 'admin:founder') { settings.adminReport.sendTo = 'founder'; settings.adminReport.enabled = true; await settings.save(); await answer(''); return edit(`🆘 *@Admin*\nSend to: Founder`, kb.adminReportKeyboard(settings.adminReport)); }
  if (data === 'admin:tag_founder') { settings.adminReport.tagFounder = !settings.adminReport.tagFounder; await settings.save(); await answer(''); return edit(`🆘 *@Admin*\nTag Founder: ${formatOnOff(settings.adminReport.tagFounder)}`, kb.adminReportKeyboard(settings.adminReport)); }
  if (data === 'admin:tag_admins') { settings.adminReport.tagAdmins = !settings.adminReport.tagAdmins; await settings.save(); await answer(''); return edit(`🆘 *@Admin*\nTag Admins: ${formatOnOff(settings.adminReport.tagAdmins)}`, kb.adminReportKeyboard(settings.adminReport)); }
  if (data === 'admin:staff_group') return edit('👥 *Staff Group*\nForward reports to a dedicated staff group.\n\nSet your staff group by using /setstaffgroup in that group.', kb.backKeyboard('settings:admin'));
  if (data === 'admin:advanced') return edit('🔧 *Advanced Settings*\nConfigure detailed report options.', kb.backKeyboard('settings:admin'));

  // ── BLOCKS ────────────────────────────────────────────────────
  if (data === 'settings:blocks') {
    const s = settings.blocks;
    return edit(`🔒 *Blocks*\n\n• Bot block: ${formatOnOff(s.botBlock)}\n• Join block: ${formatOnOff(s.joinBlock)}\n• Leave block: ${formatOnOff(s.leaveBlock)}\n• Join-Leave: ${formatOnOff(s.joinLeaveBlock)}\n• Multiple joins: ${formatOnOff(s.multipleJoinsBlock)}`, kb.blocksKeyboard());
  }
  if (data === 'blocks:blacklist') return edit(`🔥 *Blacklist*\nWords: ${settings.blocks.blacklist?.words?.join(', ') || 'None'}\n\nUse /addblacklist <word> or /removeblacklist <word>`, kb.backKeyboard('settings:blocks'));
  if (data === 'blocks:bot') { settings.blocks.botBlock = !settings.blocks.botBlock; await settings.save(); await answer(`Bot block: ${settings.blocks.botBlock ? 'ON' : 'OFF'}`); return edit(`🤖 *Bot Block*\n*Status:* ${formatOnOff(settings.blocks.botBlock)}`, kb.backKeyboard('settings:blocks')); }
  if (data === 'blocks:join') { settings.blocks.joinBlock = !settings.blocks.joinBlock; await settings.save(); await answer(`Join block: ${settings.blocks.joinBlock ? 'ON' : 'OFF'}`); return edit(`🧍 *Join Block*\n*Status:* ${formatOnOff(settings.blocks.joinBlock)}`, kb.backKeyboard('settings:blocks')); }
  if (data === 'blocks:leave') { settings.blocks.leaveBlock = !settings.blocks.leaveBlock; await settings.save(); await answer(`Leave block: ${settings.blocks.leaveBlock ? 'ON' : 'OFF'}`); return edit(`📕 *Leave Block*\n*Status:* ${formatOnOff(settings.blocks.leaveBlock)}`, kb.backKeyboard('settings:blocks')); }
  if (data === 'blocks:joinleave') { settings.blocks.joinLeaveBlock = !settings.blocks.joinLeaveBlock; await settings.save(); await answer(''); return edit(`🏃 *Join-Leave Block*\n*Status:* ${formatOnOff(settings.blocks.joinLeaveBlock)}`, kb.backKeyboard('settings:blocks')); }
  if (data === 'blocks:multijoins') { settings.blocks.multipleJoinsBlock = !settings.blocks.multipleJoinsBlock; await settings.save(); await answer(''); return edit(`👥 *Multiple Joins Block*\n*Status:* ${formatOnOff(settings.blocks.multipleJoinsBlock)}`, kb.backKeyboard('settings:blocks')); }

  // ── MEDIA ─────────────────────────────────────────────────────
  if (data === 'settings:media') {
    const s = settings.media;
    return edit(`🎬 *Media Block*\n\n❗=Warn | 👢=Kick | 🔇=Mute | 🚫=Ban | 🗑=Delete | ✅=Off\n\nTap any media type to configure it:`, kb.mediaKeyboard(s));
  }
  if (data.startsWith('media:') && !data.startsWith('media_set:')) {
    const type = data.split(':')[1];
    const cur = settings.media[type] || 'off';
    return edit(`🎬 *Media - ${type}*\nCurrent punishment: *${cur}*`, kb.mediaSubKeyboard(type, cur));
  }
  if (data.startsWith('media_set:')) {
    const [, type, punishment] = data.split(':');
    settings.media[type] = punishment;
    await settings.save(); await answer(`${type}: ${punishment}`);
    return edit(`🎬 *Media - ${type}*\nCurrent: *${punishment}*`, kb.mediaSubKeyboard(type, punishment));
  }

  // ── WARNS ─────────────────────────────────────────────────────
  if (data === 'settings:warns') {
    const s = settings.warns;
    return edit(`❗ *User warnings*\nGive warnings before punishing.\n\nMax warns before action: *${s.maxWarns}*\n*Punishment:* ${s.punishment}\n*Mute duration:* ${s.muteDuration === 0 ? 'permanent' : s.muteDuration + ' min'}`, kb.warnsKeyboard(s));
  }
  if (data.startsWith('warns:')) {
    const action = data.split(':')[1];
    if (['off','kick','mute','ban'].includes(action)) { settings.warns.punishment = action; await settings.save(); await answer(`Punishment: ${action}`); }
    else if (action === 'count') { const n = parseInt(data.split(':')[2]); if (!isNaN(n)) { settings.warns.maxWarns = n; await settings.save(); await answer(`Max warns: ${n}`); } }
    else if (action === 'mute_duration') { await answer(''); setPendingInput(userId, { action: 'warn_mute_duration', chatId }); return bot.sendMessage(chatId, '⏱ Send mute duration in minutes (0 = permanent):'); }
    else if (action === 'list') {
      const UserWarning = require('../models/UserWarning');
      const warned = await UserWarning.find({ chatId: String(chatId), warns: { $gt: 0 } });
      if (!warned.length) return answer('No warned users.', true);
      const list = warned.map(u => `• ${u.firstName || u.username || u.userId}: ${u.warns}/${settings.warns.maxWarns}`).join('\n');
      return edit(`📋 *Warned Users*\n\n${list}`, kb.backKeyboard('settings:warns'));
    }
    return edit(`❗ *User warnings*\n*Max:* ${settings.warns.maxWarns}\n*Punishment:* ${settings.warns.punishment}`, kb.warnsKeyboard(settings.warns));
  }

  // ── NIGHT MODE ────────────────────────────────────────────────
  if (data === 'settings:night') {
    const s = settings.nightMode;
    return edit(`🌙 *Night mode*\nLimit actions every night (22:00 - 07:00).\n\n*Status:* ${formatOnOff(s.enabled)}\n*Delete medias:* ${formatOnOff(s.deleteMedias)}\n*Global silence:* ${formatOnOff(s.globalSilence)}`, kb.nightModeKeyboard(s));
  }
  if (data.startsWith('night:')) {
    const action = data.split(':')[1];
    if (action === 'on') { settings.nightMode.enabled = true; await settings.save(); await answer('Night mode: ON'); }
    else if (action === 'off') { settings.nightMode.enabled = false; await settings.save(); await answer('Night mode: OFF'); }
    else if (action === 'delete_medias') { settings.nightMode.deleteMedias = !settings.nightMode.deleteMedias; await settings.save(); await answer(''); }
    else if (action === 'global_silence') { settings.nightMode.globalSilence = !settings.nightMode.globalSilence; await settings.save(); await answer(''); }
    return edit(`🌙 *Night mode*\n*Status:* ${formatOnOff(settings.nightMode.enabled)}`, kb.nightModeKeyboard(settings.nightMode));
  }

  // ── PORN ──────────────────────────────────────────────────────
  if (data === 'settings:porn') {
    return edit(`🔞 *Porn*\nBlock adult content in the group.\n\n*Status:* ${formatOnOff(settings.porn?.enabled)}`, {
      inline_keyboard: [[{ text: `❌ Off${!settings.porn?.enabled ? ' ✓' : ''}`, callback_data: 'porn:off' }, { text: `✅ On${settings.porn?.enabled ? ' ✓' : ''}`, callback_data: 'porn:on' }], [{ text: '◀️ Back', callback_data: 'settings:back_main' }]]
    });
  }
  if (data === 'porn:on') { settings.porn.enabled = true; await settings.save(); await answer('Porn block: ON'); return edit(`🔞 *Porn block*\n*Status:* ✅ On`, kb.backKeyboard('settings:back_main')); }
  if (data === 'porn:off') { settings.porn.enabled = false; await settings.save(); await answer('Porn block: OFF'); return edit(`🔞 *Porn block*\n*Status:* ❌ Off`, kb.backKeyboard('settings:back_main')); }

  // ── TAG ───────────────────────────────────────────────────────
  if (data === 'settings:tag') {
    return edit(`🔔 *Tag*\n*Status:* ${formatOnOff(settings.tag?.enabled)}`, { inline_keyboard: [[{ text: `❌ Off${!settings.tag?.enabled ? ' ✓' : ''}`, callback_data: 'tag:off' }, { text: `✅ On${settings.tag?.enabled ? ' ✓' : ''}`, callback_data: 'tag:on' }], [{ text: '◀️ Back', callback_data: 'settings:back_main' }]] });
  }
  if (data === 'tag:on') { settings.tag.enabled = true; await settings.save(); await answer(''); }
  if (data === 'tag:off') { settings.tag.enabled = false; await settings.save(); await answer(''); }

  // ── LINK ──────────────────────────────────────────────────────
  if (data === 'settings:link') {
    return edit(`🔗 *Link*\nManage the group invite link.\n\n*Status:* ${formatOnOff(settings.link?.enabled)}`, { inline_keyboard: [[{ text: `❌ Off${!settings.link?.enabled ? ' ✓' : ''}`, callback_data: 'link:off' }, { text: `✅ On${settings.link?.enabled ? ' ✓' : ''}`, callback_data: 'link:on' }], [{ text: '◀️ Back', callback_data: 'settings:back_main' }]] });
  }
  if (data === 'link:on') { settings.link.enabled = true; await settings.save(); await answer(''); }
  if (data === 'link:off') { settings.link.enabled = false; await settings.save(); await answer(''); }

  // ── APPROVAL ──────────────────────────────────────────────────
  if (data === 'settings:approval') {
    const s = settings.approvalMode;
    return edit(`🔐 *Approval mode*\nDelegate group approvals to the bot for users joining via link.\n\nCaptcha is ${settings.captcha.enabled ? 'active' : 'not active'}.\n\n💡 *Status:*\n• Auto-approval: ${s.autoApproval ? 'Activated' : 'Deactivated'}`, kb.approvalKeyboard(s));
  }
  if (data === 'approval:on') { settings.approvalMode.autoApproval = true; await settings.save(); await answer('Auto-approval: ON'); return edit(`🔐 *Approval*\nAuto-approval: ✅ ON`, kb.approvalKeyboard(settings.approvalMode)); }
  if (data === 'approval:off') { settings.approvalMode.autoApproval = false; await settings.save(); await answer('Auto-approval: OFF'); return edit(`🔐 *Approval*\nAuto-approval: ❌ OFF`, kb.approvalKeyboard(settings.approvalMode)); }
  if (data === 'approval:info') return answer('Auto-approval handles join requests automatically via the bot.', true);

  // ── DELETING MESSAGES ─────────────────────────────────────────
  if (data === 'settings:deleting') return edit(`🗑 *Deleting Messages*\nWhat messages should the bot delete?`, kb.deletingMessagesKeyboard(settings.deletingMessages));
  if (data.startsWith('deleting:')) {
    const map = { 'commands': 'commands', 'global_silence': 'globalSilence', 'edit_checks': 'editChecks', 'service_messages': 'serviceMessages', 'scheduled': 'scheduledDeletion', 'block_cancel': 'blockCancellation' };
    const field = map[data.split(':')[1]];
    if (field) { settings.deletingMessages[field] = !settings.deletingMessages[field]; await settings.save(); await answer(''); }
    else if (data === 'deleting:delete_all') return answer('⚠️ This deletes ALL messages. Use with extreme caution!', true);
    else if (data === 'deleting:self_destruct') return answer('⏳ Self-destruction: set a timer after which messages auto-delete.', true);
    return edit(`🗑 *Deleting Messages*`, kb.deletingMessagesKeyboard(settings.deletingMessages));
  }

  // ── TOPIC ─────────────────────────────────────────────────────
  if (data === 'settings:topic') {
    return edit(`📁 *Select a Topic*\nIf you use the "Topic" function in your group, go to the chosen topic and send the command:\n\`/topic_default\`\n\nIf you don't use topics, ignore this.`, { inline_keyboard: [[{ text: 'ℹ️ Information', url: 'https://telegram.org/blog/topics-in-groups-collectibles' }], [{ text: '◀️ Back', callback_data: 'settings:back_other' }]] });
  }

  // ── BANNED WORDS ──────────────────────────────────────────────
  if (data === 'settings:bannedwords') {
    const s = settings.bannedWords;
    return edit(`🔤 *Banned Words*\nPunish users who use banned words.\n\n*Penalty:* ${s.penalty}\n*Deletion:* ${s.deletion ? 'Yes ✓' : 'No ❌'}\n*Words count:* ${s.words.length}`, kb.bannedWordsKeyboard(s));
  }
  if (data.startsWith('bw:')) {
    const action = data.split(':')[1];
    const punishments = ['off','warn','kick','mute','ban'];
    if (punishments.includes(action)) { settings.bannedWords.penalty = action; await settings.save(); await answer(`Penalty: ${action}`); }
    else if (action === 'delete_messages') { settings.bannedWords.deletion = !settings.bannedWords.deletion; await settings.save(); await answer(''); }
    else if (action === 'add') { await answer(''); setPendingInput(userId, { action: 'add_banned_word', chatId }); return bot.sendMessage(chatId, '➕ Send the word to ban:'); }
    else if (action === 'remove') { await answer(''); setPendingInput(userId, { action: 'remove_banned_word', chatId }); return bot.sendMessage(chatId, '➖ Send the word to remove from banned list:'); }
    else if (action === 'list') {
      const words = settings.bannedWords.words;
      return edit(`🔤 *Banned Words List*\n\n${words.length > 0 ? words.map((w,i) => `${i+1}. ${w}`).join('\n') : 'No banned words yet.'}`, kb.backKeyboard('settings:bannedwords'));
    }
    else if (action === 'list2') return edit(`2️⃣ *Banned Words 2*\n\n${settings.bannedWords.words2?.join(', ') || 'Empty.'}`, kb.backKeyboard('settings:bannedwords'));
    return edit(`🔤 *Banned Words*\n*Penalty:* ${settings.bannedWords.penalty}\n*Words:* ${settings.bannedWords.words.length}`, kb.bannedWordsKeyboard(settings.bannedWords));
  }

  // ── RECURRING MESSAGES ────────────────────────────────────────
  if (data === 'settings:recurring') {
    const msgs = settings.recurringMessages || [];
    const now = new Date().toLocaleString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return edit(`⏰ *Recurring messages*\nSend messages repeatedly every N minutes/hours.\n\n*Current time:* ${now} UTC\n*Active messages:* ${msgs.length}`, kb.recurringMessagesKeyboard(msgs));
  }
  if (data === 'recurring:add') { await answer(''); setPendingInput(userId, { action: 'add_recurring', chatId }); return bot.sendMessage(chatId, '➕ Send recurring message in format:\n\n`Message text | interval_in_minutes`\n\nExample: `Hello everyone! | 60`', { parse_mode: 'Markdown' }); }
  if (data.startsWith('recurring:edit:')) {
    const idx = parseInt(data.split(':')[2]);
    const m = settings.recurringMessages[idx];
    if (!m) return answer('Not found.', true);
    return edit(`⏰ *Recurring Message*\n\nText: ${m.text}\nInterval: ${m.intervalMinutes} min\nEnabled: ${formatOnOff(m.enabled)}`, { inline_keyboard: [[{ text: m.enabled ? '❌ Disable' : '✅ Enable', callback_data: `recurring:toggle:${idx}` }, { text: '🗑 Delete', callback_data: `recurring:delete:${idx}` }], [{ text: '◀️ Back', callback_data: 'settings:recurring' }]] });
  }
  if (data.startsWith('recurring:toggle:')) { const idx = parseInt(data.split(':')[2]); if (settings.recurringMessages[idx]) { settings.recurringMessages[idx].enabled = !settings.recurringMessages[idx].enabled; await settings.save(); await answer(''); } return edit(`⏰ *Recurring Messages*`, kb.recurringMessagesKeyboard(settings.recurringMessages)); }
  if (data.startsWith('recurring:delete:')) { const idx = parseInt(data.split(':')[2]); settings.recurringMessages.splice(idx, 1); await settings.save(); await answer('Deleted.'); return edit(`⏰ *Recurring Messages*`, kb.recurringMessagesKeyboard(settings.recurringMessages)); }

  // ── MEMBERS MANAGEMENT ────────────────────────────────────────
  if (data === 'settings:members') return edit(`👥 *Members Management*\nManage general actions on group members.`, kb.membersManagementKeyboard());
  if (data === 'members:unmute_all') { await answer('Unmuting all users — this may take a while...', true); return; }
  if (data === 'members:unban_all') { await answer('Unbanning all users — this may take a while...', true); return; }
  if (data === 'members:kick_muted') { await answer('Kicking muted/restricted users...', true); return; }
  if (data === 'members:kick_deleted') { await answer('Kicking deleted accounts...', true); return; }

  // ── MASKED USERS ──────────────────────────────────────────────
  if (data === 'settings:masked') {
    const s = settings.maskedUsers;
    return edit(`🤖 *Masked users*\nPunish users who write masquerading as a channel.\n\n_Telegram lets users hide behind a channel they own. This blocks that._\n\n💡 *Status:* ${s.enabled ? 'Activated' : 'Deactivated'}`, kb.maskedUsersKeyboard(s));
  }
  if (data === 'masked:on') { settings.maskedUsers.enabled = true; await settings.save(); await answer('Masked users: ON'); return edit(`🤖 *Masked users*\n*Status:* ✅ Activated`, kb.maskedUsersKeyboard(settings.maskedUsers)); }
  if (data === 'masked:off') { settings.maskedUsers.enabled = false; await settings.save(); await answer('Masked users: OFF'); return edit(`🤖 *Masked users*\n*Status:* ❌ Deactivated`, kb.maskedUsersKeyboard(settings.maskedUsers)); }
  if (data === 'masked:delete_messages') { settings.maskedUsers.deleteMessages = !settings.maskedUsers.deleteMessages; await settings.save(); await answer(''); return edit(`🤖 *Masked users*`, kb.maskedUsersKeyboard(settings.maskedUsers)); }
  if (data === 'masked:exceptions') return edit('⚠️ *Exceptions*\nChannels added here will be exempt from the masked user block.', kb.backKeyboard('settings:masked'));

  // ── PERSONAL COMMANDS ─────────────────────────────────────────
  if (data === 'settings:personal') return edit(`📱 *Personal Commands, Personal Replies, Commands Alias*`, kb.personalCommandsKeyboard());
  if (data === 'personal:commands') { await answer(''); setPendingInput(userId, { action: 'add_personal_command', chatId }); return bot.sendMessage(chatId, '📱 *Add Personal Command*\n\nSend in format:\n`/commandname`\n`response text`', { parse_mode: 'Markdown' }); }
  if (data === 'personal:replies') { await answer(''); setPendingInput(userId, { action: 'add_personal_reply', chatId }); return bot.sendMessage(chatId, '📞 *Add Personal Reply*\n\nSend in format:\n`trigger phrase`\n`response text`', { parse_mode: 'Markdown' }); }
  if (data === 'personal:aliases') return edit('🦶 *Commands Alias*\nMap one command to another.\n\nExample: /hi → /start', kb.backKeyboard('settings:personal'));

  // ── MESSAGE LENGTH ────────────────────────────────────────────
  if (data === 'settings:msglength') {
    const s = settings.messageLength;
    return edit(`✏️ *Message length*\nSet min/max character length.\n\n*Penalty:* ${s.penalty}\n*Deletion:* ${s.deletion ? 'Yes' : 'No'}\n*Minimum:* ${s.minLength} chars\n*Maximum:* ${s.maxLength} chars`, kb.msgLengthKeyboard(s));
  }
  if (data.startsWith('msgl:')) {
    const action = data.split(':')[1];
    const punishments = ['off','warn','kick','mute','ban'];
    if (punishments.includes(action)) { settings.messageLength.penalty = action; await settings.save(); await answer(`Penalty: ${action}`); }
    else if (action === 'delete_messages') { settings.messageLength.deletion = !settings.messageLength.deletion; await settings.save(); await answer(''); }
    else if (action === 'min') { await answer(''); setPendingInput(userId, { action: 'set_msglen_min', chatId }); return bot.sendMessage(chatId, '✏️ Send the minimum message length in characters (0 = no limit):'); }
    else if (action === 'max') { await answer(''); setPendingInput(userId, { action: 'set_msglen_max', chatId }); return bot.sendMessage(chatId, '✏️ Send the maximum message length in characters:'); }
    return edit(`✏️ *Message length*\n*Penalty:* ${settings.messageLength.penalty}`, kb.msgLengthKeyboard(settings.messageLength));
  }

  // ── LOG CHANNEL ───────────────────────────────────────────────
  if (data === 'settings:logchannel') {
    return edit(`🔍 *Log Channel*\nSave all group logs to a channel.\n\nTo add a channel:\n1. Be founder of the channel\n2. Add @senpaihelppbot as admin\n3. Press "Add Log Channel"`, kb.logChannelKeyboard());
  }
  if (data === 'logchannel:add') { await answer(''); setPendingInput(userId, { action: 'set_log_channel', chatId }); return bot.sendMessage(chatId, '🔍 Send the log channel username (e.g. @mychannel) or ID:'); }

  // ── DISCUSSION, MAGIC, CHANNELS, PERMISSIONS ─────────────────
  if (['settings:discussion','settings:magic','settings:channels','settings:permissions'].includes(data)) {
    return edit('🚧 *Feature coming soon!*\nThis feature will be available in a future update.', kb.backKeyboard('settings:back_other'));
  }

  await answer('');
}

module.exports = { handleSettingsCommand, handleCallback, handlePendingInput, setPendingInput, getPendingInput, clearPendingInput };
