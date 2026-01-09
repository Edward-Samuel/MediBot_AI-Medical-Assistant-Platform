const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdmin() {
  try {
    console.log('🚀 Setting up admin credentials...\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@medibot.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@medibot.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: 'admin@medibot.com',
      password: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        address: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'Admin State',
          zipCode: '12345',
          country: 'Admin Country'
        }
      },
      isVerified: true,
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('📧 Email: admin@medibot.com');
    console.log('🔑 Password: admin123');
    console.log('\n🎉 Admin setup complete!');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createAdmin();