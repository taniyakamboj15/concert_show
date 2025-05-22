const cron = require("node-cron");
const { scrapeAll } = require("./Scraper");
const Event = require("../models/Event");

async function updateEvents() {
  try {
    const events = await scrapeAll();
    await Event.deleteMany({});
    await Event.insertMany(events);
    console.log(`Updated ${events.length} events`);
  } catch (err) {
    console.error("Scraping failed:", err);
  }
}

// Run every 6 hours
cron.schedule("0 */6 * * *", updateEvents);

// Initial run
updateEvents();
