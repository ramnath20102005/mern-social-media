const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  console.log('🔍 Testing MongoDB connection...');
  console.log('Connecting to:', process.env.MONGODB_URL);
  
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.map(c => c.name));
    
    // Basic database stats
    const stats = await mongoose.connection.db.stats();
    console.log('💾 Database Stats:', {
      name: stats.db,
      collections: stats.collections,
      objects: stats.objects,
      dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check if your MongoDB Atlas cluster is running');
    console.log('2. Verify your connection string is correct');
    console.log('3. Make sure your IP is whitelisted in MongoDB Atlas');
    console.log('4. Check if your database user has the correct permissions');
    process.exit(1);
  }
};

testConnection();
