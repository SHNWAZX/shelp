const floodData = new Map();

function isFlooding(chatId, userId, maxMessages, timeSeconds) {
  const key = `${chatId}:${userId}`;
  const now = Date.now();
  if (!floodData.has(key)) {
    floodData.set(key, { count: 1, firstTime: now });
    return false;
  }
  const data = floodData.get(key);
  const elapsed = (now - data.firstTime) / 1000;
  if (elapsed > timeSeconds) {
    floodData.set(key, { count: 1, firstTime: now });
    return false;
  }
  data.count++;
  floodData.set(key, data);
  if (data.count >= maxMessages) {
    floodData.delete(key);
    return true;
  }
  return false;
}

function resetFlood(chatId, userId) {
  floodData.delete(`${chatId}:${userId}`);
}

module.exports = { isFlooding, resetFlood };
