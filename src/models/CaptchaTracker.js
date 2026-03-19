const pendingCaptcha = new Map();

function setPending(chatId, userId, messageId, timeoutSeconds) {
  const key = `${chatId}:${userId}`;
  const timer = setTimeout(() => { pendingCaptcha.delete(key); }, timeoutSeconds * 1000);
  pendingCaptcha.set(key, { messageId, timer, timestamp: Date.now() });
}

function isPending(chatId, userId) {
  return pendingCaptcha.has(`${chatId}:${userId}`);
}

function resolveCaptcha(chatId, userId) {
  const key = `${chatId}:${userId}`;
  const data = pendingCaptcha.get(key);
  if (data) { clearTimeout(data.timer); pendingCaptcha.delete(key); return data; }
  return null;
}

module.exports = { setPending, isPending, resolveCaptcha };
