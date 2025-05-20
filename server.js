const express = require('express');
const dbConnect = require('./config/dbConfig');
const cors = require("cors");
const bodyParser = require("body-parser");
const scrapeEvents = require("./utils/Scraper");
const Event = require("./models/Event");
const app = express();
const UserEmail = require("./models/UserEmail");

app.use(cors());
app.use(bodyParser.json());

app.get("/api/events", async (req, res) => {
    const events = await Event.find({});
    res.json(events);
  });
  
  app.post("/api/redirect", async (req, res) => {
    const { email, link } = req.body;
    console.log("Email collected:", email);
    const userEmail =   new UserEmail({ email, link });
    await userEmail.save();

    // Optional: Save to DB or send email
    res.json({ redirect_url: link });
  });



dbConnect()
  .then(() => {
    console.log("✅ Database connected");
    scrapeEvents();
    app.listen(5000, () => {
      console.log("✅ Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });

