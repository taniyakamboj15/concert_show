const puppeteer = require("puppeteer");
const fs = require("fs");
const Event = require("../models/Event");

async function scrapeEvents() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Open the Eventbrite Sydney Events page
  await page.goto("https://www.eventbrite.com.au/d/australia--sydney/events/", {
    waitUntil: "networkidle2",
    timeout: 0, // Disable timeout
  });

  // ✅ Wait for event cards to appear — adjust this selector based on actual inspect result
  await page.waitForSelector("div.eds-event-card-content__content", {
    timeout: 30000, // 30 seconds
  });

  // Save a screenshot and HTML for debugging
  await page.screenshot({ path: "page.png", fullPage: true });
  const html = await page.content();
  fs.writeFileSync("page.html", html);

  // Extract events from the DOM
  const events = await page.evaluate(() => {
    const data = [];
    const cards = document.querySelectorAll("div.eds-event-card-content__content");

    cards.forEach(card => {
      const title = card.querySelector(".eds-event-card-content__title")?.innerText.trim();
      const date = card.querySelector(".eds-event-card-content__sub-title")?.innerText.trim();
      const link = card.closest("a")?.href;
      const image = card.closest("a")?.querySelector("img")?.src;

      if (title && link) {
        data.push({ title, date, link, image });
      }
    });

    return data;
  });

  console.log("🎯 Scraped Events:", events.length);
  if (events.length === 0) console.log("❌ No events found. Check screenshot or selectors.");

  await Event.deleteMany(); // Clear old
  await Event.insertMany(events); // Save new

  console.log("✅ Events scraped & saved in DB");
  await browser.close();
}

module.exports = scrapeEvents;
