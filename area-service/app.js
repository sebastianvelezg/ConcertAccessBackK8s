const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://mongodb:27017/eventdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Event data
const eventData = {
  capacity: 100000,
  areas: [
    { id: 1, name: "Main Stage - VIP", capacity: 10000 },
    { id: 2, name: "Main Stage - General", capacity: 30000 },
    { id: 3, name: "North Zone", capacity: 15000 },
    { id: 4, name: "South Zone", capacity: 15000 },
    { id: 5, name: "East Zone", capacity: 15000 },
    { id: 6, name: "West Zone", capacity: 15000 },
  ],
  entrances: [
    { id: 1, name: "Main Entrance - General" },
    { id: 2, name: "Entrance VIP" },
    { id: 3, name: "North Entrance" },
    { id: 4, name: "South Entrance" },
    { id: 5, name: "East Entrance" },
    { id: 6, name: "West Entrance" },
  ],
  controlPoints: [
    { id: 1, name: "Security Checkpoint - Main" },
    { id: 2, name: "Security Checkpoint - VIP" },
    { id: 3, name: "Security Checkpoint - North" },
    { id: 4, name: "Security Checkpoint - South" },
    { id: 5, name: "Security Checkpoint - East" },
    { id: 6, name: "Security Checkpoint - West" },
  ],
  routes: [
    { id: 1, entrance: 1, controlPoint: 1, area: 2 },
    { id: 2, entrance: 2, controlPoint: 2, area: 1 },
    { id: 3, entrance: 3, controlPoint: 3, area: 3 },
    { id: 4, entrance: 4, controlPoint: 4, area: 4 },
    { id: 5, entrance: 5, controlPoint: 5, area: 5 },
    { id: 6, entrance: 6, controlPoint: 6, area: 6 },
  ],
};

// Event Schema and Model
const EventSchema = new mongoose.Schema({
  capacity: Number,
  areas: [
    {
      id: Number,
      name: String,
      capacity: Number,
      currentOccupancy: { type: Number, default: 0 },
    },
  ],
  entrances: [
    { id: Number, name: String, count: { type: Number, default: 0 } },
  ],
  controlPoints: [
    { id: Number, name: String, count: { type: Number, default: 0 } },
  ],
  routes: [
    { id: Number, entrance: Number, controlPoint: Number, area: Number },
  ],
  totalOccupancy: { type: Number, default: 0 },
});

const Event = mongoose.model("Event", EventSchema);

// Initialize event data in the database
mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB");

  const eventCount = await Event.countDocuments();
  if (eventCount === 0) {
    console.log("Initializing event data...");
    try {
      // Initialize areas with currentOccupancy = 0
      const areas = eventData.areas.map((area) => ({
        ...area,
        currentOccupancy: 0,
      }));

      // Initialize entrances and controlPoints with count = 0
      const entrances = eventData.entrances.map((entrance) => ({
        ...entrance,
        count: 0,
      }));
      const controlPoints = eventData.controlPoints.map((cp) => ({
        ...cp,
        count: 0,
      }));

      // Create a new event document
      const event = new Event({
        capacity: eventData.capacity,
        areas,
        entrances,
        controlPoints,
        routes: eventData.routes,
        totalOccupancy: 0,
      });

      await event.save();
      console.log("Event data initialized.");
    } catch (error) {
      console.error("Error initializing event data:", error);
    }
  } else {
    console.log("Event data already initialized.");
  }
});

// Admin Routes

// Route to set up the event (admin)
app.post("/event/setup", async (req, res) => {
  const { capacity, areas, entrances, controlPoints, routes } = req.body;
  try {
    // Remove existing event data
    await Event.deleteMany({});
    // Create new event data
    const event = new Event({
      capacity,
      areas: areas.map((area) => ({ ...area, currentOccupancy: 0 })),
      entrances: entrances.map((entrance) => ({ ...entrance, count: 0 })),
      controlPoints: controlPoints.map((cp) => ({ ...cp, count: 0 })),
      routes,
      totalOccupancy: 0,
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to get event data (admin)
app.get("/event", async (req, res) => {
  try {
    const event = await Event.findOne();
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to update occupancy (staff)
app.post("/event/update-occupancy", async (req, res) => {
  const { ticketId, locationId, locationType } = req.body;
  try {
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let updateField;
    switch (locationType) {
      case "entrance":
        updateField = "entrances";
        break;
      case "controlPoint":
        updateField = "controlPoints";
        break;
      case "area":
        updateField = "areas";
        break;
      default:
        return res.status(400).json({ message: "Invalid location type" });
    }

    const locationIndex = event[updateField].findIndex(
      (item) => item.id === locationId
    );
    if (locationIndex === -1) {
      return res.status(404).json({ message: "Location not found" });
    }

    if (locationType === "area") {
      // Check if area capacity is reached
      if (
        event[updateField][locationIndex].currentOccupancy >=
        event[updateField][locationIndex].capacity
      ) {
        return res
          .status(400)
          .json({ message: "Area capacity has been reached" });
      }
      event[updateField][locationIndex].currentOccupancy += 1;
      event.totalOccupancy += 1;
    } else {
      event[updateField][locationIndex].count += 1;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to get occupancy statistics (admin)
app.get("/event/stats", async (req, res) => {
  try {
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const stats = {
      totalCapacity: event.capacity,
      totalOccupancy: event.totalOccupancy,
      occupancyRate: ((event.totalOccupancy / event.capacity) * 100).toFixed(2),
      areaStats: event.areas.map((area) => ({
        name: area.name,
        capacity: area.capacity,
        currentOccupancy: area.currentOccupancy,
        occupancyRate: ((area.currentOccupancy / area.capacity) * 100).toFixed(
          2
        ),
      })),
      entranceStats: event.entrances.map((entrance) => ({
        name: entrance.name,
        count: entrance.count,
      })),
      controlPointStats: event.controlPoints.map((cp) => ({
        name: cp.name,
        count: cp.count,
      })),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`Admin service running on port ${PORT}`));
