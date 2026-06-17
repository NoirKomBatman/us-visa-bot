#!/usr/bin/env node

import { program, InvalidArgumentError } from 'commander';
import { botCommand } from './commands/bot.js';

// Reject anything that isn't a zero-padded YYYY-MM-DD date. Lexicographic
// comparison in the bot is only correct for that format, so we fail loud here
// rather than let a malformed arg silently produce wrong filtering results.
function asDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InvalidArgumentError(`"${value}" is not a valid date — use YYYY-MM-DD (e.g. 2026-09-17).`);
  }
  return value;
}

program
  .name('us-visa-bot')
  .description('Watch for earlier US visa appointments and notify via Telegram')
  .version('0.0.1');

program
  .command('bot')
  .description('Monitor visa appointments and send Telegram alerts for earlier dates')
  .requiredOption('-c, --current <date>', 'current booked date (YYYY-MM-DD)', asDate)
  .option('-m, --min <date>', 'minimum date acceptable (YYYY-MM-DD)', asDate)
  .action(botCommand);

// Default command for backward compatibility
program
  .requiredOption('-c, --current <date>', 'current booked date (YYYY-MM-DD)', asDate)
  .option('-m, --min <date>', 'minimum date acceptable (YYYY-MM-DD)', asDate)
  .action(botCommand);

program.parse();
