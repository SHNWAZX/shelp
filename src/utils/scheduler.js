const GroupSettings = require('../models/GroupSettings');

async function runRecurringMessages(bot) {
  try {
    const allGroups = await GroupSettings.find({ 'recurringMessages.0': { $exists: true } });
    const now = new Date();

    for (const settings of allGroups) {
      for (let i = 0; i < settings.recurringMessages.length; i++) {
        const msg = settings.recurringMessages[i];
        if (!msg.enabled) continue;

        const lastSent = msg.lastSent ? new Date(msg.lastSent) : null;
        const intervalMs = msg.intervalMinutes * 60 * 1000;

        if (!lastSent || (now - lastSent) >= intervalMs) {
          try {
            await bot.sendMessage(settings.chatId, msg.text, {
              message_thread_id: settings.topicId || undefined
            });
            settings.recurringMessages[i].lastSent = now;
          } catch (e) {
            console.error(`Recurring msg error for ${settings.chatId}:`, e.message);
          }
        }
      }
      await settings.save().catch(() => {});
    }
  } catch (e) {
    console.error('Recurring messages scheduler error:', e.message);
  }
}

function startScheduler(bot) {
  // Run every minute
  setInterval(() => runRecurringMessages(bot), 60 * 1000);
  console.log('⏰ Recurring messages scheduler started');
}

module.exports = { startScheduler };
