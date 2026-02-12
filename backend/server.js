const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const memoryMonitor = require("./utils/memoryMonitor");

// Initialize memory monitoring
memoryMonitor.startMonitoring(5000); // Check every 5 seconds
memoryMonitor.logMemoryUsage("Server startup");

const authRoutes = require("./routes/auth");
const appointmentRoutes = require("./routes/appointments");
const doctorRoutes = require("./routes/doctors");
const patientRoutes = require("./routes/patients");
const aiRoutes = require("./routes/ai");
const calendarRoutes = require("./routes/calendar");
const ttsRoutes = require("./routes/tts");
const chatHistoryRoutes = require("./routes/chatHistory");
const adminRoutes = require("./routes/admin");
const faqRoutes = require("./routes/faq");

// Initialize services
const faqService = require("./services/faqService");

const app = express();

// Trust proxy - required for rate limiting behind proxies/load balancers
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000"],
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Initialize services in background (non-blocking)
Promise.all([
  faqService
    .initialize()
    .catch((err) => console.warn("⚠️  FAQ service unavailable:", err.message)),
  // Add other service initializations here
])
  .then(() => {
    console.log("Optional services initialization completed");
  })
  .catch((err) => {
    console.warn("⚠️  Some services failed to initialize:", err.message);
  });

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialize FAQ service
faqService
  .initialize()
  .then((initialized) => {
    if (initialized) {
      console.log("FAQ service with Pinecone initialized");
    } else {
      console.log("⚠️  FAQ service initialized without Pinecone");
    }
  })
  .catch((err) => console.error("FAQ service initialization error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/chat-history", chatHistoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faq", faqRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      faqService: faqService.isInitialized() ? "initialized" : "limited",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
