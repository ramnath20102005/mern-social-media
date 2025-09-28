const router = require("express").Router();
const auth = require("../middleware/auth");
const messageCtrl = require("../controllers/messageCtrl");

router.post("/message", auth, messageCtrl.createMessage);

router.get("/conversations", auth, messageCtrl.getConversations);

router.get("/message/:id", auth, messageCtrl.getMessages);

router.patch("/message/delivered", auth, messageCtrl.markAsDelivered);

router.patch("/message/read", auth, messageCtrl.markAsRead);

router.delete("/message/:messageId", auth, messageCtrl.deleteMessage);

// Group messaging routes
router.post("/group-message", auth, messageCtrl.createGroupMessage);
router.get("/group-messages/:groupId", auth, messageCtrl.getGroupMessages);
router.patch("/group-message/:messageId/read", auth, messageCtrl.markGroupMessageRead);

module.exports = router;
