import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
const galleryFiles = [
  "20260606_092804.jpg",
  "dragon.jpeg",
  "IMG_20260606_105357.jpg",
  "IMG_20260606_105417.jpg",
  "IMG_20260606_105419.jpg",
  "SaturnVCube.jpg",
  "Scorpio_Charm.webp",
  "Toad_Totem_Backflow_Burne.webp",
];
const Inquiry = mongoose.model(
  "Inquiry",
  new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 254 },
    message: { type: String, required: true, maxlength: 4000 },
    createdAt: { type: Date, default: Date.now },
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({
    status: "ok",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  }),
);
app.get("/api/ready", (_req, res) =>
  mongoose.connection.readyState === 1
    ? res.json({ status: "ready" })
    : res.status(503).json({ status: "not ready" }),
);
app.get("/api/gallery", (_req, res) =>
  res.json(
    galleryFiles.map((name) => ({
      url: "/gallery/" + encodeURIComponent(name),
      caption: name.replace(/\.[^.]+$/, "").replaceAll("_", " "),
    })),
  ),
);
app.post(
  "/api/contact",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
  async (req, res) => {
    const { name, email, message } = req.body || {};
    if (
      ![name, email, message].every((x) => typeof x === "string" && x.trim()) ||
      name.length > 100 ||
      email.length > 254 ||
      message.length > 4000 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return res
        .status(400)
        .json({ error: "Enter a valid name, email, and message." });
    try {
      await Inquiry.create({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      res.status(201).json({ status: "received" });
    } catch (err) {
      console.error(err);
      res.status(503).json({ error: "Service temporarily unavailable." });
    }
  },
);
const port = Number(process.env.PORT || 3000);
let server;
async function connect() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  server = app.listen(port, "0.0.0.0", () => console.log(`API on ${port}`));
}
connect().catch((err) => {
  console.error("MongoDB startup failed", err);
  process.exit(1);
});
process.on("SIGTERM", async () => {
  server?.close();
  await mongoose.disconnect();
  process.exit(0);
});
