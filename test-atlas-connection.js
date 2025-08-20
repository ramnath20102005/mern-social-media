const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('Testing MongoDB Atlas connection...');
console.log('MONGODB_URL:', process.env.MONGODB_URL ? 'Found' : 'Not found');

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useCreateIndex: true,
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ MongoDB Atlas connection successful!');
        console.log('Database:', mongoose.connection.name);
        console.log('Host:', mongoose.connection.host);
        
        // Test creating a simple document
        const testSchema = new mongoose.Schema({ test: String });
        const TestModel = mongoose.model('Test', testSchema);
        
        const testDoc = new TestModel({ test: 'Atlas connection test' });
        await testDoc.save();
        console.log('✅ Document saved successfully!');
        
        // Clean up
        await TestModel.deleteOne({ test: 'Atlas connection test' });
        console.log('✅ Test document cleaned up!');
        
        await mongoose.disconnect();
        console.log('✅ Connection closed successfully!');
        
    } catch (error) {
        console.error('❌ MongoDB Atlas connection failed:', error.message);
        if (error.message.includes('Authentication failed')) {
            console.log('💡 Make sure to replace <db_password> with your actual password in .env file');
        }
    }
}

testConnection();
