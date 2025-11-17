const Users = require('../models/userModel');
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization") || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : authHeader.trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                msg: "No authentication token, authorization denied"
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            if (!decoded || !decoded.id) {
                return res.status(401).json({
                    success: false,
                    msg: "Invalid token"
                });
            }

            const user = await Users.findById(decoded.id).select("-password");

            if (!user) {
                return res.status(401).json({
                    success: false,
                    msg: "User not found"
                });
            }

            if (user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    msg: "Your account is blocked. Please contact support."
                });
            }

            req.user = user;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    msg: "Session expired. Please log in again."
                });
            }
            return res.status(401).json({
                success: false,
                msg: "Invalid token"
            });
        }
    } catch (err) {
        return res.status(500).json({
            success: false,
            msg: err.message || "Server error"
        });
    }
};

module.exports = auth;