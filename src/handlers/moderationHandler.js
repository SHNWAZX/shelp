const { getGroupSettings, isAdmin, applyPunishment, formatMessage, hasArabic, hasCyrillic, hasChinese, hasLatin, hasTelegramLink, hasAnyLink, getUserMention } = require('../utils/helpers');
const { isFlooding } = require('../models/FloodTracker');
const { t } = require('../utils/i18n');

async function handleGroupMessage(bot, msg) {
  if (!msg?.chat || msg.chat.type === 'private' || !msg.from) return;
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  if (await isAdmin(bot, chatId, userId)) return;

  const settings = await getGroupSettings(chatId);
  const lang = settings.language || 'en';
  const text = msg.text || msg.caption || '';

  // ── MASKED USERS (channel persona) ──────────────────────────
  if (settings.maskedUsers?.enabled && msg.sender_chat) {
    if (settings.maskedUsers.deleteMessages) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    return;
  }

  // ── ANTI-FLOOD ───────────────────────────────────────────────
  if (settings.antiflood?.enabled && settings.antiflood.punishment !== 'off') {
    const flooded = isFlooding(chatId, userId, settings.antiflood.messages, settings.antiflood.timeSeconds);
    if (flooded) {
      if (settings.antiflood.deleteMessages) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (settings.antiflood.punishment === 'warn') await addWarn(bot, chatId, userId, msg.from, settings, lang, 'Antiflood');
      else if (settings.antiflood.punishment === 'deletion') {}
      else {
        await applyPunishment(bot, chatId, userId, settings.antiflood.punishment);
        bot.sendMessage(chatId, `🌧 ${getUserMention(msg.from)} was ${settings.antiflood.punishment}ed for flooding.`, { parse_mode: 'Markdown' }).then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000); });
      }
      return;
    }
  }

  // ── ANTI-SPAM ────────────────────────────────────────────────
  if (settings.antispam?.telegramLinks && text && hasTelegramLink(text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, '🚫 Telegram links are not allowed.').then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 4000); });
    return;
  }
  if (settings.antispam?.totalLinksBlock && text && hasAnyLink(text)) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }
  if (settings.antispam?.forwarding && msg.forward_from) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }
  if (settings.antispam?.quotes && msg.reply_to_message?.forward_from) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }

  // ── ALPHABETS ────────────────────────────────────────────────
  if (text) {
    const alphaChecks = [
      { key: 'arabic', check: hasArabic },
      { key: 'cyrillic', check: hasCyrillic },
      { key: 'chinese', check: hasChinese },
      { key: 'latin', check: hasLatin }
    ];
    for (const { key, check } of alphaChecks) {
      const alpha = settings.alphabets?.[key];
      if (alpha?.enabled && check(text)) {
        const p = alpha.punishment;
        if (p === 'deletion') { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); }
        else if (p === 'warn') { await addWarn(bot, chatId, userId, msg.from, settings, lang, `${key} alphabet`); bot.deleteMessage(chatId, msg.message_id).catch(() => {}); }
        else { await applyPunishment(bot, chatId, userId, p); bot.sendMessage(chatId, `🚫 ${getUserMention(msg.from)} was ${p}ed for using ${key} alphabet.`, { parse_mode: 'Markdown' }); }
        return;
      }
    }
  }

  // ── BANNED WORDS ─────────────────────────────────────────────
  if (text && settings.bannedWords) {
    const lower = text.toLowerCase();
    const allWords = [...(settings.bannedWords.words || []), ...(settings.bannedWords.words2 || [])];
    const found = allWords.some(w => lower.includes(w.toLowerCase()));
    if (found) {
      if (settings.bannedWords.deletion) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (settings.bannedWords.penalty && settings.bannedWords.penalty !== 'off') {
        if (settings.bannedWords.penalty === 'warn') await addWarn(bot, chatId, userId, msg.from, settings, lang, 'banned word');
        else { await applyPunishment(bot, chatId, userId, settings.bannedWords.penalty); bot.sendMessage(chatId, `🚫 ${getUserMention(msg.from)} was ${settings.bannedWords.penalty}ed for using a banned word.`, { parse_mode: 'Markdown' }); }
      }
      return;
    }
  }

  // ── BLACKLIST ────────────────────────────────────────────────
  if (text && settings.blocks?.blacklist?.words?.length > 0) {
    const lower = text.toLowerCase();
    if (settings.blocks.blacklist.words.some(w => lower.includes(w.toLowerCase()))) {
      bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      return;
    }
  }

  // ── MEDIA BLOCK ───────────────────────────────────────────────
  const mediaTypeMap = [
    { key: 'photo', check: () => msg.photo && !msg.media_group_id },
    { key: 'album', check: () => msg.photo && msg.media_group_id },
    { key: 'video', check: () => msg.video },
    { key: 'audio', check: () => msg.audio },
    { key: 'voice', check: () => msg.voice },
    { key: 'sticker', check: () => msg.sticker && !msg.sticker.is_animated && !msg.sticker.is_video },
    { key: 'animatedStickers', check: () => msg.sticker?.is_animated },
    { key: 'gif', check: () => msg.animation },
    { key: 'file', check: () => msg.document },
    { key: 'animatedEmoji', check: () => msg.sticker?.is_video }
  ];
  for (const { key, check } of mediaTypeMap) {
    const punishment = settings.media?.[key];
    if (punishment && punishment !== 'off' && check()) {
      if (punishment === 'deletion') { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); }
      else if (punishment === 'warn') { await addWarn(bot, chatId, userId, msg.from, settings, lang, `media (${key})`); bot.deleteMessage(chatId, msg.message_id).catch(() => {}); }
      else { await applyPunishment(bot, chatId, userId, punishment); bot.sendMessage(chatId, `🚫 Media blocked in this group.`); }
      return;
    }
  }

  // ── NIGHT MODE ────────────────────────────────────────────────
  if (settings.nightMode?.enabled) {
    const hour = new Date().getUTCHours();
    if (hour >= 22 || hour < 7) {
      if (settings.nightMode.globalSilence) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }
      if (settings.nightMode.deleteMedias && (msg.photo || msg.video || msg.sticker || msg.animation || msg.voice || msg.audio)) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }
    }
  }

  // ── GLOBAL SILENCE ────────────────────────────────────────────
  if (settings.deletingMessages?.globalSilence) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); return; }

  // ── MESSAGE LENGTH ────────────────────────────────────────────
  if (text && settings.messageLength?.penalty !== 'off') {
    const len = text.length;
    const { minLength, maxLength, penalty, deletion } = settings.messageLength;
    const tooShort = minLength > 0 && len < minLength;
    const tooLong = maxLength > 0 && len > maxLength;
    if (tooShort || tooLong) {
      if (deletion) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
      if (penalty === 'warn') await addWarn(bot, chatId, userId, msg.from, settings, lang, tooShort ? 'message too short' : 'message too long');
      else if (penalty !== 'off') await applyPunishment(bot, chatId, userId, penalty);
      return;
    }
  }

  // ── PERSONAL REPLIES ─────────────────────────────────────────
  if (text && settings.personalReplies?.length > 0) {
    const lower = text.toLowerCase();
    for (const reply of settings.personalReplies) {
      if (reply.enabled && lower.includes(reply.trigger.toLowerCase())) {
        bot.sendMessage(chatId, reply.response, { reply_to_message_id: msg.message_id });
        break;
      }
    }
  }
}

async function handleNewMember(bot, msg) {
  if (!msg.new_chat_members) return;
  const chatId = msg.chat.id;
  const settings = await getGroupSettings(chatId);
  const lang = settings.language || 'en';

  for (const newMember of msg.new_chat_members) {
    if (newMember.is_bot) {
      try {
        const me = await bot.getMe();
        if (newMember.id === me.id) { settings.chatTitle = msg.chat.title || ''; await settings.save(); continue; }
      } catch {}
      if (settings.blocks?.botBlock) { bot.banChatMember(chatId, newMember.id).catch(() => {}); continue; }
    }

    // Join block
    if (settings.blocks?.joinBlock) { bot.banChatMember(chatId, newMember.id).catch(() => {}).then(() => bot.unbanChatMember(chatId, newMember.id).catch(() => {})); continue; }

    // Delete service message
    if (settings.deletingMessages?.serviceMessages) { bot.deleteMessage(chatId, msg.message_id).catch(() => {}); }

    // Captcha
    if (settings.captcha?.enabled) {
      const captchaTracker = require('../models/CaptchaTracker');
      try {
        await bot.restrictChatMember(chatId, newMember.id, {
          permissions: { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_voice_notes: false, can_send_other_messages: false }
        });
      } catch {}

      const captchaText = t(lang, 'captcha_msg', { name: newMember.first_name, timeout: settings.captcha.timeoutSeconds });
      const captchaMsg = await bot.sendMessage(chatId, captchaText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: t(lang, 'captcha_verify_btn'), callback_data: `captcha_verify:${newMember.id}` }]] }
      });

      captchaTracker.setPending(chatId, newMember.id, captchaMsg.message_id, settings.captcha.timeoutSeconds);

      setTimeout(async () => {
        if (captchaTracker.isPending(chatId, newMember.id)) {
          captchaTracker.resolveCaptcha(chatId, newMember.id);
          bot.deleteMessage(chatId, captchaMsg.message_id).catch(() => {});
          const p = settings.captcha.punishment || 'kick';
          if (p !== 'off') {
            await applyPunishment(bot, chatId, newMember.id, p);
            bot.sendMessage(chatId, t(lang, 'captcha_failed', { name: newMember.first_name, punishment: p }), { parse_mode: 'Markdown' }).then(m => { setTimeout(() => bot.deleteMessage(chatId, m.message_id).catch(() => {}), 5000); });
          }
        }
      }, settings.captcha.timeoutSeconds * 1000);
      continue;
    }

    // Welcome
    if (settings.welcome?.enabled) {
      const welcomeText = formatMessage(settings.welcome.text || t(lang, 'welcome_default'), newMember, msg.chat);
      const opts = { parse_mode: 'Markdown' };
      if (settings.welcome.urlButtons?.length > 0) {
        opts.reply_markup = { inline_keyboard: [settings.welcome.urlButtons.map(b => ({ text: b.text, url: b.url }))] };
      }
      if (settings.welcome.mediaFileId && settings.welcome.mediaType) {
        const sendFn = settings.welcome.mediaType === 'photo' ? 'sendPhoto' : settings.welcome.mediaType === 'video' ? 'sendVideo' : 'sendAnimation';
        bot[sendFn](chatId, settings.welcome.mediaFileId, { caption: welcomeText, ...opts }).catch(() => bot.sendMessage(chatId, welcomeText, opts));
      } else {
        bot.sendMessage(chatId, welcomeText, opts);
      }
      if (settings.welcome.deleteLastMessage) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    }

    // Log
    await logEvent(bot, settings, `👋 New member: ${newMember.first_name} (${newMember.id}) joined ${msg.chat.title}`);
  }
}

async function handleLeftMember(bot, msg) {
  if (!msg.left_chat_member) return;
  const chatId = msg.chat.id;
  const settings = await getGroupSettings(chatId);
  const lang = settings.language || 'en';
  const leftMember = msg.left_chat_member;
  if (settings.deletingMessages?.serviceMessages) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  if (settings.goodbye?.enabled) {
    const goodbyeText = formatMessage(settings.goodbye.message || t(lang, 'goodbye_default'), leftMember, msg.chat);
    bot.sendMessage(chatId, goodbyeText, { parse_mode: 'Markdown' });
    if (settings.goodbye.deleteLastMessage) bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }
  await logEvent(bot, settings, `👋 Member left: ${leftMember.first_name} (${leftMember.id}) left ${msg.chat.title}`);
}

async function handleChatJoinRequest(bot, joinRequest) {
  const chatId = joinRequest.chat.id;
  const settings = await getGroupSettings(chatId);
  if (settings.approvalMode?.autoApproval && !settings.captcha?.enabled) {
    try {
      await bot.approveChatJoinRequest(chatId, joinRequest.from.id);
    } catch {}
  }
}

// Notify a banned user when they try to access the group
async function notifyBannedUser(bot, userId, lang = 'en') {
  try {
    await bot.sendMessage(userId, t(lang, 'ban_access_denied'), { parse_mode: 'Markdown' });
  } catch {}
}

async function addWarn(bot, chatId, userId, userObj, settings, lang, reason = '') {
  const UserWarning = require('../models/UserWarning');
  let userWarn = await UserWarning.findOne({ chatId: String(chatId), userId: String(userId) });
  if (!userWarn) {
    userWarn = new UserWarning({ chatId: String(chatId), userId: String(userId), username: userObj.username || '', firstName: userObj.first_name || '' });
  }
  userWarn.warns++;
  if (reason) userWarn.warnReasons.push({ reason });
  userWarn.updatedAt = new Date();
  await userWarn.save();

  const maxWarns = settings.warns?.maxWarns || 3;
  const mention = getUserMention(userObj);

  if (userWarn.warns >= maxWarns) {
    const punishment = settings.warns?.punishment || 'mute';
    const muteDuration = settings.warns?.muteDuration || 0;
    await applyPunishment(bot, chatId, userId, punishment, muteDuration);
    userWarn.warns = 0;
    userWarn.warnReasons = [];
    await userWarn.save();
    const msg = await bot.sendMessage(chatId, t(lang, 'max_warns_reached', { user: `[${userObj.first_name}](tg://user?id=${userId})`, max: maxWarns, punishment }), { parse_mode: 'Markdown' });
    setTimeout(() => bot.deleteMessage(chatId, msg.message_id).catch(() => {}), 10000);
    await logEvent(bot, settings, `❗ ${userObj.first_name} reached ${maxWarns} warns → ${punishment}`);
  } else {
    const msg = await bot.sendMessage(chatId, t(lang, 'warned_msg', { user: `[${userObj.first_name}](tg://user?id=${userId})`, warns: userWarn.warns, max: maxWarns }), { parse_mode: 'Markdown' });
    setTimeout(() => bot.deleteMessage(chatId, msg.message_id).catch(() => {}), 8000);
  }
}

async function logEvent(bot, settings, text) {
  if (!settings.logChannelId) return;
  try {
    await bot.sendMessage(settings.logChannelId, `📋 *Log* — ${settings.chatTitle || 'Group'}\n\n${text}`, { parse_mode: 'Markdown' });
  } catch {}
}

module.exports = { handleGroupMessage, handleNewMember, handleLeftMember, handleChatJoinRequest, notifyBannedUser, addWarn, logEvent };
