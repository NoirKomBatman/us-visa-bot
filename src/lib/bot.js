import { VisaHttpClient } from './client.js';
import { log } from './utils.js';

export class Bot {
  constructor(config) {
    this.config = config;
    this.client = new VisaHttpClient(this.config.countryCode, this.config.email, this.config.password);
  }

  async initialize() {
    log('Initializing visa bot...');
    return await this.client.login();
  }

  // Returns all available dates that are earlier than the current booking and
  // (if set) on or after minDate, sorted ascending. Returns [] if none.
  async checkAvailableDate(sessionHeaders, currentBookedDate, minDate) {
    const dates = await this.client.checkAvailableDate(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId
    );

    if (!dates || dates.length === 0) {
      log("no dates available");
      return [];
    }

    // Keep only dates earlier than the current booking and after the minimum.
    // Comparison is lexicographic and relies on YYYY-MM-DD formatting.
    const earlierDates = dates.filter(date => {
      if (date >= currentBookedDate) return false;
      if (minDate && date < minDate) return false;
      return true;
    });

    if (earlierDates.length === 0) {
      log("no earlier dates found after filtering");
      return [];
    }

    earlierDates.sort();
    log(`found ${earlierDates.length} earlier date(s): ${earlierDates.join(', ')}`);
    return earlierDates;
  }
}
