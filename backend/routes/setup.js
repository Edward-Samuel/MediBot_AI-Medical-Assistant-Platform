const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Doctor = require("../models/Doctor");

// Import doctors data
const doctorsData = require("./doctorsData");

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
      doctors: [],
      summary: {},
    };

    console.log("🚀 Starting production setup...");

    // Create Admin User
    console.log("Creating admin user...");
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
    console.log("✅ Admin created");

    // Create Demo Patient User
    console.log("Creating demo patient...");
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
    console.log("✅ Demo patient created");

    // Create all doctors
    console.log(`Creating ${doctorsData.length} doctors...`);
    let doctorCount = 0;
    const specializationCount = {};

    for (const doctorData of doctorsData) {
      try {
        // Create user account
        const doctorUser = new User({
          email: `${doctorData.firstName.toLowerCase()}.${doctorData.lastName.toLowerCase()}@medibot.com`,
          password: "password123",
          role: "doctor",
          profile: {
            firstName: doctorData.firstName,
            lastName: doctorData.lastName,
            phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
          },
          emailVerified: true,
          isActive: true,
        });

        const savedUser = await doctorUser.save();

        // Create doctor profile
        const doctorProfile = new Doctor({
          userId: savedUser._id,
          name: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
          specialization: doctorData.specialization,
          qualifications: ["MBBS", "MD", `${doctorData.specialization} Specialist`],
          experience: doctorData.experience,
          email: savedUser.email,
          phone: savedUser.profile.phone,
          bio: doctorData.bio,
          languages: doctorData.languages || ["English"],
          licenseNumber: doctorData.licenseNumber,
          availability: {
            monday: { available: true, slots: ["09:00-17:00"] },
            tuesday: { available: true, slots: ["09:00-17:00"] },
            wednesday: { available: true, slots: ["09:00-17:00"] },
            thursday: { available: true, slots: ["09:00-17:00"] },
            friday: { available: true, slots: ["09:00-17:00"] },
            saturday: { available: true, slots: ["09:00-13:00"] },
            sunday: { available: false, slots: [] },
          },
          rating: doctorData.rating,
          consultationFee: 50 + Math.floor(Math.random() * 150), // $50-$200
          isVerified: true,
        });

        await doctorProfile.save();
        
        doctorCount++;
        specializationCount[doctorData.specialization] = 
          (specializationCount[doctorData.specialization] || 0) + 1;

        results.doctors.push({
          name: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
          email: savedUser.email,
          specialization: doctorData.specialization,
        });

      } catch (error) {
        console.error(`Error creating doctor ${doctorData.firstName}:`, error.message);
      }
    }

    console.log(`✅ Created ${doctorCount} doctors`);

    results.summary = {
      totalDoctors: doctorCount,
      bySpecialization: specializationCount,
    };

    res.json({
      message: "Production setup completed successfully!",
      users: {
        admin: results.admin,
        patient: results.patient,
      },
      doctors: {
        total: doctorCount,
        bySpecialization: specializationCount,
        sample: results.doctors.slice(0, 5), // Show first 5 doctors
      },
      warning:
        "IMPORTANT: Change admin password immediately and set SETUP_ENABLED=false to disable this endpoint",
    });
  } catch (error) {
    console.error("Setup error:", error);
    res.status(500).json({
      message: "Error during setup",
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
