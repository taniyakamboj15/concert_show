const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: false, default: null },
  description: { type: String },
  location: { type: String, required: true },
  link: { type: String, required: true },
  image: { type: String },
  source: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);
