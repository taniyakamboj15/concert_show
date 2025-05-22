const mongoose = require("mongoose");

const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  notified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Subscriber", SubscriberSchema);
