const express = require('express');
const { getOrderList,
  createOrder,
  updateOrder,
  deleteOrder,
  closeOrder,
  refundOrder } = require('~/server/controllers/OrderController');
const { requireJwtAuth, checkAdmin, checkBan } = require('~/server/middleware');

const router = express.Router();

router.get('/list', requireJwtAuth, checkAdmin, checkBan, getOrderList);
router.post('/createOrder', requireJwtAuth, checkAdmin, checkBan, createOrder);
router.post('/updateOrder', requireJwtAuth, checkAdmin, checkBan, updateOrder);
router.delete('/deleteOrder', requireJwtAuth, checkAdmin, checkBan, deleteOrder);
router.post('/closeOrder', requireJwtAuth, checkAdmin, checkBan, closeOrder);
router.post('/refundOrder', requireJwtAuth, checkAdmin, checkBan, refundOrder);

module.exports = router;
