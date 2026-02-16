const mongoose = require("mongoose");
const path = require("path");
const Doctor = require("../models/Doctor");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

async function fixDoctorRatings() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Get all doctors
    const doctors = await Doctor.find({});
    console.log(`\nFound ${doctors.length} doctors to update`);

    let updated = 0;
    const doctorsData = require("../routes/doctorsData");

    for (const doctor of doctors) {
      try {
        // Find matching doctor data by license number
        const doctorInfo = doctorsData.find(d => d.licenseNumber === doctor.licenseNumber);
        
        if (doctorInfo) {
          // Update rating structure
          doctor.rating = {
            average: doctorInfo.rating,
            count: Math.floor(Math.random() * 200) + 50 // Random review count 50-250
          };
          
          await doctor.save();
          updated++;
          process.stdout.write(`\rUpdated ${updated}/${doctors.length} doctors`);
        }
      } catch (error) {
        console.error(`\n❌ Error updating doctor ${doctor.name}:`, error.message);
      }
    }

    console.log(`\n\nSuccessfully updated ${updated} doctor ratings!`);
    
    // Show sample ratings
    const sampleDoctors = await Doctor.find({}).limit(5).select('name specialization rating');
    console.log("\nSample doctor ratings:");
    sampleDoctors.forEach(doc => {
      console.log(`  ${doc.name} (${doc.specialization}): ${doc.rating.average} stars (${doc.rating.count} reviews)`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

fixDoctorRatings();
