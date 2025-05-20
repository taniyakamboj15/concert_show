// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  link: String,
  image: String,
});

module.exports = mongoose.model("Event", eventSchema);
