const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");

/**
 * ONE-TIME SETUP ENDPOINT
 * This endpoint should be disabled after initial setup
 * Set SETUP_ENABLED=false in environment variables to disable
 */
router.post("/initialize", async (req, res) => {
  try {
    // Check if setup is enabled
    if (process.env.SETUP_ENABLED !== "true") {
      return res.status(403).json({
        message: "Setup endpoint is disabled. Set SETUP_ENABLED=true to enable.",
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin user already exists. Setup has already been completed.",
      });
    }

    const results = {
      admin: null,
      patient: null,
      doctor: null,
    };

    // Create Admin User
    const adminData = {
      email: "admin@medibot.com",
      password: "Admin@123456",
      role: "admin",
      profile: {
        firstName: "Admin",
        lastName: "User",
      },
      adminPermissions: {
        canUpload: true,
        canDelete: true,
        canManageAdmins: true,
      },
    };

    const admin = new User(adminData);
    await admin.save();
    results.admin = {
      email: adminData.email,
      password: adminData.password,
      role: "admin",
    };

    // Create Demo Patient User
    const patientData = {
      email: "patient@demo.com",
      password: "password123",
      role: "patient",
      profile: {
        firstName: "Demo",
        lastName: "Patient",
        dateOfBirth: new Date("1990-01-01"),
        gender: "male",
        phone: "+1234567890",
        address: "123 Demo Street, Demo City",
      },
    };

    const patient = new User(patientData);
    await patient.save();
    results.patient = {
      email: patientData.email,
      password: patientData.password,
      role: "patient",
    };

    // Create Demo Doctor User
    const doctorUserData = {
      email: "doctor@demo.com",
      password: "password123",
      role: "doctor",
      profile: {
        firstName: "Dr. Demo",
        lastName: "Doctor",
        phone: "+1234567891",
      },
    };

    const doctorUser = new User(doctorUserData);
    await doctorUser.save();

    // Create corresponding Doctor profile
    const doctorProfileData = {
      userId: doctorUser._id,
      name: "Dr. Demo Doctor",
      specialization: "General Medicine",
      qualifications: ["MBBS", "MD"],
      experience: 10,
      email: "doctor@demo.com",
      phone: "+1234567891",
      availability: {
        monday: { available: true, slots: ["09:00-17:00"] },
        tuesday: { available: true, slots: ["09:00-17:00"] },
        wednesday: { available: true, slots: ["09:00-17:00"] },
        thursday: { available: true, slots: ["09:00-17:00"] },
        friday: { available: true, slots: ["09:00-17:00"] },
      },
      rating: 4.5,
      consultationFee: 50,
    };

    const doctorProfile = new Doctor(doctorProfileData);
    await doctorProfile.save();

    results.doctor = {
      email: doctorUserData.email,
      password: doctorUserData.password,
      role: "doctor",
    };

    res.json({
      message: "Initial users created successfully!",
      users: results,
      warning:
        "IMPORTANT: Change admin password immediately and set SETUP_ENABLED=false to disable this endpoint",
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      message: "Error creating initial users",
      error: error.message,
    });
  }
});

/**
 * Check setup status
 */
router.get("/status", async (req, res) => {
  try {
    const adminExists = await User.exists({ role: "admin" });
    const setupEnabled = process.env.SETUP_ENABLED === "true";

    res.json({
      setupCompleted: !!adminExists,
      setupEnabled: setupEnabled,
      message: adminExists
        ? "Setup already completed"
        : setupEnabled
          ? "Setup available - POST to /api/setup/initialize"
          : "Setup disabled - Set SETUP_ENABLED=true to enable",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error checking setup status",
      error: error.message,
    });
  }
});

module.exports = router;
