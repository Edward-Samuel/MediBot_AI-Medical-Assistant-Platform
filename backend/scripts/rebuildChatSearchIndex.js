const mongoose = require('mongoose');
const ChatHistory = require('../models/ChatHistory');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medibot', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function rebuildChatSearchIndex() {
  try {
    console.log('🔧 Rebuilding chat history search index...\n');

    // Drop existing text indexes
    try {
      await ChatHistory.collection.dropIndex('title_text_messages.content_text');
      console.log('✅ Dropped existing text search index');
    } catch (error) {
      console.log('ℹ️  No existing text search index found (this is normal)');
    }

    // Create new text search index
    await ChatHistory.collection.createIndex(
      { 
        title: 'text', 
        'messages.content': 'text' 
      },
      {
        weights: {
          title: 10,
          'messages.content': 1
        },
        name: 'chat_search_index'
      }
    );
    console.log('✅ Created new text search index');

    // List all indexes to verify
    const indexes = await ChatHistory.collection.listIndexes().toArray();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Test the index with a sample search
    const sampleCount = await ChatHistory.countDocuments({
      $text: { $search: 'test' }
    });
    console.log(`\n🧪 Test search found ${sampleCount} documents containing 'test'`);

    console.log('\n🎉 Chat history search index rebuild completed!');

  } catch (error) {
    console.error('❌ Error rebuilding search index:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

rebuildChatSearchIndex();