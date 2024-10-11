const express = require('express');
const { wxPayNotify, createOrderPC } = require('~/server/controllers/WeixinPayController');
const { checkBan } = require('~/server/middleware');

const router = express.Router();

// 微信支付
router.post('/wxCreateOrder', checkBan, createOrderPC);
router.get('/wxNotify', checkBan, wxPayNotify);

module.exports = router;
