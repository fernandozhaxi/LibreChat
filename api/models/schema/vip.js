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
  goodsLevel: {
    type: String,
    required: true,
  },
  goodsType: {
    type: String,
    required: true,
  },
  goodsName: {
    type: String,
    required: true,
  },
  vipStartTime: {
    type: String,
    required: true,
  },
  vipEndTime: {
    type: String,
    required: true,
  },
});

module.exports = vipSchema;
