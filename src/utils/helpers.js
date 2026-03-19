const GroupSettings = require('../models/GroupSettings');

async function getGroupSettings(chatId) {
  let settings = await GroupSettings.findOne({ chatId: String(chatId) });
  if (!settings) {
    settings = new GroupSettings({ chatId: String(chatId) });
    await settings.save();
  }
  return settings;
}

async function isAdmin(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return ['creator', 'administrator'].includes(member.status);
  } catch { return false; }
}

async function isCreator(bot, chatId, userId) {
  try {
    const member = await bot.getChatMember(chatId, userId);
    return member.status === 'creator';
  } catch { return false; }
}

function getUserMention(user) {
  const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  return `[${escapeMarkdown(name)}](tg://user?id=${user.id})`;
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+=|{}.!\\-]/g, '\\$&');
}

async function applyPunishment(bot, chatId, userId, punishment, muteDurationMinutes = 0) {
  try {
    switch (punishment) {
      case 'ban':
        await bot.banChatMember(chatId, userId);
        break;
      case 'kick':
        await bot.banChatMember(chatId, userId);
        await bot.unbanChatMember(chatId, userId);
        break;
      case 'mute': {
        const until = muteDurationMinutes > 0
          ? Math.floor(Date.now() / 1000) + muteDurationMinutes * 60
          : 0;
        await bot.restrictChatMember(chatId, userId, {
          permissions: {
            can_send_messages: false, can_send_audios: false,
            can_send_documents: false, can_send_photos: false,
            can_send_videos: false, can_send_video_notes: false,
            can_send_voice_notes: false, can_send_polls: false,
            can_send_other_messages: false, can_add_web_page_previews: false,
            can_change_info: false, can_invite_users: false, can_pin_messages: false
          },
          until_date: until
        });
        break;
      }
      default: break;
    }
  } catch (e) {
    console.error(`Punishment error (${punishment}):`, e.message);
  }
}

function formatOnOff(val) {
  return val ? '✅ On' : '❌ Off';
}

function formatMessage(template, user, chat) {
  const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  return template
    .replace(/{user}/g, `[${name}](tg://user?id=${user.id})`)
    .replace(/{username}/g, user.username ? `@${user.username}` : name)
    .replace(/{group}/g, chat.title || 'Group')
    .replace(/{id}/g, user.id)
    .replace(/{name}/g, name);
}

function hasArabic(text) { return /[\u0600-\u06FF\u0750-\u077F]/.test(text); }
function hasCyrillic(text) { return /[\u0400-\u04FF]/.test(text); }
function hasChinese(text) { return /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text); }
function hasLatin(text) { return /[a-zA-Z]/.test(text); }
function hasTelegramLink(text) { return /(?:https?:\/\/)?(?:t\.me|telegram\.me|telegram\.dog)\/\S+/i.test(text); }
function hasAnyLink(text) { return /https?:\/\/\S+|www\.\S+/i.test(text); }

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = {
  getGroupSettings, isAdmin, isCreator, getUserMention, escapeMarkdown,
  applyPunishment, formatOnOff, formatMessage,
  hasArabic, hasCyrillic, hasChinese, hasLatin, hasTelegramLink, hasAnyLink,
  sleep
};
