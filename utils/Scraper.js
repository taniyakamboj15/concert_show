const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const path = require("path");
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}
const chromePath =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  path.join(
    process.env.HOME || "/opt/render",
    ".cache",
    "puppeteer",
    "chrome",
    "linux-136.0.7103.94",
    "chrome-linux64",
    "chrome"
  );

async function scrapeTicketekSydney() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  let currentPage = 1;
  let hasNextPage = true;
  let allEvents = [];

  try {
    while (hasNextPage) {
      const url = `https://premier.ticketek.com.au/shows/genre.aspx?c=2048&k=Sydney&page=${currentPage}`;
      console.log(`Scraping page ${currentPage} - ${url}`);

      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      await autoScroll(page);

      const events = await page.evaluate(() => {
        const eventCards = document.querySelectorAll(".resultModule");
        return Array.from(eventCards).map((card) => {
          const title =
            card.querySelector(".contentEvent")?.textContent.trim() ||
            "Untitled Event";
          const dateElement = card.querySelector(".contentDate");

          // Months mapping
          const months = {
            Jan: 0,
            Feb: 1,
            Mar: 2,
            Apr: 3,
            May: 4,
            Jun: 5,
            Jul: 6,
            Aug: 7,
            Sep: 8,
            Oct: 9,
            Nov: 10,
            Dec: 11,
          };

          // Custom date parser
          function parseCustomDate(str) {
            if (!str) return null;
            const parts = str.split(" ");
            if (parts.length === 4) {
              const day = parseInt(parts[1], 10);
              const month = months[parts[2]];
              const year = parseInt(parts[3], 10);
              if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day).toISOString();
              }
            }
            return null;
          }

          let date = null;
          if (dateElement) {
            const dateText = dateElement.textContent.trim();
            date = parseCustomDate(dateText);
          }

          if (!date || typeof date !== "string") {
            date = null;
          }

          const description =
            card.querySelector(".sub-title")?.textContent.trim() || "";
          const location =
            card.querySelector(".contentLocation")?.textContent.trim() ||
            "Sydney";
          const link = card.querySelector("a")?.href || "";
          const image = card.querySelector("img")?.src || "";

          return {
            title,
            date, // date is either ISO string or null
            location,
            description,
            link,
            image,
            source: "Ticketek",
          };
        });
      });

      allEvents = allEvents.concat(events);

      const nextPageNumber = await page.evaluate(() => {
        const paginateDiv = document.getElementById(
          "ctl00_uiBodyMain_searchResultsControl_uiPaginateBottom_List"
        );
        if (!paginateDiv) return null;

        const nextLi = paginateDiv.querySelector("li.noBorder > a");
        if (!nextLi) return null;

        const href = nextLi.getAttribute("href");
        if (!href) return null;

        const urlParams = new URLSearchParams(href.split("?")[1]);
        return urlParams.get("page");
      });

      if (nextPageNumber && Number(nextPageNumber) > currentPage) {
        currentPage = Number(nextPageNumber);
        hasNextPage = true;
      } else {
        hasNextPage = false;
      }
    }

    const uniqueEvents = allEvents.filter(
      (e, i, a) => a.findIndex((ev) => ev.link === e.link) === i
    );

    console.log(`Scraped total ${uniqueEvents.length} events from all pages.`);
    return uniqueEvents;
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeAll: scrapeTicketekSydney,
};
