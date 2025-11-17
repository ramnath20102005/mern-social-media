const express = require("express");
const router = express.Router({ mergeParams: true });
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/admin");
const adminCtrl = require("../controllers/adminCtrl");

// Totals and spam management
router.get('/get_total_users', auth, adminOnly, adminCtrl.getTotalUsers);
router.get("/get_total_posts", auth, adminOnly, adminCtrl.getTotalPosts);
router.get("/get_total_comments", auth, adminOnly, adminCtrl.getTotalComments);
router.get("/get_total_likes", auth, adminOnly, adminCtrl.getTotalLikes);
router.get("/get_total_spam_posts", auth, adminOnly, adminCtrl.getTotalSpamPosts);
router.get("/get_spam_posts", auth, adminOnly, adminCtrl.getSpamPosts);
router.delete("/delete_spam_posts/:id", auth, adminOnly, adminCtrl.deleteSpamPost);

// Active users count (last 7 days)
router.get("/get_total_active_users", auth, adminOnly, adminCtrl.getTotalActiveUsers);

// Users management
router.get("/admin/users", auth, adminOnly, adminCtrl.getUsers);
router.patch("/admin/users/:id/block", auth, adminOnly, adminCtrl.blockUser);
router.patch("/admin/users/:id/unblock", auth, adminOnly, adminCtrl.unblockUser);
router.post("/admin/users/:id/reset_password", auth, adminOnly, adminCtrl.resetUserPassword);
router.post("/admin/users/:id/impersonate", auth, adminOnly, adminCtrl.impersonateUser);

// Dashboard and details
router.get("/admin/stats", auth, adminOnly, adminCtrl.getDashboardStats);
router.get("/admin/comments", auth, adminOnly, adminCtrl.getCommentsDetail);
router.get("/admin/posts", auth, adminOnly, adminCtrl.getAllPosts);
router.get("/admin/likes", auth, adminOnly, adminCtrl.getLikesDetail);

module.exports = router;
