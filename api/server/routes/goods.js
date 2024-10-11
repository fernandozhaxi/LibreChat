const express = require('express');
const {
  getGoodsList,
  addGoods,
  deleteGoods,
  updateGoods } = require('~/server/controllers/GoodsController');
const { requireJwtAuth, checkAdmin, checkBan } = require('~/server/middleware');

const router = express.Router();

router.get('/list', requireJwtAuth, checkAdmin, checkBan, getGoodsList);
router.post('/add', requireJwtAuth, checkAdmin, checkBan, addGoods);
router.post('/delete', requireJwtAuth, checkAdmin, checkBan, deleteGoods);
router.post('/update', requireJwtAuth, checkAdmin, checkBan, updateGoods);

module.exports = router;
