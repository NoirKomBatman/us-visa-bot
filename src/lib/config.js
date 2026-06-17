import dotenv from 'dotenv';

dotenv.config();

export function getConfig() {
  const config = {
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
    scheduleId: process.env.SCHEDULE_ID,
    facilityId: process.env.FACILITY_ID,
    countryCode: process.env.COUNTRY_CODE,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    refreshDelay: Number(process.env.REFRESH_DELAY || 3)
  };

  validateConfig(config);
  return config;
}

const ENV_NAMES = {
  email: 'EMAIL',
  password: 'PASSWORD',
  scheduleId: 'SCHEDULE_ID',
  facilityId: 'FACILITY_ID',
  countryCode: 'COUNTRY_CODE',
  telegramBotToken: 'TELEGRAM_BOT_TOKEN',
  telegramChatId: 'TELEGRAM_CHAT_ID'
};

function validateConfig(config) {
  const missing = Object.keys(ENV_NAMES).filter(key => !config[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.map(k => ENV_NAMES[k]).join(', ')}`);
    process.exit(1);
  }
}

// countryCode is the full locale segment from your reschedule URL, e.g.
// "ru-kz" or "en-kz" — language prefix included, no longer hardcoded to "en".
export function getBaseUri(countryCode) {
  return `https://ais.usvisa-info.com/${countryCode}/niv`;
}
