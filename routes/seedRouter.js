const router = require('express').Router();
const seedCtrl = require('../controllers/seedCtrl');

// POST /api/seed/reset - clears and seeds demo data (disabled in production by controller)
router.post('/seed/reset', seedCtrl.resetAndSeed);

module.exports = router;
