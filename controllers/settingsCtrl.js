const Users = require('../models/userModel');
const bcrypt = require('bcrypt');

const settingsCtrl = {
    // Get user settings
    getUserSettings: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            const settings = {
                theme: user.theme || 'light',
                language: user.language || 'en',
                autoPlayVideos: user.autoPlayVideos !== undefined ? user.autoPlayVideos : true,
                profileVisibility: user.profileVisibility || 'public',
                showOnlineStatus: user.showOnlineStatus !== undefined ? user.showOnlineStatus : true,
                pushNotifications: user.pushNotifications !== undefined ? user.pushNotifications : true,
                emailNotifications: user.emailNotifications !== undefined ? user.emailNotifications : false,
                soundEffects: user.soundEffects !== undefined ? user.soundEffects : true,
                twoFactorAuth: user.twoFactorAuth || false
            };

            res.json({ settings });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Update general settings
    updateGeneralSettings: async (req, res) => {
        try {
            const { theme, language, autoPlayVideos } = req.body;
            
            const updateData = {};
            if (theme !== undefined) updateData.theme = theme;
            if (language !== undefined) updateData.language = language;
            if (autoPlayVideos !== undefined) updateData.autoPlayVideos = autoPlayVideos;

            const user = await Users.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            res.json({ 
                msg: "General settings updated successfully.",
                user: {
                    ...user._doc,
                    theme: user.theme,
                    language: user.language,
                    autoPlayVideos: user.autoPlayVideos
                }
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Update privacy settings
    updatePrivacySettings: async (req, res) => {
        try {
            const { profileVisibility, showOnlineStatus } = req.body;
            
            const updateData = {};
            if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
            if (showOnlineStatus !== undefined) updateData.showOnlineStatus = showOnlineStatus;

            const user = await Users.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            res.json({ 
                msg: "Privacy settings updated successfully.",
                user
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Update notification settings
    updateNotificationSettings: async (req, res) => {
        try {
            const { pushNotifications, emailNotifications, soundEffects } = req.body;
            
            const updateData = {};
            if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
            if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
            if (soundEffects !== undefined) updateData.soundEffects = soundEffects;

            const user = await Users.findByIdAndUpdate(
                req.user.id,
                updateData,
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            res.json({ 
                msg: "Notification settings updated successfully.",
                user
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Change password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ msg: "Please provide current and new password." });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ msg: "New password must be at least 6 characters long." });
            }

            const user = await Users.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            // Check current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: "Current password is incorrect." });
            }

            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 12);

            await Users.findByIdAndUpdate(req.user.id, {
                password: passwordHash
            });

            res.json({ msg: "Password changed successfully." });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Enable/Disable Two-Factor Authentication
    toggleTwoFactorAuth: async (req, res) => {
        try {
            const { enable } = req.body;

            const user = await Users.findByIdAndUpdate(
                req.user.id,
                { twoFactorAuth: enable },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            res.json({ 
                msg: `Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully.`,
                user
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Download user data
    downloadUserData: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            // Get user's posts, comments, etc. (you can expand this)
            const userData = {
                profile: user,
                exportDate: new Date().toISOString(),
                // Add more data as needed
            };

            res.json({ 
                msg: "User data prepared for download.",
                data: userData
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    // Delete account
    deleteAccount: async (req, res) => {
        try {
            const { password, confirmDelete } = req.body;

            if (!password || confirmDelete !== 'DELETE') {
                return res.status(400).json({ 
                    msg: "Please provide password and type 'DELETE' to confirm." 
                });
            }

            const user = await Users.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ msg: "User not found." });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: "Password is incorrect." });
            }

            // Delete user account
            await Users.findByIdAndDelete(req.user.id);

            res.json({ msg: "Account deleted successfully." });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
};

module.exports = settingsCtrl;
