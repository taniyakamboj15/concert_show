const express = require("express");
const eventsRouter = express.Router();
const Event = require("../models/Event");
const Subscriber = require("../models/Subscriber");

// Get all events
eventsRouter.get("/events", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalEvents = await Event.countDocuments();
    const totalPages = Math.ceil(totalEvents / limit);

    const events = await Event.aggregate([
      {
        $addFields: {
          sortDate: { $ifNull: ["$date", new Date("9999-12-31")] },
        },
      },
      { $sort: { sortDate: 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.json({
      page,
      totalPages,
      totalEvents,
      events,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Handle ticket request
eventsRouter.post("/event/:id/request", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Save subscriber
    const subscriber = new Subscriber({
      email: req.body.email,
      event: event._id,
      notified: false,
    });
    await subscriber.save();

    // Redirect to original event
    res.json({ redirectUrl: event.link });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = eventsRouter;
