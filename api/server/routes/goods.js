const express = require('express');
const {
  getGoodsListController,
  createGoodsController,
  deleteGoodsController,
  switchStatusController,
  // updateGoods
} = require('~/server/controllers/GoodsController');

const { requireJwtAuth, checkAdmin, checkBan } = require('~/server/middleware');

const router = express.Router();

router.get('/list', requireJwtAuth, checkAdmin, checkBan, getGoodsListController);
router.post('/create', requireJwtAuth, checkAdmin, checkBan, createGoodsController);
router.post('/delete', requireJwtAuth, checkAdmin, checkBan, deleteGoodsController);
router.post('/switchStatus', requireJwtAuth, checkAdmin, checkBan, switchStatusController);
// router.post('/update', requireJwtAuth, checkAdmin, checkBan, updateGoods);

module.exports = router;
