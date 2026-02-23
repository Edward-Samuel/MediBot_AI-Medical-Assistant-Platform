const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

async function createProductionUsers() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is missing in environment variables.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Create Admin User
    console.log("\nCreating Admin User...");
    const existingAdmin = await User.findOne({ email: "admin@medibot.com" });
    
    if (existingAdmin) {
      console.log(" Admin user already exists");
    } else {
      const adminData = {
        email: "admin@medibot.com",
        password: "Admin@123456", // Strong password
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
      console.log("Admin user created successfully!");
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
    }

    // Create Demo Patient User
    console.log("\nCreating Demo Patient User...");
    const existingPatient = await User.findOne({ email: "patient@demo.com" });
    
    if (existingPatient) {
      console.log(" Demo patient already exists");
    } else {
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
      console.log("Demo patient created successfully!");
      console.log(`   Email: ${patientData.email}`);
      console.log(`   Password: ${patientData.password}`);
    }

    // Create Demo Doctor User
    console.log("\nCreating Demo Doctor User...");
    const existingDoctor = await User.findOne({ email: "doctor@demo.com" });
    
    if (existingDoctor) {
      console.log(" Demo doctor already exists");
    } else {
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

      console.log("Demo doctor created successfully!");
      console.log(`   Email: ${doctorUserData.email}`);
      console.log(`   Password: ${doctorUserData.password}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Production users setup completed!");
    console.log("=".repeat(60));
    console.log("\n📝 Login Credentials Summary:");
    console.log("\n1. Admin User:");
    console.log("   Email: admin@medibot.com");
    console.log("   Password: Admin@123456");
    console.log("   Dashboard: /admin/dashboard");
    
    console.log("\n2. Demo Patient:");
    console.log("   Email: patient@demo.com");
    console.log("   Password: password123");
    console.log("   Dashboard: /patient/dashboard");
    
    console.log("\n3. Demo Doctor:");
    console.log("   Email: doctor@demo.com");
    console.log("   Password: password123");
    console.log("   Dashboard: /doctor/dashboard");
    
    console.log("\n IMPORTANT SECURITY NOTES:");
    console.log("   1. Change admin password immediately after first login");
    console.log("   2. Demo accounts are for testing only");
    console.log("   3. Delete or disable demo accounts in production");
    console.log("   4. Use strong passwords for all production accounts");
    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("Error creating users:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
createProductionUsers();
