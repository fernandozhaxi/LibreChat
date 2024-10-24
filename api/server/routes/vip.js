const express = require('express');
const {
  openVipController,
  vipInfoController,
} = require('~/server/controllers/VipController');
const { requireJwtAuth, checkAdmin, checkBan } = require('~/server/middleware');

const router = express.Router();
router.post('/open', requireJwtAuth, checkAdmin, checkBan, openVipController);
router.get('/', requireJwtAuth, checkBan, vipInfoController);

module.exports = router;
