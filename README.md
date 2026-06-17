# US Visa Bot 🤖

An automated bot that monitors US visa interview appointment slots and sends you a **Telegram alert** whenever an earlier date becomes available. It never reschedules — booking is left entirely to you.

## Features

- 🔄 Continuously monitors available appointment slots
- 🔔 Sends a Telegram message listing every earlier date it finds
- 🧠 De-duplicates alerts — you're only pinged about newly-appeared dates, not the same slot every few seconds
- 🎯 Optional minimum-date constraint
- 📊 Detailed logging with timestamps
- 🔐 Credentials and bot token via environment variables
- 🚫 **Read-only** — the bot has no ability to book or change your appointment

## How It Works

The bot logs into your account on https://ais.usvisa-info.com/ and checks for available appointment dates every few seconds. Whenever it finds dates earlier than your current booking (and on or after your optional minimum date), it sends you a Telegram message with the list. You decide whether and how to reschedule.

## Prerequisites

- Node.js 16+
- A valid US visa interview appointment
- Access to https://ais.usvisa-info.com/
- A Telegram bot token (from [@BotFather](https://t.me/BotFather)) and your chat ID

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/us-visa-bot.git
cd us-visa-bot
```

2. Install dependencies:
```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | How to Find |
|----------|-------------|-------------|
| `EMAIL` | Your login email | Your credentials for ais.usvisa-info.com |
| `PASSWORD` | Your login password | Your credentials for ais.usvisa-info.com |
| `COUNTRY_CODE` | Your locale segment (`{lang}-{country}`) | Found in URL: `https://ais.usvisa-info.com/{COUNTRY_CODE}/` <br>Examples: `en-us`, `fr-fr` (France), `ru-kz` (Kazakhstan, Russian) |
| `SCHEDULE_ID` | Your appointment schedule ID | Found in URL when rescheduling: <br>`https://ais.usvisa-info.com/en-{COUNTRY_CODE}/niv/schedule/{SCHEDULE_ID}/continue_actions` |
| `FACILITY_ID` | Your consulate facility ID | Found in network calls when selecting dates, or inspect the date selector dropdown <br>Example: Paris = `44` |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Create a bot via [@BotFather](https://t.me/BotFather) and copy the token |
| `TELEGRAM_CHAT_ID` | The chat to message | Send your bot a message, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `result[].message.chat.id` |
| `REFRESH_DELAY` | Seconds between checks | Optional, defaults to 3 seconds |

## Usage

Run the bot with your current appointment date:

```bash
node src/index.js -c <current_date> [-m <min_date>]
```

### Command Line Arguments

| Flag | Long Form | Required | Description |
|------|-----------|----------|-------------|
| `-c` | `--current` | ✅ | Your current booked interview date (YYYY-MM-DD) — only earlier dates are reported |
| `-m` | `--min` | ❌ | Minimum acceptable date — dates before this are ignored |

### Examples

```bash
# Alert me about any date earlier than Sept 17, 2026
node src/index.js -c 2026-09-17

# Alert me only about dates between June 1 and Sept 17, 2026
node src/index.js -c 2026-09-17 -m 2026-06-01

# Get help
node src/index.js --help
```

## How It Behaves

The bot will:
1. **Log in** to your account using the provided credentials
2. **Check** for available dates every few seconds
3. **Filter** found dates:
   - Must be earlier than your current date (`-c`)
   - Must be on or after the minimum date (`-m`) if specified
4. **Notify** you on Telegram with every newly-available earlier date
5. **Continue** monitoring until you stop it (Ctrl-C)

A date that stays available won't re-alert you every poll. If a date disappears and later reappears, you'll be alerted again.

## Output Example

```
[2026-06-17T10:30:00.000Z] Watching for appointments earlier than 2026-09-17
[2026-06-17T10:30:00.000Z] Minimum acceptable date: 2026-06-01
[2026-06-17T10:30:01.000Z] Logging in
[2026-06-17T10:30:03.000Z] found 4 earlier date(s): 2026-06-01, 2026-07-02, 2026-09-03, 2026-09-15
[2026-06-17T10:30:03.000Z] Notifying about 4 new date(s): 2026-06-01, 2026-07-02, 2026-09-03, 2026-09-15
```

## License

This project is licensed under the ISC License.

## Disclaimer

This bot is for educational purposes. Use responsibly and in accordance with the terms of service of the visa appointment system. The authors are not responsible for any misuse or consequences.
