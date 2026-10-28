import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import multer from "multer";
import { rateLimit } from "express-rate-limit";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
const production = process.env.NODE_ENV === "production";
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
const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, maxlength: 254 },
  message: { type: String, required: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now, index: true },
  status: {
    type: String,
    enum: ["new", "in_progress", "completed"],
    default: "new",
    index: true,
  },
  adminNotes: { type: String, default: "", maxlength: 4000 },
  updatedAt: { type: Date, default: Date.now },
});
const Inquiry = mongoose.model("Inquiry", inquirySchema);
const GalleryItem = mongoose.model(
  "GalleryItem",
  new mongoose.Schema({
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 600 },
    category: {
      type: String,
      enum: ["3D Printing", "Software", "Web Design", "Other"],
      default: "3D Printing",
    },
    visible: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    gridFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    mimeType: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.mimetype,
      ),
    ),
});
function imageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "image/jpeg";
  if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  if (["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)))
    return "image/gif";
  return null;
}
function galleryDTO(item) {
  return {
    id: String(item._id),
    url: "/api/gallery/images/" + item._id,
    title: item.title,
    caption: item.title,
    description: item.description,
    category: item.category,
    visible: item.visible,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
  };
}
function gridBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "galleryImages",
  });
}

const Admin = mongoose.model(
  "Admin",
  new mongoose.Schema({
    username: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }),
);
const Session = mongoose.model(
  "AdminSession",
  new mongoose.Schema({
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    tokenHash: { type: String, unique: true, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  }),
);
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const COOKIE_NAME = "mtm_admin_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: production,
  sameSite: "strict",
  path: "/api/admin",
};
const sessionDuration = 8 * 60 * 60 * 1000;
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});
const inquiryLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((x) => {
        const i = x.indexOf("=");
        return i < 0 ? [] : [x.slice(0, i).trim(), x.slice(i + 1).trim()];
      })
      .filter((x) => x.length === 2),
  );
}
function sameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return res.status(403).json({ error: "Origin required." });
  try {
    const u = new URL(origin);
    const forwarded = req.get("x-forwarded-host");
    const host = forwarded || req.get("host");
    const allowed = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (
      (u.host === host && (u.protocol === "https:" || !production)) ||
      allowed.includes(origin)
    )
      return next();
  } catch {}
  return res.status(403).json({ error: "Origin not allowed." });
}
async function requireAdmin(req, res, next) {
  const token = cookies(req)[COOKIE_NAME];
  if (!token)
    return res.status(401).json({ error: "Authentication required." });
  try {
    const s = await Session.findOne({
      tokenHash: sha(token),
      expiresAt: { $gt: new Date() },
    }).lean();
    if (!s) return res.status(401).json({ error: "Session expired." });
    req.adminId = s.adminId;
    req.sessionHash = s.tokenHash;
    next();
  } catch (e) {
    next(e);
  }
}
async function sendNotification(inquiry) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    INQUIRY_NOTIFY_TO,
  } = process.env;
  if (!SMTP_HOST || !SMTP_FROM || !INQUIRY_NOTIFY_TO) return;
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  const safeText = `New MTM Enterprises inquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nMessage:\n${inquiry.message}\n\nView it in your admin dashboard.`;
  await transport.sendMail({
    from: SMTP_FROM,
    to: INQUIRY_NOTIFY_TO,
    subject: "New MTM Enterprises inquiry",
    text: safeText,
    replyTo: inquiry.email,
  });
}
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
app.get("/api/gallery", async (_req, res, next) => {
  try {
    const items = await GalleryItem.find({ visible: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json([
      ...items.map(galleryDTO),
      ...galleryFiles.map((name) => ({
        url: "/gallery/" + encodeURIComponent(name),
        caption: name.replace(/\.[^.]+$/, "").replaceAll("_", " "),
        title: name.replace(/\.[^.]+$/, "").replaceAll("_", " "),
        category: "Archive",
        legacy: true,
      })),
    ]);
  } catch (e) {
    next(e);
  }
});
app.get("/api/gallery/images/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
    const item = await GalleryItem.findById(req.params.id).lean();
    if (!item || !item.visible) return res.sendStatus(404);
    res.set({
      "Content-Type": item.mimeType,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    const stream = gridBucket().openDownloadStream(item.gridFileId);
    stream.on("error", (e) => {
      if (!res.headersSent) res.status(404).end();
      else res.destroy(e);
    });
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
});

app.post("/api/contact", inquiryLimit, async (req, res) => {
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
    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    // An email outage must not lose an accepted inquiry.
    sendNotification(inquiry).catch((e) =>
      console.error("Inquiry email notification failed:", e.message),
    );
    res.status(201).json({ status: "received" });
  } catch (err) {
    console.error("Inquiry save failed:", err.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});
app.post("/api/admin/login", loginLimit, sameOrigin, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.length > 100 ||
      password.length > 256
    )
      return res.status(400).json({ error: "Invalid request." });
    const admin = await Admin.findOne({
      username: username.trim().toLowerCase(),
    });
    // Always perform a slow hash comparison, including when the account does not exist.
    const fallback =
      "$2b$12$KIXQ4bTF6i5qkrDiSeNP8eA2Bv4a4PjzL0t6rmyqNvH4mynQ0uzWe";
    const valid = await bcrypt.compare(
      password,
      admin?.passwordHash || fallback,
    );
    if (!admin || !valid)
      return res.status(401).json({ error: "Invalid username or password." });
    const token = crypto.randomBytes(32).toString("base64url");
    await Session.create({
      adminId: admin._id,
      tokenHash: sha(token),
      expiresAt: new Date(Date.now() + sessionDuration),
    });
    res.cookie(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: sessionDuration,
    });
    res.json({ username: admin.username });
  } catch (e) {
    next(e);
  }
});
app.get("/api/admin/me", requireAdmin, async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.adminId).select("username").lean();
    if (!admin)
      return res.status(401).json({ error: "Authentication required." });
    res.json({ username: admin.username });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/admin/logout",
  sameOrigin,
  requireAdmin,
  async (req, res, next) => {
    try {
      await Session.deleteOne({ tokenHash: req.sessionHash });
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      res.json({ status: "logged_out" });
    } catch (e) {
      next(e);
    }
  },
);
app.get("/api/admin/inquiries", requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(
      1,
      Math.min(100000, Number.parseInt(req.query.page, 10) || 1),
    );
    const limit = 20;
    const status = typeof req.query.status === "string" ? req.query.status : "";
    if (status && !["new", "in_progress", "completed"].includes(status))
      return res.status(400).json({ error: "Invalid status." });
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";
    const filter = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            $or: [
              { name: { $regex: escapeRegex(search), $options: "i" } },
              { email: { $regex: escapeRegex(search), $options: "i" } },
              { message: { $regex: escapeRegex(search), $options: "i" } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);
    res.json({
      items,
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (e) {
    next(e);
  }
});
app.get("/api/admin/gallery", requireAdmin, async (_req, res, next) => {
  try {
    const items = await GalleryItem.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json({ items: items.map(galleryDTO) });
  } catch (e) {
    next(e);
  }
});
app.post(
  "/api/admin/gallery",
  sameOrigin,
  requireAdmin,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ error: "Choose a JPG, PNG, WebP or GIF image (max 5 MB)." });
      const mime = imageType(req.file.buffer);
      if (!mime || mime !== req.file.mimetype)
        return res.status(400).json({ error: "Invalid image file." });
      const title = String(req.body.title || "").trim(),
        description = String(req.body.description || "").trim();
      const category = String(req.body.category || "3D Printing");
      if (
        !title ||
        title.length > 100 ||
        description.length > 600 ||
        !["3D Printing", "Software", "Web Design", "Other"].includes(category)
      )
        return res.status(400).json({ error: "Invalid gallery details." });
      const bucket = gridBucket();
      const stream = bucket.openUploadStream("gallery-upload", {
        contentType: mime,
      });
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
        stream.end(req.file.buffer);
      });
      let item;
      try {
        item = await GalleryItem.create({
          title,
          description,
          category,
          gridFileId: stream.id,
          mimeType: mime,
          visible: true,
          sortOrder: Date.now(),
        });
      } catch (e) {
        await bucket.delete(stream.id).catch(() => {});
        throw e;
      }
      res.status(201).json({ item: galleryDTO(item) });
    } catch (e) {
      next(e);
    }
  },
);
app.patch(
  "/api/admin/gallery/:id",
  sameOrigin,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        return res.status(400).json({ error: "Invalid ID." });
      const patch = {};
      for (const key of ["title", "description", "category"])
        if (req.body?.[key] !== undefined) {
          if (typeof req.body[key] !== "string")
            return res.status(400).json({ error: "Invalid field." });
          patch[key] = req.body[key].trim();
        }
      if ("title" in patch && (!patch.title || patch.title.length > 100))
        return res
          .status(400)
          .json({ error: "Title must be 1-100 characters." });
      if ("description" in patch && patch.description.length > 600)
        return res.status(400).json({ error: "Description too long." });
      if (
        "category" in patch &&
        !["3D Printing", "Software", "Web Design", "Other"].includes(
          patch.category,
        )
      )
        return res.status(400).json({ error: "Invalid category." });
      if (req.body?.visible !== undefined) {
        if (typeof req.body.visible !== "boolean")
          return res.status(400).json({ error: "Invalid visibility." });
        patch.visible = req.body.visible;
      }
      if (req.body?.sortOrder !== undefined) {
        if (!Number.isSafeInteger(req.body.sortOrder))
          return res.status(400).json({ error: "Invalid order." });
        patch.sortOrder = req.body.sortOrder;
      }
      if (!Object.keys(patch).length)
        return res.status(400).json({ error: "No changes." });
      const item = await GalleryItem.findByIdAndUpdate(
        req.params.id,
        { $set: patch },
        { new: true, runValidators: true },
      ).lean();
      if (!item) return res.sendStatus(404);
      res.json({ item: galleryDTO(item) });
    } catch (e) {
      next(e);
    }
  },
);
app.delete(
  "/api/admin/gallery/:id",
  sameOrigin,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.sendStatus(404);
      const item = await GalleryItem.findByIdAndDelete(req.params.id).lean();
      if (!item) return res.sendStatus(404);
      await gridBucket()
        .delete(item.gridFileId)
        .catch((e) => console.error("Gallery image cleanup:", e.message));
      res.json({ deleted: true });
    } catch (e) {
      next(e);
    }
  },
);
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
app.patch(
  "/api/admin/inquiries/:id",
  sameOrigin,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        return res.status(400).json({ error: "Invalid inquiry ID." });
      const { status, adminNotes } = req.body || {};
      const update = { updatedAt: new Date() };
      if (status !== undefined) {
        if (!["new", "in_progress", "completed"].includes(status))
          return res.status(400).json({ error: "Invalid status." });
        update.status = status;
      }
      if (adminNotes !== undefined) {
        if (typeof adminNotes !== "string" || adminNotes.length > 4000)
          return res
            .status(400)
            .json({ error: "Notes must be 4000 characters or fewer." });
        update.adminNotes = adminNotes;
      }
      if (status === undefined && adminNotes === undefined)
        return res.status(400).json({ error: "No changes supplied." });
      const item = await Inquiry.findByIdAndUpdate(
        req.params.id,
        { $set: update },
        { new: true, runValidators: true },
      ).lean();
      if (!item) return res.status(404).json({ error: "Inquiry not found." });
      res.json({ item });
    } catch (e) {
      next(e);
    }
  },
);
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError)
    return res
      .status(400)
      .json({
        error:
          err.code === "LIMIT_FILE_SIZE"
            ? "Image must be 5 MB or smaller."
            : "Invalid upload.",
      });
  console.error("API error:", err.message);
  res.status(500).json({ error: "Unexpected server error." });
});
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
