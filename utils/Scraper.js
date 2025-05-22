const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chromium");
puppeteer.use(StealthPlugin());

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

async function safeGoto(page, url, options, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Navigating to ${url} (Attempt ${i + 1})`);
      await page.goto(url, options);
      return;
    } catch (err) {
      console.warn(`Retry ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) throw err;
    }
  }
}

async function scrapeTicketekSydney() {
  const browser = await puppeteer.launch({
    headless: chromium.headless,
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setDefaultNavigationTimeout(85000);

  let currentPage = 1;
  let hasNextPage = true;
  let allEvents = [];

  try {
    while (hasNextPage) {
      const url = `https://premier.ticketek.com.au/shows/genre.aspx?c=2048&k=Sydney&page=${currentPage}`;
      console.log(`Scraping page ${currentPage} - ${url}`);

      await safeGoto(page, url, {
        waitUntil: "domcontentloaded",
        timeout: 85000,
      });

      await autoScroll(page);

      const events = await page.evaluate(() => {
        const eventCards = document.querySelectorAll(".resultModule");
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

        return Array.from(eventCards).map((card) => {
          const title =
            card.querySelector(".contentEvent")?.textContent.trim() ||
            "Untitled Event";
          const dateElement = card.querySelector(".contentDate");
          const dateText = dateElement?.textContent.trim();
          const date = parseCustomDate(dateText) || null;
          const description =
            card.querySelector(".sub-title")?.textContent.trim() || "";
          const location =
            card.querySelector(".contentLocation")?.textContent.trim() ||
            "Sydney";
          const link = card.querySelector("a")?.href || "";
          const image = card.querySelector("img")?.src || "";

          return {
            title,
            date,
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

    console.log(`✅ Scraped total ${uniqueEvents.length} unique events.`);
    return uniqueEvents;
  } catch (err) {
    console.error("Scraping failed:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = {
  scrapeAll: scrapeTicketekSydney,
};
