require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { getAllowedOrigins } = require("./config/domains");
const contactRoute = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for rate limiting behind nginx/reverse proxy)
app.set("trust proxy", 1);

// CORS — only allow configured domains
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl) in dev only
      if (!origin && process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Parse JSON (for non-file requests)
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Contact form route
app.use("/contact", contactRoute);

// Global error handler
app.use((err, _req, res, _next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: Origin not allowed." });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`DRPL Email Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
