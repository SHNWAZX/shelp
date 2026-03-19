const { LANG_FLAGS } = require('./i18n');

function mainSettingsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📋 Regulation', callback_data: 'settings:regulation' }, { text: '📩 Anti-Spam', callback_data: 'settings:antispam' }],
      [{ text: '👋 Welcome', callback_data: 'settings:welcome' }, { text: '🌧 Anti-Flood', callback_data: 'settings:antiflood' }],
      [{ text: '👋 Goodbye 🆕', callback_data: 'settings:goodbye' }, { text: '🕉 Alphabets', callback_data: 'settings:alphabets' }],
      [{ text: '🧠 Captcha', callback_data: 'settings:captcha' }, { text: '🔍 Checks 🆕', callback_data: 'settings:checks' }],
      [{ text: '🆘 @Admin', callback_data: 'settings:admin' }, { text: '🔒 Blocks', callback_data: 'settings:blocks' }],
      [{ text: '🎬 Media', callback_data: 'settings:media' }, { text: '🔞 Porn', callback_data: 'settings:porn' }],
      [{ text: '❗ Warns', callback_data: 'settings:warns' }, { text: '🌙 Night', callback_data: 'settings:night' }],
      [{ text: '🔔 Tag', callback_data: 'settings:tag' }, { text: '🔗 Link', callback_data: 'settings:link' }],
      [{ text: '🔐 Approval mode', callback_data: 'settings:approval' }],
      [{ text: '🗑 Deleting Messages', callback_data: 'settings:deleting' }],
      [{ text: '🇬🇧 Lang', callback_data: 'settings:lang' }, { text: '✅ Close', callback_data: 'settings:close' }, { text: '▶️ Other', callback_data: 'settings:other' }]
    ]
  };
}

function otherSettingsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📁 Topic', callback_data: 'settings:topic' }],
      [{ text: '🔤 Banned Words', callback_data: 'settings:bannedwords' }],
      [{ text: '⏰ Recurring messages', callback_data: 'settings:recurring' }],
      [{ text: '👥 Members Management', callback_data: 'settings:members' }],
      [{ text: '🤖 Masked users', callback_data: 'settings:masked' }],
      [{ text: '📣 Discussion group 🆕', callback_data: 'settings:discussion' }],
      [{ text: '📱 Personal Commands', callback_data: 'settings:personal' }],
      [{ text: '🎭 Magic Stickers&GIFs', callback_data: 'settings:magic' }],
      [{ text: '✏️ Message length', callback_data: 'settings:msglength' }],
      [{ text: '📢 Channels management 🆕', callback_data: 'settings:channels' }],
      [{ text: '✏️ Permissions', callback_data: 'settings:permissions' }, { text: '🔍 Log Channel', callback_data: 'settings:logchannel' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }, { text: '✅ Close', callback_data: 'settings:close' }, { text: '🇬🇧 Lang', callback_data: 'settings:lang' }]
    ]
  };
}

function langKeyboard(currentLang) {
  const langs = Object.entries(LANG_FLAGS);
  const rows = [];
  for (let i = 0; i < langs.length; i += 2) {
    const row = [];
    for (let j = i; j < Math.min(i + 2, langs.length); j++) {
      const [code, label] = langs[j];
      row.push({ text: `${label}${code === currentLang ? ' ✅' : ''}`, callback_data: `lang:set:${code}` });
    }
    rows.push(row);
  }
  rows.push([{ text: '◀️ Back', callback_data: 'settings:back_main' }]);
  return { inline_keyboard: rows };
}

function regulationKeyboard() {
  return { inline_keyboard: [[{ text: '✍️ Customize message', callback_data: 'reg:customize' }], [{ text: '🚨 Commands Permissions', callback_data: 'reg:permissions' }], [{ text: '◀️ Back', callback_data: 'settings:back_main' }]] };
}

function antispamKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `📘 Telegram links${s.telegramLinks ? ' ✅' : ''}`, callback_data: 'antispam:telegram_links' }],
      [{ text: `📨 Forwarding${s.forwarding ? ' ✅' : ''}`, callback_data: 'antispam:forwarding' }, { text: `💬 Quote${s.quotes ? ' ✅' : ''}`, callback_data: 'antispam:quote' }],
      [{ text: `🔗 Total links block${s.totalLinksBlock ? ' ✅' : ''}`, callback_data: 'antispam:total_links' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function antifloodKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: '📄 Messages', callback_data: 'flood:messages' }, { text: '⏰ Time', callback_data: 'flood:time' }],
      [{ text: `❌ Off${s.punishment === 'off' ? ' ✓' : ''}`, callback_data: 'flood:off' }, { text: `❗ Warn${s.punishment === 'warn' ? ' ✓' : ''}`, callback_data: 'flood:warn' }],
      [{ text: `❗ Kick${s.punishment === 'kick' ? ' ✓' : ''}`, callback_data: 'flood:kick' }, { text: `🔇 Mute${s.punishment === 'mute' ? ' ✓' : ''}`, callback_data: 'flood:mute' }, { text: `🚫 Ban${s.punishment === 'ban' ? ' ✓' : ''}`, callback_data: 'flood:ban' }],
      [{ text: `🗑 Delete Messages${s.deleteMessages ? ' ✓' : ''}`, callback_data: 'flood:delete_messages' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function welcomeKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'welcome:off' }, { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'welcome:on' }],
      [{ text: '📄 Text', callback_data: 'welcome:set_text' }, { text: '👁 See', callback_data: 'welcome:see_text' }],
      [{ text: '🎬 Media', callback_data: 'welcome:set_media' }, { text: '👁 See', callback_data: 'welcome:see_media' }],
      [{ text: '🔘 Url Buttons', callback_data: 'welcome:set_buttons' }, { text: '👁 See', callback_data: 'welcome:see_buttons' }],
      [{ text: '👁👁 Full preview', callback_data: 'welcome:preview' }],
      [{ text: '📁 Select a Topic 🆕', callback_data: 'welcome:topic' }],
      [{ text: `🗑 Delete last msg${s.deleteLastMessage ? ' ✓' : ''}`, callback_data: 'welcome:delete_last' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function goodbyeKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'goodbye:off' }, { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'goodbye:on' }],
      [{ text: '✍️ Customize message', callback_data: 'goodbye:customize' }],
      [{ text: `💌 Send in private chat${s.sendPrivate ? ' ✓' : ' ❌'}`, callback_data: 'goodbye:private' }],
      [{ text: `♻️ Delete last message${s.deleteLastMessage ? ' ✓' : ' ❌'}`, callback_data: 'goodbye:delete_last' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function alphabetsKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `🕌 ARABIC${s.arabic.enabled ? ' ✅' : ''}`, callback_data: 'alpha:arabic' }, { text: `🇷🇺 CYRILLIC${s.cyrillic.enabled ? ' ✅' : ''}`, callback_data: 'alpha:cyrillic' }],
      [{ text: `🇨🇳 CHINESE${s.chinese.enabled ? ' ✅' : ''}`, callback_data: 'alpha:chinese' }, { text: `🔤 LATIN${s.latin.enabled ? ' ✅' : ''}`, callback_data: 'alpha:latin' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function alphabetSubKeyboard(type, s) {
  const enabled = s?.enabled;
  const p = s?.punishment || 'deletion';
  return {
    inline_keyboard: [
      [{ text: `❌ Turn off${!enabled ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:off` }, { text: `✓ Turn on${enabled ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:on` }],
      [{ text: `❗ Warn${p === 'warn' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:warn` }, { text: `❗ Kick${p === 'kick' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:kick` }],
      [{ text: `🔇 Mute${p === 'mute' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:mute` }, { text: `🚫 Ban${p === 'ban' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:ban` }],
      [{ text: `🗑 Deletion${p === 'deletion' ? ' ✓' : ''}`, callback_data: `alpha_sub:${type}:deletion` }],
      [{ text: '◀️ Back', callback_data: 'settings:alphabets' }]
    ]
  };
}

function captchaKeyboard() {
  return { inline_keyboard: [[{ text: '✅ Activate', callback_data: 'captcha:activate' }], [{ text: '◀️ Back', callback_data: 'settings:back_main' }]] };
}

function captchaActiveKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: '❌ Deactivate', callback_data: 'captcha:deactivate' }, { text: '⏱ Timeout', callback_data: 'captcha:timeout' }],
      [{ text: '🛡 Punishment', callback_data: 'captcha:punishment' }],
      [{ text: `🗑 Delete service msg${s.deleteServiceMessage ? ' ✓' : ' ❌'}`, callback_data: 'captcha:delete_service' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function checksKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: '📋 OBLIGATIONS', callback_data: 'checks:obligations' }, { text: '🚫 NAME BLOCKS', callback_data: 'checks:name_blocks' }],
      [{ text: `📋 Check at the join${s.checkAtJoin ? ' ✓' : ' ❌'}`, callback_data: 'checks:check_join' }],
      [{ text: `🗑 Delete Messages${s.deleteMessages ? ' ✓' : ' ❌'}`, callback_data: 'checks:delete_messages' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function adminReportKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Nobody${s.sendTo === 'nobody' ? ' ✓' : ''}`, callback_data: 'admin:nobody' }, { text: `👑 Founder${s.sendTo === 'founder' ? ' ✓' : ''}`, callback_data: 'admin:founder' }],
      [{ text: '👥 Staff Group', callback_data: 'admin:staff_group' }],
      [{ text: `🔔 Tag Founder${s.tagFounder ? ' ✓' : ' ❌'}`, callback_data: 'admin:tag_founder' }],
      [{ text: `🔔 Tag Admins${s.tagAdmins ? ' ✓' : ' ❌'}`, callback_data: 'admin:tag_admins' }],
      [{ text: '🔧 Advanced settings 🆕', callback_data: 'admin:advanced' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function blocksKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔥 Blacklist', callback_data: 'blocks:blacklist' }],
      [{ text: '🤖 Bot block', callback_data: 'blocks:bot' }],
      [{ text: '🧍 Join block 🆕', callback_data: 'blocks:join' }],
      [{ text: '📕 Leave block 🆕', callback_data: 'blocks:leave' }],
      [{ text: '🏃 Join-Leave block', callback_data: 'blocks:joinleave' }],
      [{ text: '👥 Multiple joins block', callback_data: 'blocks:multijoins' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function mediaKeyboard(s) {
  const items = [
    ['story','📱'],['photo','📸'],['video','🎬'],['album','🖼'],['gif','🎞'],
    ['voice','🎙'],['audio','🎧'],['sticker','🃏'],['animatedStickers','🎭'],
    ['animatedGames','🎲'],['animatedEmoji','😀'],['premiumEmoji','💎'],['file','📎']
  ];
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    const row = [];
    for (let j = i; j < Math.min(i+2, items.length); j++) {
      const [type, emoji] = items[j];
      const cur = s[type] || 'off';
      const icon = cur === 'off' ? '✅' : cur === 'warn' ? '❗' : cur === 'kick' ? '👢' : cur === 'mute' ? '🔇' : cur === 'ban' ? '🚫' : '🗑';
      row.push({ text: `${emoji} ${type} ${icon}`, callback_data: `media:${type}` });
    }
    rows.push(row);
  }
  rows.push([{ text: '◀️ Back', callback_data: 'settings:back_main' }]);
  return { inline_keyboard: rows };
}

function mediaSubKeyboard(type, cur) {
  return {
    inline_keyboard: [
      [{ text: `✅ Off${cur === 'off' ? ' ✓' : ''}`, callback_data: `media_set:${type}:off` }, { text: `❗ Warn${cur === 'warn' ? ' ✓' : ''}`, callback_data: `media_set:${type}:warn` }],
      [{ text: `👢 Kick${cur === 'kick' ? ' ✓' : ''}`, callback_data: `media_set:${type}:kick` }, { text: `🔇 Mute${cur === 'mute' ? ' ✓' : ''}`, callback_data: `media_set:${type}:mute` }, { text: `🚫 Ban${cur === 'ban' ? ' ✓' : ''}`, callback_data: `media_set:${type}:ban` }],
      [{ text: `🗑 Deletion${cur === 'deletion' ? ' ✓' : ''}`, callback_data: `media_set:${type}:deletion` }],
      [{ text: '◀️ Back', callback_data: 'settings:media' }]
    ]
  };
}

function warnsKeyboard(s) {
  const counts = [2,3,4,5,6].map(n => ({ text: `${n}${n === s.maxWarns ? ' ✅' : ''}`, callback_data: `warns:count:${n}` }));
  return {
    inline_keyboard: [
      [{ text: '📋 Warned List', callback_data: 'warns:list' }],
      [{ text: `❌ Off${s.punishment === 'off' ? ' ✓' : ''}`, callback_data: 'warns:off' }, { text: `❗ Kick${s.punishment === 'kick' ? ' ✓' : ''}`, callback_data: 'warns:kick' }],
      [{ text: `🔇 Mute${s.punishment === 'mute' ? ' ✓' : ''}`, callback_data: 'warns:mute' }, { text: `🚫 Ban${s.punishment === 'ban' ? ' ✓' : ''}`, callback_data: 'warns:ban' }],
      [{ text: '🔇⏱ Set mute duration', callback_data: 'warns:mute_duration' }],
      counts,
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function nightModeKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'night:off' }, { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'night:on' }],
      [{ text: `🎬 Delete medias${s.deleteMedias ? ' ✓' : ''}`, callback_data: 'night:delete_medias' }, { text: `🤫 Global Silence${s.globalSilence ? ' ✓' : ''}`, callback_data: 'night:global_silence' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function approvalKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: '🔐 Auto-approval ⬇️', callback_data: 'approval:info' }],
      [{ text: `❌ Turn off${!s.autoApproval ? ' ✓' : ''}`, callback_data: 'approval:off' }, { text: `✓ Turn on${s.autoApproval ? ' ✓' : ''}`, callback_data: 'approval:on' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function deletingMessagesKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `🤖 Commands${s.commands ? ' ✓' : ''}`, callback_data: 'deleting:commands' }],
      [{ text: `🤫 Global Silence${s.globalSilence ? ' ✓' : ''}`, callback_data: 'deleting:global_silence' }],
      [{ text: `✍️ Edit Checks${s.editChecks ? ' ✓' : ''}`, callback_data: 'deleting:edit_checks' }],
      [{ text: `💫 Service Messages${s.serviceMessages ? ' ✓' : ''}`, callback_data: 'deleting:service_messages' }],
      [{ text: `⏱ Scheduled deletion${s.scheduledDeletion ? ' ✓' : ''}`, callback_data: 'deleting:scheduled' }],
      [{ text: `📋 Block cancellation${s.blockCancellation ? ' ✓' : ''}`, callback_data: 'deleting:block_cancel' }],
      [{ text: '💥 Delete all messages', callback_data: 'deleting:delete_all' }],
      [{ text: '♻️ Messages self-destruction', callback_data: 'deleting:self_destruct' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_main' }]
    ]
  };
}

function bannedWordsKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Off${s.penalty === 'off' ? ' ✓' : ''}`, callback_data: 'bw:off' }, { text: `❗ Warn${s.penalty === 'warn' ? ' ✓' : ''}`, callback_data: 'bw:warn' }, { text: `❗ Kick${s.penalty === 'kick' ? ' ✓' : ''}`, callback_data: 'bw:kick' }],
      [{ text: `🔇 Mute${s.penalty === 'mute' ? ' ✓' : ''}`, callback_data: 'bw:mute' }, { text: `🚫 Ban${s.penalty === 'ban' ? ' ✓' : ''}`, callback_data: 'bw:ban' }],
      [{ text: `🗑 Delete Messages${s.deletion ? ' ✓' : ' ❌'}`, callback_data: 'bw:delete_messages' }],
      [{ text: '➕ Add', callback_data: 'bw:add' }, { text: '➖ Remove', callback_data: 'bw:remove' }],
      [{ text: '🔤 List', callback_data: 'bw:list' }],
      [{ text: '2️⃣ Banned Words 2 🆕', callback_data: 'bw:list2' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_other' }]
    ]
  };
}

function recurringMessagesKeyboard(messages) {
  const rows = messages.map((m, i) => [{ text: `📝 ${m.text.substring(0, 30)}... (${m.intervalMinutes}min)`, callback_data: `recurring:edit:${i}` }]);
  rows.push([{ text: '➕ Add message', callback_data: 'recurring:add' }]);
  rows.push([{ text: '◀️ Back', callback_data: 'settings:back_other' }]);
  return { inline_keyboard: rows };
}

function membersManagementKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '🔇 Unmute all', callback_data: 'members:unmute_all' }, { text: '🚫 Unban all', callback_data: 'members:unban_all' }],
      [{ text: '❗ Kick muted/restricted users', callback_data: 'members:kick_muted' }],
      [{ text: '💀 Kick deleted accounts', callback_data: 'members:kick_deleted' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_other' }]
    ]
  };
}

function maskedUsersKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Turn off${!s.enabled ? ' ✓' : ''}`, callback_data: 'masked:off' }, { text: `✓ Turn on${s.enabled ? ' ✓' : ''}`, callback_data: 'masked:on' }],
      [{ text: `🗑 Delete Messages${s.deleteMessages ? ' ✓' : ' ❌'}`, callback_data: 'masked:delete_messages' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_other' }, { text: '⚠️ Exceptions', callback_data: 'masked:exceptions' }]
    ]
  };
}

function personalCommandsKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📱 Personal Commands', callback_data: 'personal:commands' }],
      [{ text: '📞 Personal Replies', callback_data: 'personal:replies' }],
      [{ text: '🦶 Commands Alias', callback_data: 'personal:aliases' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_other' }]
    ]
  };
}

function msgLengthKeyboard(s) {
  return {
    inline_keyboard: [
      [{ text: `❌ Off${s.penalty === 'off' ? ' ✓' : ''}`, callback_data: 'msgl:off' }, { text: `❗ Warn${s.penalty === 'warn' ? ' ✓' : ''}`, callback_data: 'msgl:warn' }, { text: `❗ Kick${s.penalty === 'kick' ? ' ✓' : ''}`, callback_data: 'msgl:kick' }],
      [{ text: `🔇 Mute${s.penalty === 'mute' ? ' ✓' : ''}`, callback_data: 'msgl:mute' }, { text: `🚫 Ban${s.penalty === 'ban' ? ' ✓' : ''}`, callback_data: 'msgl:ban' }],
      [{ text: `🗑 Delete Messages${s.deletion ? ' ✓' : ' ❌'}`, callback_data: 'msgl:delete_messages' }],
      [{ text: '✏️ Minimum length', callback_data: 'msgl:min' }],
      [{ text: '✏️ Maximum length', callback_data: 'msgl:max' }],
      [{ text: '◀️ Back', callback_data: 'settings:back_other' }]
    ]
  };
}

function logChannelKeyboard() {
  return { inline_keyboard: [[{ text: '➕ Add Log Channel', callback_data: 'logchannel:add' }], [{ text: '◀️ Back', callback_data: 'settings:back_other' }]] };
}

function backKeyboard(backData = 'settings:back_main') {
  return { inline_keyboard: [[{ text: '◀️ Back', callback_data: backData }]] };
}

module.exports = {
  mainSettingsKeyboard, otherSettingsKeyboard, langKeyboard,
  regulationKeyboard, antispamKeyboard, antifloodKeyboard,
  welcomeKeyboard, goodbyeKeyboard, alphabetsKeyboard, alphabetSubKeyboard,
  captchaKeyboard, captchaActiveKeyboard, checksKeyboard, adminReportKeyboard,
  blocksKeyboard, mediaKeyboard, mediaSubKeyboard, warnsKeyboard,
  nightModeKeyboard, approvalKeyboard, deletingMessagesKeyboard,
  bannedWordsKeyboard, recurringMessagesKeyboard, membersManagementKeyboard,
  maskedUsersKeyboard, personalCommandsKeyboard, msgLengthKeyboard,
  logChannelKeyboard, backKeyboard
};
