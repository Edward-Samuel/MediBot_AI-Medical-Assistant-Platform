const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createFirstAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log('❌ Admin already exists. Use the admin panel to create additional admins.');
      process.exit(1);
    }

    // Create first super admin
    const adminData = {
      username: 'admin',
      email: 'admin@medibot.com',
      password: 'admin123', // Change this in production!
      role: 'super_admin',
      permissions: {
        canUpload: true,
        canDelete: true,
        canManageAdmins: true
      }
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ First admin created successfully!');
    console.log('📋 Login credentials:');
    console.log(`   Username: ${adminData.username}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    console.log('🔗 Admin login URL: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating first admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createFirstAdmin();