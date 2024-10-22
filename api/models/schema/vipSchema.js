const mongoose = require('mongoose');

const vipSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  goodsId: { // 对应的商品ID
    type: String,
    required: true,
  },
  goodsName: {
    type: String,
    required: true,
  },
  goodsLevel: {
    type: String,
    required: true,
  },
  expiredTime: {
    type: Date,
    required: true,
  },
});

module.exports = vipSchema;
