const express = require("express");
const dbConnect = require("./config/dbConfig");
const cors = require("cors");
const bodyParser = require("body-parser");
require("./utils/scheduler");
const app = express();
// const UserEmail = require("./models/UserEmail");
const eventRoutes = require("./routes/eventRoutes");
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

app.use(express.json());

app.use("/api", eventRoutes);
// app.post("/api/redirect", async (req, res) => {
//   const { email, link } = req.body;
//   console.log("Email collected:", email);
//   const userEmail = new UserEmail({ email, link });
//   await userEmail.save();

//   res.json({ redirect_url: link });
// });
app.get("/", (req, res) => {
  res.send("Welcome to the Concert API");
});

dbConnect()
  .then(() => {
    console.log("✅ Database connected");
    app.listen(5000, () => {
      console.log("✅ Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
  });
