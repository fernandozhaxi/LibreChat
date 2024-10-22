const express = require('express');
const {
  openVipController } = require('~/server/controllers/VipController');
const { requireJwtAuth, checkAdmin, checkBan } = require('~/server/middleware');

const router = express.Router();
router.post('/open', requireJwtAuth, checkAdmin, checkBan, openVipController);

module.exports = router;
