import fetch from 'node-fetch';
import { log } from './utils.js';

// Sends a plain-text message to a Telegram chat via the Bot API.
// Returns true on success; never throws so a failed alert can't crash the watch loop.
export async function notify(botToken, chatId, text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });

    if (!res.ok) {
      const body = await res.text();
      log(`Telegram notification failed (${res.status}): ${body}`);
      return false;
    }

    return true;
  } catch (err) {
    log(`Telegram notification error: ${err.message}`);
    return false;
  }
}
