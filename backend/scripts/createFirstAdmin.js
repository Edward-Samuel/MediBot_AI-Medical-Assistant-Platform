const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createFirstAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists. Use the registration form to create additional admins.');
      process.exit(1);
    }

    // Create first admin user
    const adminData = {
      email: 'admin@medibot.com',
      password: 'admin123', // Change this in production!
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      },
      adminPermissions: {
        canUpload: true,
        canDelete: true,
        canManageAdmins: true
      }
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ First admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('🔗 Login URL: http://localhost:3000/login');
    console.log('   After login, you can access the admin dashboard at: http://localhost:3000/admin/dashboard');

  } catch (error) {
    console.error('❌ Error creating first admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
createFirstAdmin();