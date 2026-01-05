const mongoose = require('mongoose');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultFAQs = [
  {
    question: "How do I schedule a consultation with a doctor?",
    answer: "You can schedule a consultation by browsing our doctors page, selecting a doctor that matches your needs, and clicking 'View Profile' to see their availability. You can also use our AI chat assistant to get personalized doctor recommendations based on your symptoms.",
    category: "Appointments",
    tags: ["consultation", "scheduling", "doctor", "appointment"],
    priority: 10
  },
  {
    question: "Are consultations free on this platform?",
    answer: "Yes, all consultations on our platform are completely free. We believe healthcare guidance should be accessible to everyone without financial barriers.",
    category: "General",
    tags: ["free", "cost", "consultation", "pricing"],
    priority: 9
  },
  {
    question: "How does the AI medical assistant work?",
    answer: "Our AI medical assistant uses advanced language models to understand your symptoms and health concerns. It can provide general medical information, recommend appropriate medical specializations, and help you find suitable doctors. However, it's not a replacement for professional medical diagnosis.",
    category: "Medical",
    tags: ["ai", "assistant", "symptoms", "diagnosis"],
    priority: 8
  },
  {
    question: "What information do I need to provide when consulting with a doctor?",
    answer: "When scheduling a consultation, you'll need to provide basic information such as your symptoms, chief complaint, and any relevant medical history. This helps the doctor prepare for your consultation and provide better care.",
    category: "Appointments",
    tags: ["information", "symptoms", "medical history", "consultation"],
    priority: 7
  },
  {
    question: "Can I cancel or reschedule my consultation?",
    answer: "Yes, you can cancel or reschedule your consultation through your patient dashboard. We recommend doing so at least 24 hours in advance to allow other patients to use the time slot.",
    category: "Appointments",
    tags: ["cancel", "reschedule", "consultation", "dashboard"],
    priority: 6
  },
  {
    question: "How do I create an account?",
    answer: "To create an account, click the 'Sign Up' button on the homepage. You'll need to provide your email, create a password, and fill in basic profile information. Choose 'Patient' as your role unless you're a medical professional looking to join our platform.",
    category: "General",
    tags: ["account", "signup", "registration", "profile"],
    priority: 8
  },
  {
    question: "What specializations are available on the platform?",
    answer: "We have doctors from 18 different specializations including General Medicine, Cardiology, Dermatology, Neurology, Pediatrics, Psychiatry, Orthopedics, and many more. You can browse all available specializations on our doctors page.",
    category: "Doctors",
    tags: ["specializations", "doctors", "medical fields", "expertise"],
    priority: 7
  },
  {
    question: "Is my personal health information secure?",
    answer: "Yes, we take your privacy and security very seriously. All personal health information is encrypted and stored securely. We comply with healthcare privacy regulations and never share your information without your explicit consent.",
    category: "Privacy",
    tags: ["security", "privacy", "health information", "data protection"],
    priority: 9
  },
  {
    question: "Can I use the platform for emergency medical situations?",
    answer: "No, this platform is not designed for medical emergencies. If you're experiencing a medical emergency, please call your local emergency services (911 in the US) or go to the nearest emergency room immediately.",
    category: "Emergency",
    tags: ["emergency", "urgent", "911", "immediate care"],
    priority: 10
  },
  {
    question: "How do I view my consultation history?",
    answer: "You can view your consultation history by logging into your account and visiting the 'My Appointments' section in your patient dashboard. This shows all your past and upcoming consultations.",
    category: "General",
    tags: ["history", "appointments", "dashboard", "past consultations"],
    priority: 5
  },
  {
    question: "What should I do if I'm having technical issues with the platform?",
    answer: "If you're experiencing technical issues, try refreshing your browser first. If the problem persists, you can contact our support team through the chat feature or check if there are any known issues on our status page.",
    category: "Technical",
    tags: ["technical issues", "support", "troubleshooting", "browser"],
    priority: 6
  },
  {
    question: "Can I get a second opinion from another doctor?",
    answer: "Absolutely! You can schedule consultations with multiple doctors to get different perspectives on your health concerns. Each doctor brings their own expertise and experience to help you make informed decisions about your health.",
    category: "Medical",
    tags: ["second opinion", "multiple doctors", "consultation", "medical advice"],
    priority: 5
  }
];

async function createAdminAndFAQs() {
  try {
    console.log('🚀 Setting up admin credentials and FAQ system...\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    let adminUser;

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      adminUser = existingAdmin;
    } else {
      // Create admin user
      adminUser = new User({
        email: 'admin@medibot.com',
        password: 'admin123456', // This will be hashed automatically
        role: 'admin',
        profile: {
          firstName: 'System',
          lastName: 'Administrator',
          phone: '+1-555-0000'
        },
        emailVerified: true,
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@medibot.com');
      console.log('🔑 Password: admin123456');
      console.log('⚠️  Please change the password after first login\n');
    }

    // Clear existing FAQs
    await FAQ.deleteMany({});
    console.log('🗑️  Cleared existing FAQs');

    // Create default FAQs
    let createdCount = 0;
    for (const faqData of defaultFAQs) {
      const faq = new FAQ({
        ...faqData,
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      });
      
      await faq.save();
      createdCount++;
      console.log(`📝 Created FAQ: "${faqData.question.substring(0, 50)}..."`);
    }

    console.log(`\n✅ Successfully created ${createdCount} FAQs!`);

    // Display FAQ summary by category
    const categories = await FAQ.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 FAQs by category:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} FAQs`);
    });

    console.log('\n🎉 Admin setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Login as admin to manage FAQs');
    console.log('2. The FAQ system is now ready for RAG integration');
    console.log('3. FAQs will be automatically searched when users ask questions');

  } catch (error) {
    console.error('❌ Error setting up admin and FAQs:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
createAdminAndFAQs();