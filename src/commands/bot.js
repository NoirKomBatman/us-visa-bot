import { Bot } from '../lib/bot.js';
import { getConfig } from '../lib/config.js';
import { notify } from '../lib/telegram.js';
import { log, sleep, isSocketHangupError } from '../lib/utils.js';

const BASE_RETRY = 60;                 // first backoff step, seconds
const MAX_RETRY = 1800;                // backoff cap (30 min)
const MAX_CONSECUTIVE_FAILURES = 5;    // abort before we hammer the login into a lockout

// Exponential backoff: 60s, 120s, 240s, ... capped at MAX_RETRY.
export function backoffSeconds(attempt) {
  return Math.min(BASE_RETRY * 2 ** (attempt - 1), MAX_RETRY);
}

// ±25% jitter so the poll cadence isn't a perfectly robotic 60.000s.
export function jitter(seconds) {
  const spread = seconds * 0.25;
  return seconds - spread + Math.random() * 2 * spread;
}

export async function botCommand(options) {
  const config = getConfig();
  const bot = new Bot(config);
  const currentBookedDate = options.current;
  const minDate = options.min;

  // Dates we've already alerted about, persisted across reconnects (via options)
  // so a re-login doesn't re-notify slots that were already reported.
  const seen = options._seen || new Set();

  // Consecutive auth/session failures across reconnects. Reset to 0 by any
  // successful poll; if it reaches MAX_CONSECUTIVE_FAILURES we abort rather than
  // keep re-logging in, which is what risks locking the account.
  let consecutiveFailures = options._failures || 0;

  log(`Watching for appointments earlier than ${currentBookedDate}`);
  if (minDate) {
    log(`Minimum acceptable date: ${minDate}`);
  }

  try {
    const sessionHeaders = await bot.initialize();

    while (true) {
      const earlierDates = await bot.checkAvailableDate(
        sessionHeaders,
        currentBookedDate,
        minDate
      );

      // A successful poll means login + session are healthy — clear the streak.
      consecutiveFailures = 0;

      const newDates = earlierDates.filter(date => !seen.has(date));

      if (newDates.length > 0) {
        const message =
          `🎯 ${newDates.length} earlier US visa slot(s) vs your ${currentBookedDate} booking:\n` +
          newDates.join('\n');
        log(`Notifying about ${newDates.length} new date(s): ${newDates.join(', ')}`);
        await notify(config.telegramBotToken, config.telegramChatId, message);
      }

      // Reset to the currently-available set: dates that linger don't re-spam,
      // but a date that disappears and later reappears will alert again.
      seen.clear();
      earlierDates.forEach(date => seen.add(date));

      await sleep(jitter(config.refreshDelay));
    }
  } catch (err) {
    // Transient network issues don't risk an account lock — retry indefinitely
    // with a fixed delay and don't count them toward the abort threshold.
    if (isSocketHangupError(err)) {
      log(`Network error: ${err.message}. Retrying in ${BASE_RETRY}s...`);
      await sleep(BASE_RETRY);
      return botCommand({ ...options, _seen: seen, _failures: consecutiveFailures });
    }

    // Auth/session/other errors mean a login attempt failed. Repeating these
    // rapidly is exactly what can lock the account, so back off and cap them.
    consecutiveFailures += 1;

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      log(`Aborting after ${consecutiveFailures} consecutive login/session failures (last: ${err.message}).`);
      log(`This usually means bad credentials or a throttled account. Fix it and restart — refusing to keep hammering the login.`);
      process.exit(1);
    }

    const wait = backoffSeconds(consecutiveFailures);
    log(`Session/authentication error: ${err.message}. Retry ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES} in ${wait}s...`);
    await sleep(wait);
    return botCommand({ ...options, _seen: seen, _failures: consecutiveFailures });
  }
}
