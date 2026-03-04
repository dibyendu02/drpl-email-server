const express = require("express");
const multer = require("multer");
const validator = require("validator");
const { getDomainConfig } = require("../config/domains");
const { uploadFile } = require("../services/ftpUploader");
const { sendContactEmail } = require("../services/emailService");
const { contactLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("File type not allowed."));
    }
    if (!ALLOWED_EXTENSIONS.test(file.originalname)) {
      return cb(new Error("File extension not allowed."));
    }
    cb(null, true);
  },
});

function sanitize(value) {
  if (typeof value !== "string") return String(value);
  return validator.escape(validator.trim(value));
}

router.post("/", contactLimiter, upload.single("file"), async (req, res) => {
  try {
    // Validate origin
    const origin = req.headers.origin;
    const domainConfig = getDomainConfig(origin);
    if (!domainConfig) {
      return res.status(403).json({ error: "Origin not allowed." });
    }

    // Sanitize form fields (everything except 'file')
    const fields = {};
    for (const [key, value] of Object.entries(req.body)) {
      fields[sanitize(key)] = sanitize(value);
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No form fields provided." });
    }

    // Validate required fields
    if (!fields.email || !validator.isEmail(validator.unescape(fields.email))) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    if (!fields.message || validator.unescape(fields.message).trim().length === 0) {
      return res.status(400).json({ error: "Please provide a message." });
    }

    // Upload file if present
    let fileUrl = null;
    if (req.file) {
      const result = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        domainConfig
      );
      fileUrl = result.publicUrl;
    }

    // Send email
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress;

    await sendContactEmail({
      domain: domainConfig.domain,
      fields,
      fileUrl,
      clientIp,
    });

    return res.status(200).json({
      success: true,
      message: "Form submitted successfully.",
      ...(fileUrl && { fileUrl }),
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Handle multer errors
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large. Maximum 10MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err.message === "File type not allowed." || err.message === "File extension not allowed.") {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
