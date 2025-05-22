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

cron.schedule("0 */6 * * *", updateEvents);

updateEvents();
