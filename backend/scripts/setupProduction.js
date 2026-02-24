const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/User");
const Doctor = require("../models/Doctor");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// Doctors data
const doctorsData = require("../routes/doctorsData");

async function setupProduction() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is missing in environment variables.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const results = {
      admin: null,
      patient: null,
      doctors: 0,
    };

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (!existingAdmin) {
      // Create Admin User
      console.log("\nCreating Admin User...");
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
      results.admin = adminData.email;
      console.log("Admin created:", adminData.email);
    } else {
      console.log("Admin already exists:", existingAdmin.email);
      results.admin = existingAdmin.email;
    }

    // Check if demo patient exists
    const existingPatient = await User.findOne({ email: "patient@demo.com" });
    
    if (!existingPatient) {
      // Create Demo Patient User
      console.log("\nCreating Demo Patient User...");
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
          address: {
            street: "123 Demo Street",
            city: "Demo City",
            state: "CA",
            zipCode: "90001",
            country: "USA"
          }
        },
      };

      const patient = new User(patientData);
      await patient.save();
      results.patient = patientData.email;
      console.log("Demo patient created:", patientData.email);
    } else {
      console.log("Demo patient already exists");
      results.patient = existingPatient.email;
    }

    // Check how many doctors exist
    const existingDoctorsCount = await Doctor.countDocuments();
    console.log(`\nCurrent doctors in database: ${existingDoctorsCount}`);

    if (existingDoctorsCount === 0) {
      console.log(`\nCreating ${doctorsData.length} doctors...`);
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
            rating: {
              average: doctorData.rating,
              count: Math.floor(Math.random() * 200) + 50 // Random review count 50-250
            },
            consultationFee: 50 + Math.floor(Math.random() * 150),
            isVerified: true,
          });

          await doctorProfile.save();
          
          results.doctors++;
          specializationCount[doctorData.specialization] = 
            (specializationCount[doctorData.specialization] || 0) + 1;

          process.stdout.write(`\rCreated ${results.doctors}/${doctorsData.length} doctors`);

        } catch (error) {
          console.error(`\nError creating doctor ${doctorData.firstName}:`, error.message);
        }
      }

      console.log(`\n\nCreated ${results.doctors} doctors`);
      console.log("\nDoctors by specialization:");
      Object.entries(specializationCount).sort().forEach(([spec, count]) => {
        console.log(`  ${spec}: ${count}`);
      });
    } else {
      console.log("Doctors already exist in database");
      results.doctors = existingDoctorsCount;
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Production setup completed!");
    console.log("=".repeat(60));
    console.log("\nLogin Credentials:");
    console.log("\nAdmin:");
    console.log("  Email: admin@medibot.com");
    console.log("  Password: Admin@123456");
    
    console.log("\nDemo Patient:");
    console.log("  Email: patient@demo.com");
    console.log("  Password: password123");
    
    console.log(`\nDoctors: ${results.doctors} total`);
    console.log("  All doctors use password: password123");
    
    console.log("\nIMPORTANT:");
    console.log("  1. Change admin password immediately");
    console.log("  2. Set SETUP_ENABLED=false in Render");
    console.log("  3. Test login at your frontend URL");
    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("Error during setup:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
setupProduction();
