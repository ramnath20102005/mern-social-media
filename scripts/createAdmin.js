const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social_media', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const User = require('../models/userModel');

const createAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@com' });
        
        if (adminExists) {
            console.log('Admin user already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            await User.findByIdAndUpdate(adminExists._id, {
                password: hashedPassword,
                role: 'admin',
                isBlocked: false
            });
            
            console.log('Admin user updated successfully!');
        } else {
            // Create new admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            const adminUser = new User({
                fullname: 'Admin User',
                username: 'admin',
                email: 'admin@com',
                password: hashedPassword,
                gender: 'male',
                role: 'admin',
                isBlocked: false
            });
            
            await adminUser.save();
            console.log('Admin user created successfully!');
        }
        
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdmin();
